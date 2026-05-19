<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

if (!has_permission('student', 'view') && !has_permission('settings', 'view')) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden']);
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

    $search = trim((string)($_GET['search'] ?? ''));
    $searchSqlCurrent = '';
    $searchSqlArchive = '';
    $searchParams = [];

    if ($search !== '') {
        $searchSqlCurrent = ' AND (s.first_name LIKE ? OR s.middle_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ? OR s.student_id LIKE ?)';
        $searchSqlArchive = ' WHERE (first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
        $term = '%' . $search . '%';
        $searchParams = [$term, $term, $term, $term, $term];
    }

    $graduatedStmt = $pdo->prepare(
        'SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.email,
                s.year_level, s.current_semester, s.current_academic_year, s.status, s.enrollment_date, s.graduated_at,
                c.course_code, c.course_name
         FROM students s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.archived_at IS NULL AND s.status = "graduated"' . $searchSqlCurrent . '
         ORDER BY COALESCE(s.graduated_at, s.enrollment_date) DESC, s.last_name ASC, s.first_name ASC'
    );
    $graduatedStmt->execute($searchParams);
    $graduated = $graduatedStmt->fetchAll(PDO::FETCH_ASSOC);

    $inactiveStmt = $pdo->prepare(
        'SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.email,
                s.year_level, s.current_semester, s.current_academic_year, s.status, s.enrollment_date, s.graduated_at,
                c.course_code, c.course_name
         FROM students s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.archived_at IS NULL AND s.status IN ("inactive", "transferred")' . $searchSqlCurrent . '
         ORDER BY s.last_name ASC, s.first_name ASC'
    );
    $inactiveStmt->execute($searchParams);
    $inactiveDrop = $inactiveStmt->fetchAll(PDO::FETCH_ASSOC);

    $archivedStmt = $pdo->prepare(
        'SELECT id, student_pk, student_id, first_name, middle_name, last_name, email,
                course_code, course_name, year_level, current_semester, current_academic_year, status, graduated_at, archived_at, archive_reason
         FROM student_records_archive' . $searchSqlArchive . '
         ORDER BY archived_at DESC, last_name ASC, first_name ASC'
    );
    $archivedStmt->execute($searchParams);
    $archived = $archivedStmt->fetchAll(PDO::FETCH_ASSOC);

    $stats = [
        'graduated' => (int)$pdo->query('SELECT COUNT(*) FROM students WHERE status = "graduated" AND archived_at IS NULL')->fetchColumn(),
        'inactive_drop' => (int)$pdo->query('SELECT COUNT(*) FROM students WHERE status IN ("inactive", "transferred") AND archived_at IS NULL')->fetchColumn(),
        'archive_candidates' => (int)$pdo->query('SELECT COUNT(*) FROM students WHERE status = "graduated" AND archived_at IS NULL AND COALESCE(graduated_at, enrollment_date) <= DATE_SUB(NOW(), INTERVAL 3 YEAR)')->fetchColumn(),
        'archived' => (int)$pdo->query('SELECT COUNT(*) FROM student_records_archive')->fetchColumn(),
    ];

    echo json_encode([
        'ok' => true,
        'graduated' => $graduated,
        'inactive_drop' => $inactiveDrop,
        'archived' => $archived,
        'stats' => $stats,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to load records',
        'details' => $e->getMessage(),
    ]);
}
