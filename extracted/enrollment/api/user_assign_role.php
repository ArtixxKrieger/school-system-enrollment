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

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$userId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
$roleId = isset($payload['role_id']) ? (int)$payload['role_id'] : 0;

if ($userId <= 0 || $roleId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing user_id or role_id']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $roleStmt = $pdo->prepare('SELECT name FROM roles WHERE id = ? AND is_active = 1');
    $roleStmt->execute([$roleId]);
    $role = $roleStmt->fetch(PDO::FETCH_ASSOC);
    if (!$role) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Role not found']);
        exit;
    }

    $update = $pdo->prepare('UPDATE users SET role_id = :role_id, role = :role_name WHERE id = :user_id');
    $update->execute([
        ':role_id' => $roleId,
        ':role_name' => $role['name'],
        ':user_id' => $userId,
    ]);

    $userStmt = $pdo->prepare('SELECT id, username AS user_id, email, full_name, is_active, role_id, role FROM users WHERE id = ?');
    $userStmt->execute([$userId]);
    $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userRow) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'User not found after update']);
        exit;
    }

    $roles = [];
    if ($userRow['role'] !== null && $userRow['role'] !== '') {
        $roles[] = $userRow['role'];
    }

    echo json_encode([
        'ok' => true,
        'user' => [
            'id' => (int)$userRow['id'],
            'user_id' => $userRow['user_id'],
            'email' => $userRow['email'],
            'name' => trim($userRow['full_name'] ?: $userRow['user_id']),
            'is_active' => (int)$userRow['is_active'] === 1,
            'role_id' => $userRow['role_id'] !== null ? (int)$userRow['role_id'] : null,
            'roles' => $roles,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to assign role', 'details' => $e->getMessage()]);
}
