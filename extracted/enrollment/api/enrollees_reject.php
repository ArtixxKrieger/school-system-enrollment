<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('enrollees', 'edit');

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

$enrolleeId = isset($payload['enrolleeId']) ? trim((string)$payload['enrolleeId']) : '';
if ($enrolleeId === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing enrolleeId']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->prepare('DELETE FROM enrollees WHERE id = :id');
    $stmt->execute([':id' => $enrolleeId]);

    $ok = $stmt->rowCount() > 0;
    echo json_encode(['ok' => $ok], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to reject enrollee', 'details' => $e->getMessage()]);
}

