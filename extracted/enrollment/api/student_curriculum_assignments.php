<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';

$pdo = require __DIR__ . '/../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

try {
    ensureStudentEnrolledSubjectsTable($pdo);
    ensureSubjectOfferingsTable($pdo);
    ensureOfferColumnExists($pdo);
    ensureEnrolleeWorkflowColumns($pdo);
    if ($method === 'GET') {
        require_permission('student', 'view');
        $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
        if ($studentId <= 0) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Student ID required']);
            exit;
        }

        $yearLevel = isset($_GET['year_level']) ? (int)$_GET['year_level'] : 0;
        $semester = isset($_GET['semester']) ? (int)$_GET['semester'] : 0;

        echo json_encode([
            'ok' => true,
            'assignments' => getAssignments($pdo, $studentId),
            'available_subjects' => ($yearLevel >= 1 && $yearLevel <= 4)
                ? getAvailableCurriculumSubjects($pdo, $studentId, $yearLevel, $semester)
                : [],
        ]);
        exit;
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw ?: '', true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $action = isset($payload['action']) ? trim((string)$payload['action']) : 'assign';

    if ($action === 'self_enroll') {
        require_login();
        if (current_user_role() !== 'student') {
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => 'Only students can enroll offered subjects']);
            exit;
        }
        handleSelfEnroll($pdo, $payload);
        exit;
    }

    require_permission('student', 'edit');

    if ($action === 'assign') {
        handleAssign($pdo, $payload);
        exit;
    }

    if ($action === 'update_progress') {
        handleProgressUpdate($pdo, $payload);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid action']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to process curriculum assignment request',
        'details' => $e->getMessage(),
    ]);
}

function handleAssign(PDO $pdo, array $payload): void
{
    $studentId = isset($payload['student_id']) ? (int)$payload['student_id'] : 0;
    $yearLevel = isset($payload['year_level']) ? (int)$payload['year_level'] : 0;
    $semester = isset($payload['semester']) ? (int)$payload['semester'] : 0;
    $curriculumIds = isset($payload['curriculum_ids']) && is_array($payload['curriculum_ids'])
        ? array_values(array_filter(array_map('intval', $payload['curriculum_ids']), static function (int $id): bool { return $id > 0; }))
        : [];

    if ($studentId <= 0 || $yearLevel < 1 || $yearLevel > 4) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid student or year level']);
        exit;
    }

    if (!in_array($semester, [0, 1, 2], true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid semester']);
        exit;
    }

    if (!$curriculumIds) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Select at least one subject to assign']);
        exit;
    }

    $studentStmt = $pdo->prepare('SELECT id, course_id FROM students WHERE id = ? LIMIT 1');
    $studentStmt->execute([$studentId]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Student not found']);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($curriculumIds), '?'));
    $conditions = 'course_id = ? AND year_level = ? AND is_active = TRUE AND id IN (' . $placeholders . ')';
    $params = array_merge([(int)$student['course_id'], $yearLevel], $curriculumIds);

    if ($semester !== 0) {
        $conditions .= ' AND semester = ?';
        $params[] = $semester;
    }

    $curriculumStmt = $pdo->prepare('SELECT id, semester FROM curriculum WHERE ' . $conditions);
    $curriculumStmt->execute($params);
    $curriculumRows = $curriculumStmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$curriculumRows) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'No matching curriculum subjects found for the selected setup']);
        exit;
    }

    $assignedBy = (int)(current_user()['id'] ?? 0);

    $pdo->beginTransaction();

    $insertStmt = $pdo->prepare(
        'INSERT INTO student_curriculum_assignments
            (student_id, curriculum_id, source_year_level, source_semester, is_completed, assigned_by)
         VALUES (?, ?, ?, ?, FALSE, ?)
         ON DUPLICATE KEY UPDATE source_year_level = VALUES(source_year_level), source_semester = VALUES(source_semester), assigned_by = VALUES(assigned_by)'
    );

    $affected = 0;
    foreach ($curriculumRows as $row) {
        $insertStmt->execute([
            $studentId,
            (int)$row['id'],
            $yearLevel,
            $semester === 0 ? (int)$row['semester'] : $semester,
            $assignedBy > 0 ? $assignedBy : null,
        ]);
        $affected += $insertStmt->rowCount();
    }

    recalculateStudentType($pdo, $studentId);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'message' => 'Selected curriculum subjects assigned successfully',
        'affected_rows' => $affected,
        'assignments' => getAssignments($pdo, $studentId),
    ]);
}

