<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function app_base_path(): string
{
    $basePath = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $basePath = rtrim($basePath, '/');
    if ($basePath === '.' || $basePath === '/') {
        return '';
    }
    return $basePath;
}

function is_api_request(): bool
{
    $requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');
    $accept = (string)($_SERVER['HTTP_ACCEPT'] ?? '');
    $requestedWith = strtolower((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''));

    return strpos($requestUri, '/api/') !== false
        || strpos($accept, 'application/json') !== false
        || $requestedWith === 'xmlhttprequest';
}

function ensure_app_schema(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $schemaUpdates = [
        'users' => [
            'phone' => 'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER full_name',
            'address' => 'ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone',
            'birth_date' => 'ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER address',
            'gender' => 'ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL AFTER birth_date',
            'profile_photo' => 'ALTER TABLE users ADD COLUMN profile_photo MEDIUMTEXT NULL AFTER gender',
            'session_version' => 'ALTER TABLE users ADD COLUMN session_version INT NULL AFTER last_login',
        ],
        'enrollees' => [
            'guardian_contact' => 'ALTER TABLE enrollees ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone',
            'fb_name' => 'ALTER TABLE enrollees ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact',
            'enrollment_type' => 'ALTER TABLE enrollees ADD COLUMN enrollment_type ENUM("new", "returning") NOT NULL DEFAULT "new" AFTER status',
            'existing_student_id' => 'ALTER TABLE enrollees ADD COLUMN existing_student_id VARCHAR(20) NULL AFTER pre_reg_number',
        ],
        'students' => [
            'guardian_contact' => 'ALTER TABLE students ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone',
            'fb_name' => 'ALTER TABLE students ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact',
            'profile_photo' => 'ALTER TABLE students ADD COLUMN profile_photo TEXT NULL AFTER address',
            'student_type' => 'ALTER TABLE students ADD COLUMN student_type ENUM("regular", "irregular") NOT NULL DEFAULT "regular"',
            'import_semester' => 'ALTER TABLE students ADD COLUMN import_semester TINYINT(1) NULL DEFAULT NULL AFTER is_account_active',
            'progression_status' => 'ALTER TABLE students ADD COLUMN progression_status ENUM("enrolled","pending_progression","approved_progression") DEFAULT "enrolled" AFTER import_semester',
        ],
    ];

    foreach ($schemaUpdates as $table => $columns) {
        $tableExistsStmt = $pdo->query('SHOW TABLES LIKE ' . $pdo->quote($table));
        if (!$tableExistsStmt->fetchColumn()) {
            continue;
        }

        foreach ($columns as $column => $sql) {
            $columnStmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE " . $pdo->quote($column));
            if (!$columnStmt->fetch(PDO::FETCH_ASSOC)) {
                $pdo->exec($sql);
            }
        }
    }

    $settingsTableStmt = $pdo->query('SHOW TABLES LIKE ' . $pdo->quote('enrollment_settings'));
    if ($settingsTableStmt->fetchColumn()) {
        $hasSettingsRow = (int)$pdo->query('SELECT COUNT(*) FROM enrollment_settings')->fetchColumn();
        if ($hasSettingsRow === 0) {
            $pdo->exec("INSERT INTO enrollment_settings (id, auto_close_accounts, strict_enrollment_windows, auto_progression, system_close_date) VALUES (1, 'never', 0, 1, NULL)");
        }
    }
}

function record_security_event(PDO $pdo, ?int $userId, string $action, string $description, string $entityType = 'security', ?int $entityId = null): void
{
    try {
        $ipAddress = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
        if (strpos($ipAddress, ',') !== false) {
            $ipAddress = trim(explode(',', $ipAddress)[0]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $action,
            $description,
            $entityType,
            $entityId,
            $ipAddress !== '' ? $ipAddress : null,
        ]);
    } catch (Throwable $e) {
        // Ignore logging errors so the primary request can continue.
    }
}

function deny_access(string $message, int $statusCode = 401): void
{
    $redirectReason = null;
    if (session_status() === PHP_SESSION_ACTIVE) {
        $redirectReason = $_SESSION['_auth_failure_reason'] ?? null;
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_unset();
        session_destroy();
    }

    if (is_api_request()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => $message]);
        exit;
    }

    $redirectUrl = app_base_path() . '/login';
    if ($redirectReason === 'session-replaced') {
        $redirectUrl .= '?reason=session-replaced';
    }

    header('Location: ' . $redirectUrl);
    exit;
}

