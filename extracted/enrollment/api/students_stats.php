<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'view');

$pdo = require __DIR__ . '/../config/db.php';

try {
    $visibleCondition = 'archived_at IS NULL AND COALESCE(progression_status, "enrolled") <> "pending_progression"';

    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM students WHERE ' . $visibleCondition);
    $total = (int)$stmt->fetch()['total'];

    $stmt = $pdo->query('SELECT COUNT(*) AS active FROM students WHERE ' . $visibleCondition . ' AND status = "active"');
    $active = (int)$stmt->fetch()['active'];

    $stmt = $pdo->query('SELECT COUNT(*) AS inactive FROM students WHERE ' . $visibleCondition . ' AND status = "inactive"');
    $inactive = (int)$stmt->fetch()['inactive'];

    $stmt = $pdo->query('SELECT COUNT(*) AS dropped FROM students WHERE ' . $visibleCondition . ' AND status = "transferred"');
    $dropped = (int)$stmt->fetch()['dropped'];

    echo json_encode([
        'ok' => true,
        'stats' => [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'dropped' => $dropped,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch statistics',
        'details' => $e->getMessage(),
    ]);
}
