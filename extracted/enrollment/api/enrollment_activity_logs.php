<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('settings', 'view');

$pdo = require __DIR__ . '/../config/db.php';
ensure_app_schema($pdo);

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;
$offset = ($page - 1) * $limit;

$actions = [
    'enrollment_settings_updated',
    'course_enrollment_schedule_saved',
    'course_enrollment_schedule_deleted',
    'add_transferee_student',
    'semester_end_triggered',
    'student_status_updated',
];

$actionPlaceholders = implode(',', array_fill(0, count($actions), '?'));

try {
    $countStmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM activity_logs al
         WHERE al.action IN ($actionPlaceholders)"
    );
    $countStmt->execute($actions);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT al.id,
                al.action,
                al.description,
                al.entity_type,
                al.entity_id,
                al.new_value,
                al.created_at,
                u.full_name,
                u.username,
                u.role
         FROM activity_logs al
         LEFT JOIN users u ON u.id = al.user_id
         WHERE al.action IN ($actionPlaceholders)
         ORDER BY al.created_at DESC, al.id DESC
         LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($actions);

    $logs = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $meta = json_decode((string)($row['new_value'] ?? ''), true);
        if (!is_array($meta)) {
            $meta = [];
        }

        $logs[] = [
            'id' => (int)$row['id'],
            'action' => (string)($row['action'] ?? ''),
            'description' => (string)($row['description'] ?? ''),
            'entity_type' => (string)($row['entity_type'] ?? ''),
            'entity_id' => isset($row['entity_id']) ? (int)$row['entity_id'] : null,
            'created_at' => (string)($row['created_at'] ?? ''),
            'actor_name' => trim((string)($row['full_name'] ?? $row['username'] ?? 'System User')),
            'actor_role' => (string)($row['role'] ?? ''),
            'meta' => $meta,
        ];
    }

    echo json_encode([
        'ok' => true,
        'logs' => $logs,
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => max(1, (int)ceil($total / $limit)),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to load activity logs',
        'details' => $e->getMessage(),
    ]);
}