function session_user_is_still_active(): bool
{
    $sessionUser = $_SESSION['user'] ?? null;
    if (!is_array($sessionUser) || empty($sessionUser['id'])) {
        return false;
    }

    unset($_SESSION['_auth_failure_reason']);

    try {
        $pdo = require __DIR__ . '/db.php';
        ensure_app_schema($pdo);

        $stmt = $pdo->prepare('SELECT id, email, role, role_id, is_active, full_name, username, phone, address, birth_date, gender, profile_photo, session_version FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([(int)$sessionUser['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || (int)$user['is_active'] !== 1) {
            return false;
        }

        $databaseSessionVersion = $user['session_version'] !== null ? (int)$user['session_version'] : null;
        $activeSessionVersion = array_key_exists('session_version', $sessionUser) && $sessionUser['session_version'] !== null
            ? (int)$sessionUser['session_version']
            : null;

        if ($databaseSessionVersion !== null && $activeSessionVersion !== $databaseSessionVersion) {
            $_SESSION['_auth_failure_reason'] = 'session-replaced';
            return false;
        }

        $_SESSION['user']['email'] = (string)$user['email'];
        $_SESSION['user']['role'] = (string)$user['role'];
        $_SESSION['user']['role_id'] = $user['role_id'] ? (int)$user['role_id'] : null;
        $_SESSION['user']['session_version'] = $databaseSessionVersion;
        $_SESSION['user']['fullName'] = trim((string)($user['full_name'] ?? $user['username'] ?? 'User'));
        $_SESSION['user']['name'] = $_SESSION['user']['fullName'];
        $_SESSION['user']['phone'] = $user['phone'] ?? null;
        $_SESSION['user']['address'] = $user['address'] ?? null;
        $_SESSION['user']['birth_date'] = $user['birth_date'] ?? null;
        $_SESSION['user']['gender'] = $user['gender'] ?? null;
        $_SESSION['user']['photo'] = $user['profile_photo'] ?? null;
        $_SESSION['user']['profile_photo'] = $user['profile_photo'] ?? null;

        // Reload permissions from database so changes take effect immediately
        $permissions = [];
        $roleId = $_SESSION['user']['role_id'];
        if ($roleId) {
            $permStmt = $pdo->prepare('SELECT permission_module_slug, action FROM role_permissions WHERE role_id = ? AND is_allowed = 1');
            $permStmt->execute([$roleId]);
            foreach ($permStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $slug = $row['permission_module_slug'];
                if (!isset($permissions[$slug])) {
                    $permissions[$slug] = [];
                }
                $permissions[$slug][$row['action']] = true;
            }
        }
        $_SESSION['user']['permissions'] = $permissions;

        if (normalize_role_name((string)$user['role']) === 'student') {
            $studentStmt = $pdo->prepare('SELECT year_level, current_semester, profile_photo, status, is_account_active FROM students WHERE email = ? LIMIT 1');
            $studentStmt->execute([(string)$user['email']]);
            $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

            if (!$student) {
                return false;
            }

            $studentStatus = strtolower((string)($student['status'] ?? ''));
            if ((int)($student['is_account_active'] ?? 0) !== 1 || $studentStatus !== 'active') {
                return false;
            }

            $_SESSION['user']['year_level'] = (int)($student['year_level'] ?? 1);
            $_SESSION['user']['current_semester'] = (int)($student['current_semester'] ?? 1);
            $_SESSION['user']['photo'] = $student['profile_photo'] ?? null;
        }

        return true;
    } catch (Throwable $e) {
        return false;
    }
}

function require_login(): void
{
    if (!isset($_SESSION['user'])) {
        deny_access('Authentication required', 401);
    }

    if (!session_user_is_still_active()) {
        $failureReason = $_SESSION['_auth_failure_reason'] ?? null;
        if ($failureReason === 'session-replaced') {
            deny_access('Your account was signed in on another browser.', 401);
        }

        deny_access('Account is inactive and cannot be accessed', 403);
    }
}

function current_user_permissions(): array
{
    return $_SESSION['user']['permissions'] ?? [];
}

function normalize_role_name(string $role): string
{
    return preg_replace('/[^a-z0-9]/', '', strtolower(trim($role)));
}

function current_user_role(): string
{
    return normalize_role_name((string)($_SESSION['user']['role'] ?? ''));
}

function role_default_view_permissions(): array
{
    return [
        'student' => [
            'dashboard' => true,
            'subjects' => true,
            'settings' => true,
            'profile' => true,
            'security' => true,
        ],
        'staff' => [
            'dashboard' => true,
            'curriculum' => true,
            'subjects' => true,
            'settings' => true,
            'profile' => true,
            'security' => true,
        ],
        'professor' => [
            'dashboard' => true,
            'curriculum' => true,
            'subjects' => true,
            'settings' => true,
            'profile' => true,
            'security' => true,
            'student' => true,
        ],
    ];
}

function has_permission(string $module, string $action = 'view'): bool
{
    $role = current_user_role();

    if ($role === 'superadmin') {
        return true;
    }

    if ($role === 'student' && $module === 'curriculum') {
        return false;
    }

    $permissions = current_user_permissions();
    if (isset($permissions[$module][$action]) && $permissions[$module][$action] === true) {
        return true;
    }

    if ($module === 'subjects' && isset($permissions['curriculum'][$action]) && $permissions['curriculum'][$action] === true) {
        return true;
    }

    if ($action === 'view') {
        $defaults = role_default_view_permissions();
        $role = current_user_role();
        return isset($defaults[$role][$module]) && $defaults[$role][$module] === true;
    }

    return false;
}

function require_permission(string $module, string $action = 'view'): void
{
    require_login();

    if (!has_permission($module, $action)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Forbidden']);
        exit;
    }
}

function can_view_module(string $module): bool
{
    return has_permission($module, 'view');
}

function resolve_page_module(string $page): ?string
{
    switch ($page) {
        case 'dashboard':
        case 'profile':
        case 'security':
            return null;
        case 'student':
            return 'student';
        case 'course':
            return 'course';
        case 'enrollees':
            return 'enrollees';
        case 'enrollment':
            return 'enrollment';
        case 'curriculum':
        case 'curriculum-1st':
        case 'curriculum-2nd':
        case 'curriculum-3rd':
        case 'curriculum-4th':
            return 'curriculum';
        case 'subjects':
        case 'offer':
        case 'offered':
            return 'subjects';
        case 'schedule':
            return 'schedule';
        case 'settings':
        case 'records':
        case 'enrollmentsettings':
        case 'notification':
            return 'settings';
        case 'management':
            return 'rolemanagement';
        case 'professor':
            return 'professor';
        case 'administrator':
            return 'administrator';
        default:
            return null;
    }
}
