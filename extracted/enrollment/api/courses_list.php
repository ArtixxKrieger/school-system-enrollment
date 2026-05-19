<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

$pdo = require __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query('
        SELECT
            c.id,
            c.course_code,
            c.course_name,
            c.description,
            c.display_order,
            COALESCE(ces.max_slots, 0) AS max_slots
        FROM courses c
        LEFT JOIN course_enrollment_schedule ces
            ON ces.course_id = c.id
        WHERE c.is_active = TRUE
        ORDER BY c.display_order, c.course_name
    ');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $courses = array_map(static function (array $r): array {
        return [
            'id' => (int)$r['id'],
            'course_code' => $r['course_code'],
            'course_name' => $r['course_name'],
            'description' => $r['description'] ?? '',
            'display_order' => (int)($r['display_order'] ?? 0),
            'max_slots' => (int)($r['max_slots'] ?? 0),
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'courses' => $courses]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to load courses',
        'details' => $e->getMessage(),
    ]);
}
