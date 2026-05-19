<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('enrollment', 'view');

$pdo = require __DIR__ . '/../config/db.php';

try {
    $search = $_GET['search'] ?? '';
    $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

    // Get students not yet enrolled to any course
    $where = 'WHERE (s.course_id IS NULL OR s.course_id = 0)';
    $params = [];

    if ($search) {
        $where .= ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.middle_name LIKE ? OR s.email LIKE ? OR s.student_id LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if ($courseId > 0) {
        // Return only unassigned students; courseId is kept for future course-specific logic.
        $where .= ' AND (s.course_id IS NULL OR s.course_id = 0)';
    }

    $stmt = $pdo->prepare("
        SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.email,
               s.year_level, s.current_semester, s.status, s.course_id, s.enrollment_date
        FROM students s
        $where
        ORDER BY s.last_name, s.first_name
    ");

    $stmt->execute($params);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'students' => $students,
        'count' => count($students)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch available students',
        'details' => $e->getMessage()
    ]);
}
