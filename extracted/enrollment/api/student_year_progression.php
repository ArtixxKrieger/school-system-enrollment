<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('settings', 'edit');

$pdo = require __DIR__ . '/../config/db.php';

function progression_request_ip(): ?string
{
    $ipAddress = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
    if (strpos($ipAddress, ',') !== false) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }

    return $ipAddress !== '' ? $ipAddress : null;
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
    ensureEnrolleeWorkflowColumns($pdo);
    $pdo->exec("UPDATE students SET progression_status = 'enrolled' WHERE progression_status IS NULL OR TRIM(progression_status) = ''");

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = [];
    }

    $action = isset($input['action']) ? (string)$input['action'] : '';

    switch ($action) {
        case 'trigger_semester_end':
            $semester = isset($input['semester']) ? (int)$input['semester'] : 0;

            if (!in_array($semester, [1, 2], true)) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Invalid semester selected']);
                exit;
            }

            $pdo->beginTransaction();

            if ($semester === 1) {
                // Update students to 2nd semester immediately so they can see next semester subjects
                $stmt = $pdo->prepare("
                    UPDATE students
                    SET current_semester = 2,
                        progression_status = 'pending_progression',
                        status = 'active',
                        is_account_active = 1
                    WHERE current_semester = 1
                      AND status = 'active'
                      AND COALESCE(progression_status, 'enrolled') = 'enrolled'
                      AND (import_semester IS NULL OR import_semester != 2)
                ");
                $stmt->execute();
                $affected = $stmt->rowCount();

                $pdo->exec("
                    INSERT INTO enrollees
                        (pre_reg_number, existing_student_id, first_name, last_name, middle_name,
                         email, phone, guardian_contact, fb_name, address, birth_date, gender,
                         course_id, year_level, status, enrollment_type, application_date, approved_date, approved_by)
                    SELECT
                        COALESCE(NULLIF(s.pre_reg_number, ''), CONCAT('RET-', s.student_id)),
                        s.student_id,
                        s.first_name, s.last_name, s.middle_name,
                        s.email, s.phone, s.guardian_contact, s.fb_name, s.address,
                        s.birth_date, s.gender, s.course_id,
                        s.year_level,
                        'pending',
                        'returning',
                        NOW(),
                        NULL,
                        NULL
                    FROM students s
                    WHERE s.current_semester = 2
                      AND s.status = 'active'
                      AND s.progression_status = 'pending_progression'
                      AND (s.import_semester IS NULL OR s.import_semester != 2)
                    ON DUPLICATE KEY UPDATE
                        status = 'pending',
                        enrollment_type = 'returning',
                        existing_student_id = VALUES(existing_student_id),
                        year_level = VALUES(year_level),
                        approved_date = NULL,
                        approved_by = NULL,
                        application_date = NOW()
                ");

                $pdo->exec("
                    UPDATE students
                    SET pre_reg_number = COALESCE(NULLIF(pre_reg_number, ''), CONCAT('RET-', student_id))
                    WHERE current_semester = 2
                      AND status = 'active'
                      AND progression_status = 'pending_progression'
                      AND (import_semester IS NULL OR import_semester != 2)
                ");

                $message = $affected > 0
                    ? "$affected student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects."
                    : 'No eligible students found for 1st semester progression.';
            } else {
                // HANDLE 2ND SEMESTER COMPLETION - separate logic for graduation vs progression
                
                // PART 1: Handle 4th year students -> GRADUATE them
                $graduateStmt = $pdo->prepare("
                    UPDATE students
                    SET status = 'graduated',
                        progression_status = 'enrolled',
                        graduated_at = NOW(),
                        is_account_active = 0
                    WHERE current_semester = 2
                      AND year_level = 4
                      AND status = 'active'
                      AND COALESCE(progression_status, 'enrolled') = 'enrolled'
                ");
                $graduateStmt->execute();
                $graduatedCount = $graduateStmt->rowCount();

                // PART 2: Handle students < 4th year -> ADVANCE to next year
                $stmt = $pdo->prepare("
                    UPDATE students
                    SET year_level = year_level + 1,
                        current_semester = 1,
                        progression_status = 'pending_progression',
                        status = 'active',
                        is_account_active = 1
                    WHERE current_semester = 2
                      AND year_level < 4
                      AND status = 'active'
                      AND COALESCE(progression_status, 'enrolled') = 'enrolled'
                ");
                $stmt->execute();
                $affected = $stmt->rowCount();

                // Create enrollee records ONLY for non-graduated students (year_level < 4)
                $pdo->exec("
                    INSERT INTO enrollees
                        (pre_reg_number, existing_student_id, first_name, last_name, middle_name,
                         email, phone, guardian_contact, fb_name, address, birth_date, gender,
                         course_id, year_level, status, enrollment_type, application_date, approved_date, approved_by)
                    SELECT
                        COALESCE(NULLIF(s.pre_reg_number, ''), CONCAT('RET-', s.student_id)),
                        s.student_id,
                        s.first_name, s.last_name, s.middle_name,
                        s.email, s.phone, s.guardian_contact, s.fb_name, s.address,
                        s.birth_date, s.gender, s.course_id,
                        s.year_level,
                        'pending',
                        'returning',
                        NOW(),
                        NULL,
                        NULL
                    FROM students s
                    WHERE s.current_semester = 1
                      AND s.year_level < 4
                      AND s.status = 'active'
                      AND s.progression_status = 'pending_progression'
                    ON DUPLICATE KEY UPDATE
                        status = 'pending',
                        enrollment_type = 'returning',
                        existing_student_id = VALUES(existing_student_id),
                        year_level = VALUES(year_level),
                        approved_date = NULL,
                        approved_by = NULL,
                        application_date = NOW()
                ");

                $pdo->exec("
                    UPDATE students
                    SET pre_reg_number = COALESCE(NULLIF(pre_reg_number, ''), CONCAT('RET-', student_id))
                    WHERE current_semester = 1
                      AND year_level < 4
                      AND status = 'active'
                      AND progression_status = 'pending_progression'
                ");

                $message = '';
                if ($affected > 0) {
                    $message .= "$affected student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. ";
                }
                if ($graduatedCount > 0) {
                    $message .= "$graduatedCount 4th year student(s) have graduated and will appear in Records.";
                }
                if (!$affected && !$graduatedCount) {
                    $message = 'No eligible students found for 2nd semester progression.';
                }
            }

            $pdo->exec("
                UPDATE users u
                INNER JOIN students s ON s.email = u.email
                SET u.is_active = 1
                WHERE s.status = 'active'
                  AND s.is_account_active = 1
            ");

            $user = current_user() ?? [];
            $logStmt = $pdo->prepare(
                'INSERT INTO activity_logs (user_id, action, description, entity_type, new_value, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $logStmt->execute([
                isset($user['id']) ? (int)$user['id'] : null,
                'semester_end_triggered',
                'Processed semester-end progression for semester ' . $semester . ' (' . $affected . ' student(s) affected).',
                'enrollment_progression',
                json_encode([
                    'semester' => $semester,
                    'affected' => $affected,
                    'message' => $message,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                progression_request_ip(),
            ]);

            $pdo->commit();

            echo json_encode([
                'ok' => true,
                'message' => $message,
                'affected' => $affected,
                'semester' => $semester
            ]);
            break;

        case 'approve_progression':
            http_response_code(410);
            echo json_encode([
                'ok' => false,
                'error' => 'Progression approval now happens only through Enrollees re-enrollment approval.'
            ]);
            break;

        case 'admin_enroll_late':
            // Admin enrolls a student who missed the enrollment window
            $studentId = isset($input['student_id']) ? (int)$input['student_id'] : 0;
            if ($studentId <= 0) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Invalid student ID']);
                exit;
            }

            $stmt = $pdo->prepare("
                UPDATE students
                SET status = 'active',
                    is_account_active = 1,
                    progression_status = 'enrolled'
                WHERE id = ?
                  AND (status = 'inactive' OR progression_status = 'pending_progression')
            ");
            $stmt->execute([$studentId]);

            // Sync user account
            $pdo->prepare("
                UPDATE users u
                INNER JOIN students s ON s.email = u.email
                SET u.is_active = 1
                WHERE s.id = ?
            ")->execute([$studentId]);

            if ($stmt->rowCount() === 0) {
                echo json_encode(['ok' => false, 'error' => 'Student not found or already enrolled']);
                exit;
            }

            echo json_encode(['ok' => true, 'message' => 'Student enrolled by admin']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid action. Use: trigger_semester_end or admin_enroll_late']);
    }

} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
