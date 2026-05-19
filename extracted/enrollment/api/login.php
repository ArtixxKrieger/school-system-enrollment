<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$identifier = '';
if (isset($payload['email'])) {
    $identifier = trim((string)$payload['email']);
} elseif (isset($payload['userId'])) {
    $identifier = trim((string)$payload['userId']);
}
$password = isset($payload['password']) ? (string)$payload['password'] : '';

if ($identifier === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing credentials']);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function login_attempt_key(string $identifier): string
{
    return strtolower(trim($identifier));
}

function get_login_attempt_state(string $key): array
{
    $allAttempts = $_SESSION['login_attempts'] ?? [];
    $state = $allAttempts[$key] ?? [
        'count' => 0,
        'locked_until' => 0,
        'last_failure' => 0,
    ];

    return [
        'count' => (int)($state['count'] ?? 0),
        'locked_until' => (int)($state['locked_until'] ?? 0),
        'last_failure' => (int)($state['last_failure'] ?? 0),
    ];
}

function save_login_attempt_state(string $key, array $state): void
{
    $allAttempts = $_SESSION['login_attempts'] ?? [];
    $allAttempts[$key] = $state;
    $_SESSION['login_attempts'] = $allAttempts;
}

function clear_login_attempt_state(string $key): void
{
    if (!isset($_SESSION['login_attempts']) || !is_array($_SESSION['login_attempts'])) {
        return;
    }

    unset($_SESSION['login_attempts'][$key]);
}

function register_failed_login(PDO $pdo, string $key, string $identifier, ?int $userId = null): array
{
    $state = get_login_attempt_state($key);
    $state['count']++;
    $state['last_failure'] = time();

    $lockSchedule = [1 => 5, 2 => 15, 3 => 30, 4 => 60];
    $lockoutSeconds = $lockSchedule[$state['count']] ?? 120;
    $state['locked_until'] = time() + $lockoutSeconds;
    save_login_attempt_state($key, $state);

    $recommendForgotPassword = $state['count'] >= 3;
    if ($recommendForgotPassword && ($state['count'] === 3 || $state['count'] % 5 === 0) && function_exists('record_security_event')) {
        record_security_event(
            $pdo,
            $userId,
            'login_lockout',
            'Multiple failed login attempts detected for ' . $identifier . '. Forgot-password recovery is recommended.',
            'user',
            $userId
        );
    }

    return [
        'attempts' => $state['count'],
        'lockout_seconds' => $lockoutSeconds,
        'recommend_forgot_password' => $recommendForgotPassword,
    ];
}

$attemptKey = login_attempt_key($identifier);
$currentState = get_login_attempt_state($attemptKey);
$now = time();

if (($currentState['locked_until'] ?? 0) > $now) {
    $remainingSeconds = max(1, (int)$currentState['locked_until'] - $now);
    http_response_code(429);
    echo json_encode([
        'ok' => false,
        'error' => 'Please wait ' . $remainingSeconds . ' seconds before trying to log in again.',
        'attempts' => (int)$currentState['count'],
        'lockout_seconds' => $remainingSeconds,
        'recommend_forgot_password' => (int)$currentState['count'] >= 3,
    ]);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';
ensure_app_schema($pdo);

try {
    $identifierIsEmail = strpos($identifier, '@') !== false;

    $stmt = $pdo->prepare('
         SELECT u.id, u.username AS user_id, u.password AS password_hash, u.is_active, u.role AS legacy_role, u.role_id, u.full_name, u.email,
               u.phone, u.address, u.birth_date, u.gender, u.profile_photo,
             u.session_version,
               r.name AS role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE ' . ($identifierIsEmail ? 'u.email = :identifier' : 'u.username = :identifier') . '
        LIMIT 1
    ');
    $stmt->execute([':identifier' => $identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $failure = register_failed_login($pdo, $attemptKey, $identifier);
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'error' => 'Invalid credentials. Please wait ' . $failure['lockout_seconds'] . ' seconds before trying again.' . ($failure['recommend_forgot_password'] ? ' Forgot Password is recommended after repeated failed attempts.' : ''),
        ] + $failure);
        exit;
    }

    if ((int)$user['is_active'] !== 1) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Account is inactive and cannot be accessed']);
        exit;
    }

    $hash = (string)$user['password_hash'];
    if ($hash === '' || !password_verify($password, $hash)) {
        $failure = register_failed_login($pdo, $attemptKey, $identifier, (int)$user['id']);
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'error' => 'Invalid credentials. Please wait ' . $failure['lockout_seconds'] . ' seconds before trying again.' . ($failure['recommend_forgot_password'] ? ' Forgot Password is recommended after repeated failed attempts.' : ''),
        ] + $failure);
        exit;
    }

    clear_login_attempt_state($attemptKey);

    $userRole = strtolower((string)($user['role_name'] ?? $user['legacy_role'] ?? 'student'));
    $normalizedRole = preg_replace('/[^a-z0-9]/', '', $userRole);
    if ($normalizedRole === 'superadmin') {
        $userRole = 'superadmin';
    }

    $userName = trim((string)($user['full_name'] ?? $user['user_id'] ?? ''));

    $permissions = [];
    $roleId = null;
    if (!empty($user['role_id']) && is_numeric($user['role_id'])) {
        $roleId = (int)$user['role_id'];
    } elseif (!empty($user['legacy_role'])) {
        $roleIdStmt = $pdo->prepare('SELECT id FROM roles WHERE name = ? LIMIT 1');
        $roleIdStmt->execute([(string)$user['legacy_role']]);
        $foundRoleId = $roleIdStmt->fetchColumn();
        if ($foundRoleId !== false) {
            $roleId = (int)$foundRoleId;
        }
    }

    if (!empty($roleId)) {
        $permissionStmt = $pdo->prepare(
            'SELECT permission_module_slug, action
             FROM role_permissions
             WHERE role_id = ? AND is_allowed = 1'
        );
        $permissionStmt->execute([$roleId]);
        $permissionRows = $permissionStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($permissionRows as $permissionRow) {
            $moduleSlug = $permissionRow['permission_module_slug'];
            $action = $permissionRow['action'];
            if (!isset($permissions[$moduleSlug])) {
                $permissions[$moduleSlug] = [];
            }
            $permissions[$moduleSlug][$action] = true;
        }
    }

    $sessionUser = [
        'id' => (int)$user['id'],
        'userId' => (string)$user['user_id'],
        'email' => (string)$user['email'],
        'role' => $userRole,
        'role_id' => $roleId,
        'fullName' => $userName,
        'name' => $userName,
        'phone' => $user['phone'] ?? null,
        'address' => $user['address'] ?? null,
        'birth_date' => $user['birth_date'] ?? null,
        'gender' => $user['gender'] ?? null,
        'photo' => $user['profile_photo'] ?? null,
        'profile_photo' => $user['profile_photo'] ?? null,
        'permissions' => $permissions,
    ];

    if ($userRole === 'student') {
        $studentInfoStmt = $pdo->prepare(
            'SELECT c.course_code, s.year_level, s.current_semester, s.profile_photo, s.status, s.is_account_active, s.progression_status
             FROM students s
             JOIN courses c ON s.course_id = c.id
             WHERE s.email = ? LIMIT 1'
        );
        $studentInfoStmt->execute([(string)$user['email']]);
        $studentInfo = $studentInfoStmt->fetch(PDO::FETCH_ASSOC);

        $studentStatus = strtolower((string)($studentInfo['status'] ?? ''));
        if (!$studentInfo || (int)($studentInfo['is_account_active'] ?? 0) !== 1 || $studentStatus !== 'active') {
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => 'Student account is inactive and cannot be accessed']);
            exit;
        }

        $sessionUser['course_code'] = (string)$studentInfo['course_code'];
        $sessionUser['year_level'] = (int)$studentInfo['year_level'];
        $sessionUser['current_semester'] = (int)$studentInfo['current_semester'];
        $sessionUser['progression_status'] = (string)($studentInfo['progression_status'] ?? 'enrolled');
        $sessionUser['photo'] = $studentInfo['profile_photo'] ?: null;
    }

    $updateLoginStmt = $pdo->prepare(
        'UPDATE users
         SET session_version = LAST_INSERT_ID(COALESCE(session_version, 0) + 1),
             last_login = NOW()
         WHERE id = ?'
    );
    $updateLoginStmt->execute([(int)$user['id']]);
    $newSessionVersion = (int)$pdo->query('SELECT LAST_INSERT_ID()')->fetchColumn();

    session_regenerate_id(true);
    unset($_SESSION['_auth_failure_reason']);
    $sessionUser['session_version'] = $newSessionVersion;
    $_SESSION['user'] = $sessionUser;

    echo json_encode([
        'ok' => true,
        'user' => [
            'id' => (int)$user['id'],
            'userId' => (string)$user['user_id'],
            'role' => $userRole,
            'fullName' => $userName,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Login failed',
        'details' => $e->getMessage(),
    ]);
}

