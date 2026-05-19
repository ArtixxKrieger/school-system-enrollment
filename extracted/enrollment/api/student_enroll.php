<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'edit');

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

// Expected keys
$studentId = isset($payload['studentId']) ? (int)$payload['studentId'] : 0;
$courseId = isset($payload['courseId']) ? (int)$payload['courseId'] : 0;
$yearLevel = isset($payload['yearLevel']) ? (int)$payload['yearLevel'] : 0;
$semester = isset($payload['semester']) ? (int)$payload['semester'] : 0;
$academicYear = isset($payload['academicYear']) ? trim((string)$payload['academicYear']) : '';

if ($studentId <= 0 || $courseId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid student ID or course ID']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $pdo->beginTransaction();

    // Verify student exists
    $stmtStudent = $pdo->prepare('SELECT id, email, first_name, last_name, status FROM students WHERE id = ?');
    $stmtStudent->execute([$studentId]);
    $student = $stmtStudent->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        throw new Exception('Student not found');
    }

    // Verify course exists
    $stmtCourse = $pdo->prepare('SELECT id, course_code, course_name FROM courses WHERE id = ?');
    $stmtCourse->execute([$courseId]);
    $course = $stmtCourse->fetch(PDO::FETCH_ASSOC);
    
    if (!$course) {
        throw new Exception('Course not found');
    }

    // Infer missing enrollment details from the existing student record or active calendar.
    if ($yearLevel <= 0 || $semester <= 0 || $academicYear === '') {
        $yearLevel = $yearLevel > 0 ? $yearLevel : (int)($student['year_level'] ?? 1);
        $semester = $semester > 0 ? $semester : (int)($student['current_semester'] ?? 1);

        if ($academicYear === '') {
            $academicYear = inferAcademicYear();
        }
    }

    // Update student enrollment
    $stmtUpdate = $pdo->prepare('
        UPDATE students 
        SET course_id = ?, 
            year_level = ?, 
            current_semester = ?, 
            current_academic_year = ?,
            status = ?,
            is_account_active = TRUE
        WHERE id = ?
    ');
    
    $stmtUpdate->execute([
        $courseId,
        $yearLevel,
        $semester,
        $academicYear,
        'active',  // Set status to active when enrolling
        $studentId
    ]);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'message' => 'Student enrolled successfully',
        'student' => [
            'id' => $student['id'],
            'name' => $student['first_name'] . ' ' . $student['last_name'],
            'email' => $student['email']
        ],
        'course' => [
            'id' => $course['id'],
            'code' => $course['course_code'],
            'name' => $course['course_name']
        ]
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to enroll student',
        'details' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to enroll student',
        'details' => $e->getMessage()
    ]);
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
