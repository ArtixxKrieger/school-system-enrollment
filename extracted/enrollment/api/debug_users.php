<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$pdo = require __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM users');
    $countRow = $stmt->fetch();
    $total = (int)($countRow['total'] ?? 0);

    $stmt2 = $pdo->query('SELECT id, username AS user_id, email, is_active FROM users ORDER BY id DESC LIMIT 10');
    $rows = $stmt2->fetchAll();

    echo json_encode([
        'ok' => true,
        'totalUsers' => $total,
        'sample' => $rows,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to query users table',
        'details' => $e->getMessage(),
    ]);
}

