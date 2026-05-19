<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('enrollees', 'view');

$pdo = require __DIR__ . '/../config/db.php';

try {
    $status = $_GET['status'] ?? 'all';
    $course = $_GET['course'] ?? 'all';
    $search = $_GET['search'] ?? '';
    $enrollmentType = $_GET['enrollment_type'] ?? 'all';
    $page = (int)($_GET['page'] ?? 1);
    $limit = 10;
    $offset = ($page - 1) * $limit;

    $currentSemester = inferCurrentSemester();
    $currentAcademicYear = inferAcademicYear();
    $settingsStmt = $pdo->query('SELECT strict_enrollment_windows FROM enrollment_settings WHERE id = 1 LIMIT 1');
    $settingsRow = $settingsStmt->fetch(PDO::FETCH_ASSOC);
    $strictEnrollmentWindows = isset($settingsRow['strict_enrollment_windows'])
        ? (bool)(int)$settingsRow['strict_enrollment_windows']
        : false;
    $autoDisabledAccounts = 0;
    $disableStmt = $pdo->prepare('
        UPDATE users u
        JOIN enrollees e ON e.email = u.email
        JOIN course_enrollment_schedule ces ON ces.course_id = e.course_id
        SET u.is_active = 0
        WHERE e.status = "pre-registered"
          AND NOW() > ces.enrollment_end_date
          AND u.is_active = 1
    ');
    $disableStmt->execute();
    $autoDisabledAccounts = $disableStmt->rowCount();

    // Build query - enrollees for the active semester
    $where = [];
    $params = [];

    if ($status === 'registered') {
        $where[] = 'e.enrollment_type = "returning" AND e.status IN ("pending", "enrolled", "registered")';
    } elseif ($status !== 'all') {
        $where[] = 'e.status = ?';
        $params[] = $status;
    }

    if ($course !== 'all') {
        $where[] = 'c.course_code = ?';
        $params[] = $course;
    }

    if ($search) {
        $where[] = '(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.pre_reg_number LIKE ? OR e.existing_student_id LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if ($enrollmentType !== 'all') {
        $where[] = 'e.enrollment_type = ?';
        $params[] = $enrollmentType;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Get total count
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM enrollees e
        LEFT JOIN courses c ON e.course_id = c.id
        $whereClause
    ");
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];

    $semester = isset($_GET['semester']) ? (int)$_GET['semester'] : $currentSemester;
    $semester = $semester === 2 ? 2 : 1;

    $windowStartDate = null;
    $windowEndDate = null;
    $windowSource = 'calendar_default';
    $windowCourseCode = null;
    $openCoursesCount = 0;
    $totalWindowCourses = 0;
    $today = date('Y-m-d');

    if ($course !== 'all') {
        $windowStmt = $pdo->prepare('
            SELECT c.course_code, ces.enrollment_start_date, ces.enrollment_end_date
            FROM courses c
            LEFT JOIN course_enrollment_schedule ces
                ON ces.course_id = c.id
            WHERE c.course_code = ?
            LIMIT 1
        ');
        $windowStmt->execute([$course]);
        $window = $windowStmt->fetch(PDO::FETCH_ASSOC);

        if ($window) {
            $windowCourseCode = $window['course_code'] ?? $course;
            if (!empty($window['enrollment_start_date']) && !empty($window['enrollment_end_date'])) {
                $windowStartDate = $window['enrollment_start_date'];
                $windowEndDate = $window['enrollment_end_date'];
                $windowSource = 'course_schedule';
            }
        }
    } else {
        $windowAggStmt = $pdo->prepare('
            SELECT
                COUNT(*) AS total_window_courses,
                SUM(CASE WHEN ? BETWEEN enrollment_start_date AND enrollment_end_date THEN 1 ELSE 0 END) AS open_courses
            FROM course_enrollment_schedule
        ');
        $windowAggStmt->execute([$today]);
        $windowAgg = $windowAggStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $totalWindowCourses = (int)($windowAgg['total_window_courses'] ?? 0);
        $openCoursesCount = (int)($windowAgg['open_courses'] ?? 0);
        $windowSource = 'all_courses_schedule';
    }

    // Get enrollees with linked student information for clearer returning-student rows
    $stmt = $pdo->prepare("
        SELECT e.*,
               c.course_code,
               c.course_name,
               ces.enrollment_start_date as enrollment_window_start,
               ces.enrollment_end_date as enrollment_window_end,
               CASE
                   WHEN ces.course_id IS NULL THEN 'no_window'
                   WHEN NOW() BETWEEN ces.enrollment_start_date AND ces.enrollment_end_date THEN 'open'
                   WHEN NOW() < ces.enrollment_start_date THEN 'upcoming'
                   ELSE 'closed'
               END as enrollment_window_status,
               CASE WHEN u.id IS NOT NULL AND u.is_active = 0 THEN 1 ELSE 0 END as account_disabled,
               e.enrollment_type as enrollee_type,
               e.existing_student_id,
               COALESCE(sr.year_level, e.year_level) as target_year_level,
               COALESCE(sr.current_semester, ?) as target_semester,
               ? as target_academic_year,
               COALESCE(sr.id, sp.id) as linked_student_db_id,
               COALESCE(sr.student_id, sp.student_id, e.existing_student_id) as linked_student_id,
               COALESCE(sr.status, sp.status) as current_student_status,
               COALESCE(sr.student_type, sp.student_type) as current_student_type,
               COALESCE(sr.finance_status, sp.finance_status) as current_finance_status,
               COALESCE(sr.progression_status, sp.progression_status) as current_progression_status,
               COALESCE(sr.year_level, sp.year_level) as current_year_level,
               COALESCE(sr.current_semester, sp.current_semester) as current_student_semester,
               COALESCE(sr.current_academic_year, sp.current_academic_year) as current_student_academic_year,
               COALESCE(NULLIF(sr.phone, ''), NULLIF(sp.phone, ''), NULLIF(e.phone, '')) as linked_phone,
               COALESCE(sr.enrollment_date, sp.enrollment_date, e.approved_date, e.application_date) as display_date
        FROM enrollees e
        LEFT JOIN courses c ON e.course_id = c.id
        LEFT JOIN course_enrollment_schedule ces ON ces.course_id = e.course_id
        LEFT JOIN users u ON u.email = e.email
        LEFT JOIN students sr ON sr.student_id = e.existing_student_id
        LEFT JOIN students sp ON sp.pre_reg_number = e.pre_reg_number
        $whereClause
        ORDER BY e.application_date DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute(array_merge([
        $semester,
        $currentAcademicYear
    ], $params));
    $enrollees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'enrollees' => $enrollees,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ],
        'active_semester' => [
            'academic_year' => $currentAcademicYear,
            'semester' => $semester === 1 ? '1st Semester' : '2nd Semester',
            'semester_number' => $semester,
            'start_date' => $windowStartDate,
            'end_date' => $windowEndDate,
            'strict_enrollment_windows' => $strictEnrollmentWindows,
            'window_source' => $windowSource,
            'window_course_code' => $windowCourseCode,
            'open_courses_count' => $openCoursesCount,
            'total_window_courses' => $totalWindowCourses,
            'auto_disabled_accounts' => $autoDisabledAccounts,
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch enrollees',
        'details' => $e->getMessage()
    ]);
}

function inferCurrentSemester(): int
{
    $month = (int)date('n');
    return $month >= 8 ? 1 : 2;
}

function inferAcademicYear(): string
{
    $year = (int)date('Y');
    $month = (int)date('n');
    if ($month >= 8) {
        return $year . '-' . ($year + 1);
    }
    return ($year - 1) . '-' . $year;
}