function getAvailableCurriculumSubjects(PDO $pdo, int $studentId, int $yearLevel, int $semester): array
{
    if ($studentId <= 0 || $yearLevel < 1 || $yearLevel > 4 || !in_array($semester, [0, 1, 2], true)) {
        return [];
    }

    $studentStmt = $pdo->prepare('SELECT course_id FROM students WHERE id = ? LIMIT 1');
    $studentStmt->execute([$studentId]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student || empty($student['course_id'])) {
        return [];
    }

    $conditions = 'c.course_id = ? AND c.year_level = ? AND c.is_active = TRUE';
    $params = [$studentId, $studentId, (int)$student['course_id'], $yearLevel];

    if ($semester !== 0) {
        $conditions .= ' AND c.semester = ?';
        $params[] = $semester;
    }

    $stmt = $pdo->prepare(
        'SELECT c.id, c.subject_code, c.subject_name, c.units, c.year_level, c.semester
         FROM curriculum c
         LEFT JOIN student_curriculum_assignments sca
            ON sca.curriculum_id = c.id AND sca.student_id = ?
         LEFT JOIN student_enrolled_subjects ses
            ON ses.curriculum_id = c.id AND ses.student_id = ? AND ses.status = "enrolled"
         WHERE ' . $conditions . '
           AND sca.id IS NULL
           AND ses.id IS NULL
         ORDER BY c.year_level ASC, c.semester ASC, c.subject_code ASC'
    );
    $stmt->execute($params);

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function handleSelfEnroll(PDO $pdo, array $payload): void
{
    $offeringId = isset($payload['offering_id']) ? (int)$payload['offering_id'] : 0;
    $curriculumId = isset($payload['curriculum_id']) ? (int)$payload['curriculum_id'] : 0;

    if ($offeringId <= 0 && $curriculumId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Offered subject required']);
        exit;
    }

    $sessionEmail = trim((string)(current_user()['email'] ?? ''));
    if ($sessionEmail === '') {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Student session is missing an email address']);
        exit;
    }

    $studentStmt = $pdo->prepare('SELECT id, student_id, pre_reg_number, course_id, year_level, current_semester FROM students WHERE email = ? ORDER BY id DESC LIMIT 1');
    $studentStmt->execute([$sessionEmail]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Student record not found']);
        exit;
    }

    if ($offeringId <= 0 && $curriculumId > 0) {
        $resolveOfferingStmt = $pdo->prepare(
            'SELECT id
             FROM subject_offerings
             WHERE curriculum_id = ?
               AND course_id = ?
               AND year_level = ?
               AND semester = ?
               AND is_active = TRUE
             ORDER BY id DESC
             LIMIT 1'
        );
        $resolveOfferingStmt->execute([
            $curriculumId,
            (int)$student['course_id'],
            (int)$student['year_level'],
            (int)$student['current_semester'],
        ]);
        $offeringId = (int)$resolveOfferingStmt->fetchColumn();
    }

    if ($offeringId <= 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'This subject is not currently offered for your setup']);
        exit;
    }

    $offeringStmt = $pdo->prepare(
        'SELECT so.id AS offering_id, so.curriculum_id, so.course_id, so.year_level, so.semester, cu.subject_code
         FROM subject_offerings so
         JOIN curriculum cu ON cu.id = so.curriculum_id
         WHERE so.id = ? AND so.is_active = TRUE AND cu.is_active = TRUE
         LIMIT 1'
    );
    $offeringStmt->execute([$offeringId]);
    $offering = $offeringStmt->fetch(PDO::FETCH_ASSOC);

    if (!$offering) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'This subject is not currently offered']);
        exit;
    }

    if ((int)$offering['course_id'] !== (int)$student['course_id']) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'You can only enroll subjects offered for your course']);
        exit;
    }

    $pdo->beginTransaction();

    $insertStmt = $pdo->prepare(
        'INSERT INTO student_enrolled_subjects
            (student_id, curriculum_id, offering_id, status, enrolled_at, approved_at, approved_by)
         VALUES (?, ?, ?, "enrolled", NOW(), NOW(), NULL)
         ON DUPLICATE KEY UPDATE offering_id = VALUES(offering_id), status = "enrolled", approved_at = COALESCE(approved_at, NOW())'
    );
    $insertStmt->execute([
        (int)$student['id'],
        (int)$offering['curriculum_id'],
        (int)$offering['offering_id'],
    ]);

    $enrolleeUpdate = $pdo->prepare(
        'UPDATE enrollees
         SET status = "enrolled", application_date = NOW()
         WHERE enrollment_type = "returning"
           AND (existing_student_id = ? OR pre_reg_number = ?)
           AND status IN ("pending", "registered")'
    );
    $enrolleeUpdate->execute([
        (string)($student['student_id'] ?? ''),
        (string)($student['pre_reg_number'] ?? ''),
    ]);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'message' => 'Subject enrolled successfully. Waiting for admin re-enrollment approval.',
        'curriculum_id' => (int)$offering['curriculum_id'],
        'offering_id' => (int)$offering['offering_id'],
        'subject_code' => (string)$offering['subject_code'],
    ]);
}

