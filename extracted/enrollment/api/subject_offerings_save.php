<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('subjects', 'edit');

$pdo = require __DIR__ . '/../config/db.php';

function ensureSubjectOfferingsTable(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS subject_offerings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            curriculum_id INT NOT NULL,
            course_id INT NOT NULL,
            year_level TINYINT NOT NULL,
            semester TINYINT NOT NULL,
            offered_by INT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            offered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_subject_offering (curriculum_id, course_id, year_level, semester),
            KEY idx_subject_offerings_course_setup (course_id, year_level, semester),
            KEY idx_subject_offerings_curriculum (curriculum_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

try {
    ensureSubjectOfferingsTable($pdo);

    $courseCode = strtoupper(trim((string)($data['course_code'] ?? '')));
    $yearLevel = (int)($data['year_level'] ?? 0);
    $semester = (int)($data['semester'] ?? 0);
    $curriculumIds = isset($data['curriculum_ids']) && is_array($data['curriculum_ids'])
        ? array_values(array_unique(array_map('intval', $data['curriculum_ids'])))
        : [];

    if ($courseCode === '' || $yearLevel < 1 || $yearLevel > 4 || !in_array($semester, [1, 2], true) || !$curriculumIds) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Please select subjects and complete the course, year level, and semester setup']);
        exit;
    }

    $courseStmt = $pdo->prepare('SELECT id FROM courses WHERE course_code = ? AND is_active = TRUE LIMIT 1');
    $courseStmt->execute([$courseCode]);
    $courseId = (int)$courseStmt->fetchColumn();

    if ($courseId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid target course']);
        exit;
    }

    $checkCurriculum = $pdo->prepare('SELECT id FROM curriculum WHERE id = ? AND is_active = TRUE LIMIT 1');

    // Determine academic_year from request or derive from current date
    $academicYear = trim((string)($data['academic_year'] ?? ''));
    if (!preg_match('/^\d{4}-\d{4}$/', $academicYear)) {
        $yr = (int)date('Y');
        $academicYear = (int)date('m') >= 6 ? "{$yr}-" . ($yr + 1) : ($yr - 1) . "-{$yr}";
    }

    // Ensure academic_year column exists (in case archive API hasn't run yet)
    $cols = array_column($pdo->query('SHOW COLUMNS FROM subject_offerings')->fetchAll(PDO::FETCH_ASSOC), 'Field');
    if (!in_array('academic_year', $cols, true)) {
        $pdo->exec("ALTER TABLE subject_offerings ADD COLUMN academic_year VARCHAR(9) NULL AFTER semester");
    }

    $saveOffering = $pdo->prepare(
        'INSERT INTO subject_offerings (curriculum_id, course_id, year_level, semester, academic_year, offered_by, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE is_active = 1, academic_year = VALUES(academic_year), offered_by = VALUES(offered_by), updated_at = NOW()'
    );

    $offeredBy = (int)(current_user()['id'] ?? 0);
    $saved = 0;

    $pdo->beginTransaction();

    foreach ($curriculumIds as $curriculumId) {
        if ($curriculumId <= 0) {
            continue;
        }

        $checkCurriculum->execute([$curriculumId]);
        if (!$checkCurriculum->fetchColumn()) {
            continue;
        }

        $saveOffering->execute([
            $curriculumId,
            $courseId,
            $yearLevel,
            $semester,
            $academicYear,
            $offeredBy > 0 ? $offeredBy : null,
        ]);
        $saved++;
    }

    $pdo->commit();

    if ($saved === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'No valid curriculum subjects were selected']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'message' => 'Subject offering setup saved successfully',
        'saved_count' => $saved,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to save subject offering setup',
        'details' => $e->getMessage(),
    ]);
}
