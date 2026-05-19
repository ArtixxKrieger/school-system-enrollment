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

$roleId = isset($payload['id']) ? (int)$payload['id'] : 0;
if ($roleId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing role id']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->prepare('SELECT is_system FROM roles WHERE id = ?');
    $stmt->execute([$roleId]);
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$role) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Role not found']);
        exit;
    }

    if ((int)$role['is_system'] === 1) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'System roles cannot be deleted']);
        exit;
    }

    $delete = $pdo->prepare('DELETE FROM roles WHERE id = ?');
    $delete->execute([$roleId]);

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to delete role', 'details' => $e->getMessage()]);
}
