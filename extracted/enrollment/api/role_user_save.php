<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
require_permission('rolemanagement', 'edit');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $_POST;
}

function ensure_user_profile_columns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $columns = [
        'phone' => 'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER email',
        'address' => 'ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone',
        'birth_date' => 'ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER address',
        'gender' => 'ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL AFTER birth_date',
        'profile_photo' => 'ALTER TABLE users ADD COLUMN profile_photo MEDIUMTEXT NULL AFTER gender',
    ];

    foreach ($columns as $column => $sql) {
        $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE " . $pdo->quote($column));
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->exec($sql);
        }
    }
}

function default_password_for_role(string $roleName): string
{
    $normalized = preg_replace('/[^a-z0-9]/', '', strtolower(trim($roleName)));
    $defaults = [
        'superadmin' => 'superadmin123',
        'admin' => 'admin123',
        'staff' => 'staff123',
        'professor' => 'professor123',
        'student' => 'student123',
    ];

    return $defaults[$normalized] ?? 'password123';
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    ensure_user_profile_columns($pdo);

    $payload = json_input();

    $roleId = (int)($payload['role_id'] ?? 0);
    $editUserId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
    $fullName = trim((string)($payload['full_name'] ?? ''));
    $username = trim((string)($payload['username'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $phone = trim((string)($payload['phone'] ?? ''));
    $address = trim((string)($payload['address'] ?? ''));
    $birthDate = trim((string)($payload['birth_date'] ?? ''));
    $gender = trim((string)($payload['gender'] ?? ''));
    $profilePhoto = (string)($payload['profile_photo'] ?? '');
    $password = (string)($payload['password'] ?? '');
    $confirmPassword = (string)($payload['confirm_password'] ?? '');

    if ($roleId <= 0 || $fullName === '' || $username === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Role, name, and ID are required']);
        exit;
    }

    $roleStmt = $pdo->prepare('SELECT id, name FROM roles WHERE id = ? AND is_active = 1 LIMIT 1');
    $roleStmt->execute([$roleId]);
    $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

    if (!$role) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Role not found']);
        exit;
    }

    // ---- UPDATE MODE ----
    if ($editUserId > 0) {
        $existingStmt = $pdo->prepare('SELECT id, username, email FROM users WHERE id = ? LIMIT 1');
        $existingStmt->execute([$editUserId]);
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'User not found']);
            exit;
        }

        // Password: blank means keep existing
        if ($password !== '') {
            if ($password !== $confirmPassword) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Password and confirm password do not match']);
                exit;
            }
        }

        // Check uniqueness of username/email excluding this user
        $dupStmt = $pdo->prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ? LIMIT 1');
        $targetEmail = $email !== '' ? $email : $existing['email'];
        $dupStmt->execute([$username, $targetEmail, $editUserId]);
        if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Another user with that ID or email already exists']);
            exit;
        }

        $updateFields = [
            'full_name' => $fullName,
            'username' => $username,
            'role' => (string)$role['name'],
            'role_id' => (int)$role['id'],
            'phone' => $phone !== '' ? $phone : null,
            'address' => $address !== '' ? $address : null,
            'birth_date' => $birthDate !== '' ? $birthDate : null,
            'gender' => $gender !== '' ? $gender : null,
        ];
        if ($profilePhoto !== '') {
            $updateFields['profile_photo'] = $profilePhoto;
        }
        if ($targetEmail !== '') {
            $updateFields['email'] = $targetEmail;
        }
        if ($password !== '') {
            $updateFields['password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        $setClauses = [];
        $params = [];
        foreach ($updateFields as $col => $val) {
            $setClauses[] = "$col = ?";
            $params[] = $val;
        }
        $params[] = $editUserId;

        $sql = 'UPDATE users SET ' . implode(', ', $setClauses) . ' WHERE id = ?';
        $pdo->prepare($sql)->execute($params);

        echo json_encode([
            'ok' => true,
            'message' => 'User updated successfully',
            'user' => [
                'id' => $editUserId,
                'user_id' => $username,
                'email' => $targetEmail,
                'name' => $fullName,
                'role_id' => (int)$role['id'],
                'roles' => [(string)$role['name']],
                'is_active' => true,
            ],
        ]);
        exit;
    }

    // ---- CREATE MODE ----

    if ($email === '') {
        $safeEmailBase = preg_replace('/[^a-z0-9]+/i', '.', strtolower($username));
        $email = trim($safeEmailBase, '.') . '@example.com';
    }

    $defaultPassword = default_password_for_role((string)$role['name']);
    if ($password === '') {
        $password = $defaultPassword;
    }
    if ($confirmPassword === '') {
        $confirmPassword = $password;
    }

    if ($password !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Password and confirm password do not match']);
        exit;
    }

    $checkStmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
    $checkStmt->execute([$username, $email]);
    if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'A user with that ID or email already exists']);
        exit;
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO users (username, email, password, full_name, role, role_id, is_active, phone, address, birth_date, gender, profile_photo)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)'
    );
    $insertStmt->execute([
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $fullName,
        (string)$role['name'],
        (int)$role['id'],
        $phone !== '' ? $phone : null,
        $address !== '' ? $address : null,
        $birthDate !== '' ? $birthDate : null,
        $gender !== '' ? $gender : null,
        $profilePhoto !== '' ? $profilePhoto : null,
    ]);

    $userId = (int)$pdo->lastInsertId();

    echo json_encode([
        'ok' => true,
        'message' => 'Role user saved successfully',
        'default_password' => $defaultPassword,
        'user' => [
            'id' => $userId,
            'user_id' => $username,
            'email' => $email,
            'name' => $fullName,
            'role_id' => (int)$role['id'],
            'roles' => [(string)$role['name']],
            'is_active' => true,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to save role user',
        'details' => $e->getMessage(),
    ]);
}