function handleProgressUpdate(PDO $pdo, array $payload): void
{
    $studentId = isset($payload['student_id']) ? (int)$payload['student_id'] : 0;
    $updates = isset($payload['updates']) && is_array($payload['updates']) ? $payload['updates'] : [];

    if ($studentId <= 0 || !$updates) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid progress update payload']);
        exit;
    }

    $pdo->beginTransaction();

    $updateStmt = $pdo->prepare(
        'UPDATE student_curriculum_assignments
         SET is_completed = ?, completed_at = ?
         WHERE id = ? AND student_id = ?'
    );

    foreach ($updates as $update) {
        $assignmentId = isset($update['id']) ? (int)$update['id'] : 0;
        $isCompleted = !empty($update['is_completed']);

        if ($assignmentId <= 0) {
            continue;
        }

        $updateStmt->execute([
            $isCompleted ? 1 : 0,
            $isCompleted ? date('Y-m-d H:i:s') : null,
            $assignmentId,
            $studentId,
        ]);
    }

    recalculateStudentType($pdo, $studentId);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'message' => 'Assignment progress updated',
        'assignments' => getAssignments($pdo, $studentId),
    ]);
}

function getAssignments(PDO $pdo, int $studentId): array
{
    $stmt = $pdo->prepare(
        'SELECT sca.id, sca.student_id, sca.curriculum_id, sca.source_year_level, sca.source_semester,
                sca.is_completed, sca.assigned_at, sca.completed_at,
                c.subject_code, c.subject_name, c.units, c.year_level, c.semester, c.prerequisites
         FROM student_curriculum_assignments sca
         JOIN curriculum c ON c.id = sca.curriculum_id
         WHERE sca.student_id = ?
         ORDER BY sca.is_completed ASC, c.year_level ASC, c.semester ASC, c.subject_code ASC'
    );
    $stmt->execute([$studentId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function recalculateStudentType(PDO $pdo, int $studentId): void
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM student_curriculum_assignments WHERE student_id = ? AND is_completed = 0');
    $stmt->execute([$studentId]);
    $remaining = (int)$stmt->fetchColumn();

    $type = $remaining > 0 ? 'irregular' : 'regular';

    $updateStudent = $pdo->prepare('UPDATE students SET student_type = ? WHERE id = ?');
    $updateStudent->execute([$type, $studentId]);
}

function ensureStudentEnrolledSubjectsTable(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS student_enrolled_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            curriculum_id INT NOT NULL,
            offering_id INT NULL,
            status VARCHAR(20) NOT NULL DEFAULT "enrolled",
            enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at DATETIME NULL DEFAULT NULL,
            approved_by INT NULL,
            UNIQUE KEY uniq_student_enrolled_subject (student_id, curriculum_id),
            KEY idx_student_enrolled_student (student_id),
            KEY idx_student_enrolled_curriculum (curriculum_id),
            KEY idx_student_enrolled_offering (offering_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $stmt = $pdo->query("SHOW COLUMNS FROM student_enrolled_subjects LIKE 'offering_id'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE student_enrolled_subjects ADD COLUMN offering_id INT NULL AFTER curriculum_id');
    }
}

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

function ensureEnrolleeWorkflowColumns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $columns = array_map(static function (array $column): string {
        return (string)$column['Field'];
    }, $pdo->query('SHOW COLUMNS FROM enrollees')->fetchAll(PDO::FETCH_ASSOC));

    if (!in_array('existing_student_id', $columns, true)) {
        $pdo->exec('ALTER TABLE enrollees ADD COLUMN existing_student_id VARCHAR(20) NULL AFTER pre_reg_number');
    }

    if (!in_array('enrollment_type', $columns, true)) {
        $pdo->exec('ALTER TABLE enrollees ADD COLUMN enrollment_type VARCHAR(20) NULL DEFAULT "new" AFTER status');
    }

    $statusInfo = $pdo->query("SHOW COLUMNS FROM enrollees LIKE 'status'")->fetch(PDO::FETCH_ASSOC);
    if ($statusInfo && stripos((string)$statusInfo['Type'], 'varchar') === false) {
        $pdo->exec('ALTER TABLE enrollees MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT "pre-registered"');
    }

    $pdo->exec("UPDATE enrollees SET status = 'pending' WHERE status = 'registered' AND enrollment_type = 'returning'");
}

function ensureOfferColumnExists(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $stmt = $pdo->query("SHOW COLUMNS FROM curriculum LIKE 'is_offered'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE curriculum ADD COLUMN is_offered TINYINT(1) NOT NULL DEFAULT 0 AFTER professor_id');
    }

}
