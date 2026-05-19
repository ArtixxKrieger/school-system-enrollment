<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$userId = isset($_GET['userId']) ? trim((string)$_GET['userId']) : '';
if ($userId === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing userId']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->prepare('
        SELECT id, username AS user_id, email, is_active, created_at
        FROM users
        WHERE username = :user_id
        LIMIT 1
    ');
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['ok' => true, 'found' => false, 'userId' => $userId]);
        exit;
    }

    // Do NOT return password hash.
    echo json_encode([
        'ok' => true,
        'found' => true,
        'userId' => (string)$user['user_id'],
        'id' => (int)$user['id'],
        'email' => $user['email'] ?? null,
        'is_active' => (int)$user['is_active'],
        'created_at' => $user['created_at'] ?? null,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Query failed',
        'details' => $e->getMessage(),
    ]);
}

