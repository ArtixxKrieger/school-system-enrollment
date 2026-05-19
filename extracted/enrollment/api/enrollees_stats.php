<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('enrollees', 'view');

$pdo = require __DIR__ . '/../config/db.php';

try {
    // Get statistics
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM enrollees');
    $total = $stmt->fetch()['total'];

    $stmt = $pdo->query('SELECT COUNT(*) as pending FROM enrollees WHERE status IN ("pending", "enrolled", "registered") AND enrollment_type = "returning"');
    $pending = $stmt->fetch()['pending'];

    $stmt = $pdo->query('SELECT COUNT(*) as approved FROM enrollees WHERE status = "approved"');
    $approved = $stmt->fetch()['approved'];

    // Breakdown by enrollment type
    $stmt = $pdo->query('SELECT COUNT(*) as c FROM enrollees WHERE status = "pre-registered" AND (enrollment_type = "new" OR enrollment_type IS NULL)');
    $preRegistered = $stmt->fetch()['c'];

    $stmt = $pdo->query('SELECT COUNT(*) as c FROM enrollees WHERE status IN ("pending", "enrolled", "registered") AND enrollment_type = "returning"');
    $registered = $stmt->fetch()['c'];

    echo json_encode([
        'ok' => true,
        'stats' => [
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'pre_registered' => $preRegistered,
            'registered' => $registered
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch statistics',
        'details' => $e->getMessage()
    ]);
}