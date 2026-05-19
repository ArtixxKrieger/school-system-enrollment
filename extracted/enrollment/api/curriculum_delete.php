<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('curriculum', 'edit');

$pdo = require __DIR__ . '/../config/db.php';

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

try {
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM curriculum WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['ok' => true, 'message' => 'Curriculum deleted']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to delete curriculum', 'details' => $e->getMessage()]);
}

