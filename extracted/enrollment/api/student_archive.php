<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'delete');

$pdo = require __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = [];
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid student ID']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE students SET is_account_active = FALSE WHERE id = ? AND status = "transferred" AND is_account_active = TRUE');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Student not found or not eligible for archive']);
        exit;
    }

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to archive student',
        'details' => $e->getMessage(),
    ]);
}
