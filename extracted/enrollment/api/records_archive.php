<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

if (!has_permission('student', 'edit') && !has_permission('settings', 'edit')) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

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
}

function ensureStudentArchiveTable(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS student_records_archive (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_pk INT NOT NULL,
            student_id VARCHAR(20) NULL,
            first_name VARCHAR(50) NOT NULL,
            middle_name VARCHAR(50) NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100) NULL,
            course_id INT NULL,
            course_code VARCHAR(20) NULL,
            course_name VARCHAR(100) NULL,
            year_level INT DEFAULT 1,
            current_semester TINYINT(1) NULL,
            current_academic_year VARCHAR(20) NULL,
            status VARCHAR(20) NOT NULL DEFAULT "graduated",
            graduated_at DATETIME NULL,
            archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            archive_reason VARCHAR(50) NOT NULL DEFAULT "graduated_3_years",
            notes TEXT NULL,
            UNIQUE KEY uniq_student_records_archive (student_pk),
            KEY idx_records_archive_reason (archive_reason),
            KEY idx_records_archive_archived_at (archived_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $archiveColumns = array_map(static function (array $column): string {
        return (string)$column['Field'];
    }, $pdo->query('SHOW COLUMNS FROM student_records_archive')->fetchAll(PDO::FETCH_ASSOC));

    if (!in_array('current_semester', $archiveColumns, true)) {
        $pdo->exec('ALTER TABLE student_records_archive ADD COLUMN current_semester TINYINT(1) NULL AFTER year_level');
    }

    if (!in_array('current_academic_year', $archiveColumns, true)) {
        $pdo->exec('ALTER TABLE student_records_archive ADD COLUMN current_academic_year VARCHAR(20) NULL AFTER current_semester');
    }
}

try {
    ensureStudentRecordColumns($pdo);
    ensureStudentArchiveTable($pdo);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = [];
    }

    $action = isset($input['action']) ? (string)$input['action'] : 'archive_eligible_graduates';

    if ($action === 'retrieve_record') {
        $studentId = isset($input['student_id']) ? (int)$input['student_id'] : 0;
        if ($studentId <= 0) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid student record']);
            exit;
        }

        $pdo->beginTransaction();

        $restoreStmt = $pdo->prepare(
            'UPDATE students
             SET status = "active", is_account_active = TRUE, archived_at = NULL, archive_reason = NULL, graduated_at = NULL
             WHERE id = ?'
        );
        $restoreStmt->execute([$studentId]);

        if ($restoreStmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Student record not found']);
            exit;
        }

        $pdo->prepare('DELETE FROM student_records_archive WHERE student_pk = ?')->execute([$studentId]);
        $pdo->commit();

        echo json_encode([
            'ok' => true,
            'message' => 'Student retrieved successfully',
        ]);
        exit;
    }

    $candidateStmt = $pdo->query(
        'SELECT s.id AS student_pk, s.student_id, s.first_name, s.middle_name, s.last_name, s.email,
                s.course_id, s.year_level, s.current_semester, s.current_academic_year, s.status, COALESCE(s.graduated_at, s.enrollment_date) AS graduated_at,
                c.course_code, c.course_name
         FROM students s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.status = "graduated"
           AND s.archived_at IS NULL
           AND COALESCE(s.graduated_at, s.enrollment_date) <= DATE_SUB(NOW(), INTERVAL 3 YEAR)
         ORDER BY COALESCE(s.graduated_at, s.enrollment_date) ASC'
    );
    $candidates = $candidateStmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$candidates) {
        echo json_encode([
            'ok' => true,
            'archived_count' => 0,
            'message' => 'No graduated students are currently eligible for archive.',
        ]);
        exit;
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO student_records_archive
            (student_pk, student_id, first_name, middle_name, last_name, email, course_id, course_code, course_name, year_level, current_semester, current_academic_year, status, graduated_at, archived_at, archive_reason, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), "graduated_3_years", ?)
         ON DUPLICATE KEY UPDATE
            student_id = VALUES(student_id),
            first_name = VALUES(first_name),
            middle_name = VALUES(middle_name),
            last_name = VALUES(last_name),
            email = VALUES(email),
            course_id = VALUES(course_id),
            course_code = VALUES(course_code),
            course_name = VALUES(course_name),
            year_level = VALUES(year_level),
            current_semester = VALUES(current_semester),
            current_academic_year = VALUES(current_academic_year),
            status = VALUES(status),
            graduated_at = VALUES(graduated_at),
            archived_at = NOW(),
            archive_reason = "graduated_3_years",
            notes = VALUES(notes)'
    );

    $updateStmt = $pdo->prepare(
        'UPDATE students
         SET archived_at = NOW(), archive_reason = "graduated_3_years", is_account_active = FALSE
         WHERE id = ?'
    );

    $pdo->beginTransaction();

    foreach ($candidates as $candidate) {
        $insertStmt->execute([
            (int)$candidate['student_pk'],
            $candidate['student_id'],
            $candidate['first_name'],
            $candidate['middle_name'],
            $candidate['last_name'],
            $candidate['email'],
            $candidate['course_id'] ? (int)$candidate['course_id'] : null,
            $candidate['course_code'],
            $candidate['course_name'],
            (int)($candidate['year_level'] ?? 1),
            isset($candidate['current_semester']) ? (int)$candidate['current_semester'] : null,
            $candidate['current_academic_year'] ?? null,
            $candidate['status'],
            $candidate['graduated_at'],
            'Archived after 3 years from graduation'
        ]);

        $updateStmt->execute([(int)$candidate['student_pk']]);
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'archived_count' => count($candidates),
        'message' => count($candidates) . ' graduate record(s) moved to the archive table successfully.',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to archive graduate records',
        'details' => $e->getMessage(),
    ]);
}
