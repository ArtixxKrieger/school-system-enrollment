<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'edit');

$pdo = require __DIR__ . '/../config/db.php';

function student_status_request_ip(): ?string
{
    $ipAddress = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
    if (strpos($ipAddress, ',') !== false) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }

    return $ipAddress !== '' ? $ipAddress : null;
}

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    ensureStudentRecordColumns($pdo);
    ensureEnrolleeWorkflowColumns($pdo);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = [];
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $status = isset($input['status']) ? (string)$input['status'] : '';

    $allowed = ['active', 'inactive', 'graduated', 'transferred'];
    if ($id <= 0 || !in_array($status, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid student or status']);
        exit;
    }

    $shouldEnableAccount = $status === 'active';
    $graduatedAt = $status === 'graduated' ? date('Y-m-d H:i:s') : null;
    $archiveReason = $status === 'graduated'
        ? 'graduated'
        : ($status === 'inactive' ? 'inactive' : ($status === 'transferred' ? 'dropped' : null));

    $stmt = $pdo->prepare('UPDATE students SET `status` = ?, is_account_active = ?, graduated_at = CASE WHEN ? IS NOT NULL THEN COALESCE(graduated_at, ?) ELSE NULL END, archived_at = NULL, archive_reason = ? WHERE id = ?');
    $stmt->execute([$status, $shouldEnableAccount ? 1 : 0, $graduatedAt, $graduatedAt, $archiveReason, $id]);

    $studentLookupStmt = $pdo->prepare('SELECT id, student_id, first_name, last_name, status FROM students WHERE id = ? LIMIT 1');
    $studentLookupStmt->execute([$id]);
    $studentRow = $studentLookupStmt->fetch(PDO::FETCH_ASSOC);

    $userSyncStmt = $pdo->prepare('
        UPDATE users u
        INNER JOIN students s ON s.email = u.email
        SET u.is_active = ?
        WHERE s.id = ?
    ');
    $userSyncStmt->execute([$shouldEnableAccount ? 1 : 0, $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Student not found']);
        exit;
    }

    // When student becomes inactive, queue them for re-enrollment in enrollees
    if ($status === 'inactive') {
        queueStudentForReEnrollment($pdo, $id);
    }

    $user = current_user() ?? [];
    $logStmt = $pdo->prepare(
        'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, new_value, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $logStmt->execute([
        isset($user['id']) ? (int)$user['id'] : null,
        'student_status_updated',
        'Updated student ' . ($studentRow['student_id'] ?? ('#' . $id)) . ' to ' . $status . '.',
        'student',
        $id,
        json_encode([
            'student_id' => $studentRow['student_id'] ?? null,
            'student_name' => trim((string)($studentRow['first_name'] ?? '') . ' ' . (string)($studentRow['last_name'] ?? '')),
            'status' => $status,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        student_status_request_ip(),
    ]);

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to update student',
        'details' => $e->getMessage(),
    ]);
}

/**
 * When a student becomes inactive (end of semester), reset their enrollee record
 * so they appear in the enrollees list for re-enrollment approval.
 */
function queueStudentForReEnrollment(PDO $pdo, int $studentDbId): void
{
    $student = $pdo->prepare('
        SELECT s.student_id, s.pre_reg_number, s.first_name, s.last_name, s.middle_name,
               s.email, s.phone, s.guardian_contact, s.fb_name, s.address,
               s.birth_date, s.gender, s.course_id, s.year_level, s.current_semester
        FROM students s
        WHERE s.id = ?
    ');
    $student->execute([$studentDbId]);
    $s = $student->fetch(PDO::FETCH_ASSOC);
    if (!$s) return;

    // Determine next year_level: if both semesters completed, next year level
    $nextYearLevel = (int)$s['year_level'];
    $nextSemester = (int)$s['current_semester'];
    if ($nextSemester === 2) {
        // Finished 2nd semester → next year level, 1st semester
        $nextYearLevel++;
        $nextSemester = 1;
    } else {
        // Finished 1st semester → same year, 2nd semester
        $nextSemester = 2;
    }

    $preRegNumber = $s['pre_reg_number'];

    if ($preRegNumber) {
        // Update existing enrollee record back to pending for returning students
        $update = $pdo->prepare('
            UPDATE enrollees
            SET status = "pending",
                enrollment_type = "returning",
                existing_student_id = ?,
                year_level = ?,
                approved_date = NULL,
                approved_by = NULL,
                application_date = NOW()
            WHERE pre_reg_number = ?
        ');
        $update->execute([$s['student_id'], $nextYearLevel, $preRegNumber]);
    } else {
        // No pre_reg_number link — create a new enrollee record
        $newPreReg = 'RET-' . $s['student_id'];
        $insert = $pdo->prepare('
            INSERT INTO enrollees
                (pre_reg_number, existing_student_id, first_name, last_name, middle_name, email, phone,
                 guardian_contact, fb_name, address, birth_date, gender, course_id, year_level,
                 status, enrollment_type, application_date)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", "returning", NOW())
            ON DUPLICATE KEY UPDATE
                status = "pending",
                enrollment_type = "returning",
                existing_student_id = VALUES(existing_student_id),
                year_level = VALUES(year_level),
                approved_date = NULL,
                approved_by = NULL,
                application_date = NOW()
        ');
        $insert->execute([
            $newPreReg, $s['student_id'],
            $s['first_name'], $s['last_name'], $s['middle_name'],
            $s['email'], $s['phone'], $s['guardian_contact'], $s['fb_name'],
            $s['address'], $s['birth_date'], $s['gender'],
            $s['course_id'], $nextYearLevel,
        ]);

        // Link student to the new pre_reg_number
        $pdo->prepare('UPDATE students SET pre_reg_number = ? WHERE id = ?')
            ->execute([$newPreReg, $studentDbId]);
    }
}
