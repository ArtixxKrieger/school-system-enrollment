<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'view');

$pdo = require __DIR__ . '/../config/db.php';

function ensureStudentRecordColumns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $columns = array_map(static function (array $column): string {
        return (string)$column['Field'];
    }, $pdo->query('SHOW COLUMNS FROM students')->fetchAll(PDO::FETCH_ASSOC));

    if (!in_array('graduated_at', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN graduated_at DATETIME NULL AFTER current_academic_year');
    }

    if (!in_array('archived_at', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN archived_at DATETIME NULL AFTER graduated_at');
    }

    if (!in_array('archive_reason', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN archive_reason VARCHAR(50) NULL AFTER archived_at');
    }

    if (!in_array('batch_number', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN batch_number VARCHAR(30) NULL AFTER current_academic_year');
    }
}

try {
    ensureStudentRecordColumns($pdo);
    $search = trim((string)($_GET['search'] ?? ''));
    $courseId = isset($_GET['course_id']) ? (string)$_GET['course_id'] : '';
    $yearLevel = isset($_GET['year_level']) ? (string)$_GET['year_level'] : '';
    $status = isset($_GET['status']) ? (string)$_GET['status'] : '';

    $conditions = ['s.archived_at IS NULL', 'COALESCE(s.progression_status, "enrolled") <> "pending_progression"'];
    $params = [];

    if ($search !== '') {
        $conditions[] = '(s.first_name LIKE ? OR s.last_name LIKE ? OR s.middle_name LIKE ? OR s.email LIKE ? OR s.student_id LIKE ?)';
        $term = '%' . $search . '%';
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if ($courseId !== '' && ctype_digit($courseId)) {
        $conditions[] = 's.course_id = ?';
        $params[] = (int)$courseId;
    }

    if ($yearLevel !== '' && ctype_digit($yearLevel)) {
        $conditions[] = 's.year_level = ?';
        $params[] = (int)$yearLevel;
    }

    $allowedStatus = ['active', 'inactive', 'graduated', 'transferred'];
    if ($status !== '' && in_array($status, $allowedStatus, true)) {
        $conditions[] = 's.status = ?';
        $params[] = $status;
    } else {
        $conditions[] = 's.status <> "transferred"';
    }

    $whereSql = implode(' AND ', $conditions);

    $stmt = $pdo->prepare("
        SELECT
            s.id,
            s.student_id,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.email,
            s.year_level,
            s.status,
            s.finance_status,
            s.student_type,
            s.enrollment_date,
            s.current_semester,
            s.current_academic_year,
            s.is_account_active,
            s.progression_status,
            s.graduated_at,
            s.archived_at,
            s.archive_reason,
            s.import_semester,
            s.batch_number,
            c.course_code,
            c.course_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE $whereSql
        ORDER BY s.last_name, s.first_name, s.id
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $students = [];
    foreach ($rows as $row) {
        $students[] = [
            'id' => (int)$row['id'],
            'student_id' => $row['student_id'],
            'first_name' => $row['first_name'],
            'middle_name' => $row['middle_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'year_level' => (int)$row['year_level'],
            'status' => $row['status'],
            'finance_status' => $row['finance_status'],
            'enrollment_date' => $row['enrollment_date'],
            'current_semester' => (int)$row['current_semester'],
            'current_academic_year' => $row['current_academic_year'],
            'course_code' => $row['course_code'],
            'course_name' => $row['course_name'],
            'student_type' => ucfirst(strtolower((string)($row['student_type'] ?? 'regular'))),
            'progression_status' => $row['progression_status'] ?? 'enrolled',
            'import_semester' => $row['import_semester'] ? (int)$row['import_semester'] : null,
            'batch_number' => $row['batch_number'],
            'graduated_at' => $row['graduated_at'],
            'archived_at' => $row['archived_at'],
            'archive_reason' => $row['archive_reason'],
        ];
    }

    $coursesStmt = $pdo->query('
        SELECT id, course_code, course_name
        FROM courses
        WHERE is_active = TRUE
        ORDER BY display_order, course_name
    ');
    $courses = $coursesStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'students' => $students,
        'courses' => array_map(static function (array $c): array {
            return [
                'id' => (int)$c['id'],
                'course_code' => $c['course_code'],
                'course_name' => $c['course_name'],
            ];
        }, $courses),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch students',
        'details' => $e->getMessage(),
    ]);
}
function getTableColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    $stmt->execute();
    return array_map(static function (array $column): string {
        return $column['Field'];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}