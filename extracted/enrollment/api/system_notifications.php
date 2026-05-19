<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_permission('settings', 'view');

$pdo = require __DIR__ . '/../config/db.php';
ensure_app_schema($pdo);

try {
    $stmt = $pdo->query(
        "SELECT id, user_id, action, description, entity_type, entity_id, ip_address, created_at
         FROM activity_logs
         WHERE action IN ('login_lockout', 'password_reset_email_failed')
         ORDER BY created_at DESC
         LIMIT 25"
    );

    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'alerts' => $alerts,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Unable to load system notifications',
        'details' => $e->getMessage(),
    ]);
}
