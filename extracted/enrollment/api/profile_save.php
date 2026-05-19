<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';
$user = current_user();
$currentUserId = (int)($user['id'] ?? 0);

if ($currentUserId <= 0) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
    exit;
}

function ensureProfileColumns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) return;
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

try {
    ensureProfileColumns($pdo);

    $raw = file_get_contents('php://input') ?: '';
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $fullName = trim((string)($payload['full_name'] ?? ''));
    $phone = trim((string)($payload['phone'] ?? ''));
    $address = trim((string)($payload['address'] ?? ''));
    $birthDate = trim((string)($payload['birth_date'] ?? ''));
    $gender = trim((string)($payload['gender'] ?? ''));
    $profilePhoto = (string)($payload['profile_photo'] ?? '');

    if ($fullName === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Full name is required']);
        exit;
    }

    $updateFields = [
        'full_name' => $fullName,
        'phone' => $phone !== '' ? $phone : null,
        'address' => $address !== '' ? $address : null,
        'birth_date' => $birthDate !== '' ? $birthDate : null,
        'gender' => $gender !== '' ? $gender : null,
    ];

    if ($profilePhoto !== '') {
        $updateFields['profile_photo'] = $profilePhoto;
    }

    $setClauses = [];
    $params = [];
    foreach ($updateFields as $col => $val) {
        $setClauses[] = "$col = ?";
        $params[] = $val;
    }
    $params[] = $currentUserId;

    $sql = 'UPDATE users SET ' . implode(', ', $setClauses) . ' WHERE id = ?';
    $pdo->prepare($sql)->execute($params);

    echo json_encode(['ok' => true, 'message' => 'Profile updated successfully']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save profile', 'details' => $e->getMessage()]);
}
