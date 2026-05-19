<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('enrollees', 'edit');

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

$enrollee_id = isset($payload['enrollee_id']) ? (int)$payload['enrollee_id'] : 0;
$admin_id = isset($payload['admin_id']) ? (int)$payload['admin_id'] : 1; // Default admin ID

if ($enrollee_id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid enrollee ID']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $enrolleeColumns = getTableColumns($pdo, 'enrollees');
    $studentColumns = getTableColumns($pdo, 'students');

    $hasEnrolleeGuardianContact = in_array('guardian_contact', $enrolleeColumns, true);
    if (!$hasEnrolleeGuardianContact) {
        $pdo->exec('ALTER TABLE enrollees ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone');
        $hasEnrolleeGuardianContact = true;
    }

    $hasEnrolleeFbName = in_array('fb_name', $enrolleeColumns, true);
    if (!$hasEnrolleeFbName) {
        $pdo->exec('ALTER TABLE enrollees ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact');
        $hasEnrolleeFbName = true;
    }

    $hasStudentGuardianContact = in_array('guardian_contact', $studentColumns, true);
    if (!$hasStudentGuardianContact) {
        $pdo->exec('ALTER TABLE students ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone');
        $hasStudentGuardianContact = true;
    }

    $hasStudentFbName = in_array('fb_name', $studentColumns, true);
    if (!$hasStudentFbName) {
        $pdo->exec('ALTER TABLE students ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact');
        $hasStudentFbName = true;
    }

    $hasStudentBatchNumber = in_array('batch_number', $studentColumns, true);
    if (!$hasStudentBatchNumber) {
        $pdo->exec('ALTER TABLE students ADD COLUMN batch_number VARCHAR(30) NULL AFTER current_academic_year');
        $hasStudentBatchNumber = true;
    }

    ensureStudentEnrolledSubjectsTable($pdo);
    ensureOfferColumnExists($pdo);

    // Start transaction
    $pdo->beginTransaction();

    $currentSemester = inferCurrentSemester();
    $currentAcademicYear = inferAcademicYear();
    $settingsStmt = $pdo->query('SELECT strict_enrollment_windows FROM enrollment_settings WHERE id = 1 LIMIT 1');
    $settingsRow = $settingsStmt->fetch(PDO::FETCH_ASSOC);
    $strictEnrollmentWindows = isset($settingsRow['strict_enrollment_windows'])
        ? (bool)(int)$settingsRow['strict_enrollment_windows']
        : false;

    // Get enrollee data
    $selectFields = 'id, pre_reg_number, existing_student_id, enrollment_type, first_name, last_name, middle_name, email, phone, address, birth_date, gender, password_hash, course_id, year_level';
    if ($hasEnrolleeGuardianContact) {
        $selectFields .= ', guardian_contact';
    }
    if ($hasEnrolleeFbName) {
        $selectFields .= ', fb_name';
    }

    $stmt = $pdo->prepare('SELECT ' . $selectFields . ' FROM enrollees WHERE id = ? AND status IN ("pre-registered", "enrolled", "registered")');
    $stmt->execute([$enrollee_id]);
    $enrollee = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$enrollee) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Enrollee not found or already processed']);
        exit;
    }

    // Check if enrollment is within allowed dates for this course
    $scheduleStmt = $pdo->prepare('
        SELECT * FROM course_enrollment_schedule
        WHERE course_id = ?
    ');
    $scheduleStmt->execute([$enrollee['course_id']]);
    $enrollmentSchedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);

    $nowTimestamp = time();
    if ($strictEnrollmentWindows && $enrollmentSchedule) {
        $windowStartTimestamp = strtotime((string)($enrollmentSchedule['enrollment_start_date'] ?? ''));
        $windowEndTimestamp = strtotime((string)($enrollmentSchedule['enrollment_end_date'] ?? ''));

        if ($windowStartTimestamp === false || $windowEndTimestamp === false) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'error' => 'Enrollment schedule is not configured correctly for this course'
            ]);
            exit;
        }

        if ($nowTimestamp < $windowStartTimestamp || $nowTimestamp > $windowEndTimestamp) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'error' => "Enrollment is not open for this course",
                'enrollment_window' => [
                    'start' => $enrollmentSchedule['enrollment_start_date'],
                    'end' => $enrollmentSchedule['enrollment_end_date']
                ]
            ]);
            exit;
        }
    } elseif ($strictEnrollmentWindows && !$enrollmentSchedule) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => "No enrollment window set for this course"
        ]);
        exit;
    }

    // Determine if this is a returning student or new pre-registration
    $isReturning = ($enrollee['enrollment_type'] ?? 'new') === 'returning';
    $existingStudentId = $enrollee['existing_student_id'] ?? null;
    $yearLevel = (int)$enrollee['year_level'];
    $existingStudent = null;

    if ($isReturning && $existingStudentId) {
        // RETURNING STUDENT: Continue their progression
        $targetInfo = resolveReturningEnrollmentTarget($pdo, (string)$existingStudentId, $yearLevel, $currentSemester, $currentAcademicYear);
        $targetSemester = (int)$targetInfo['semester'];
        $targetAcademicYear = (string)$targetInfo['academic_year'];
        $targetYearLevel = (int)$targetInfo['year_level'];
        $existingStudent = $targetInfo['student'];
    } else {
        // NEW STUDENT (pre-registration): ALWAYS start at Year 1, Semester 1
        $targetSemester = 1;
        $targetAcademicYear = $currentAcademicYear;
        $targetYearLevel = 1;
    }

    // Check max slots if specified
    if ($enrollmentSchedule && $enrollmentSchedule['max_slots']) {
        $countStmt = $pdo->prepare('
            SELECT COUNT(*) as enrolled_count
            FROM students
            WHERE course_id = ? AND current_academic_year = ? AND current_semester = ?
        ');
        $countStmt->execute([
            $enrollee['course_id'],
            $targetAcademicYear,
            $targetSemester
        ]);
        $enrolledCount = $countStmt->fetch()['enrolled_count'];

        if ($enrolledCount >= $enrollmentSchedule['max_slots']) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                'ok' => false,
                'error' => "Maximum enrollment slots reached for this course"
            ]);
            exit;
        }
    }

    // Update enrollee status
    $stmt = $pdo->prepare('
        UPDATE enrollees
        SET status = "approved", approved_date = NOW(), approved_by = ?
        WHERE id = ?
    ');
    $stmt->execute([$admin_id, $enrollee_id]);

    if ($isReturning && $existingStudentId) {
        // ====== RETURNING STUDENT: Reactivate existing record ======
        if (!$existingStudent) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Existing student record not found for re-enrollment']);
            exit;
        }

        $updateStmt = $pdo->prepare('
            UPDATE students
            SET status = "active",
                is_account_active = 1,
                progression_status = "enrolled",
                import_semester = NULL,
                year_level = ?,
                current_semester = ?,
                current_academic_year = ?,
                enrollment_date = NOW()
            WHERE student_id = ?
        ');
        $updateStmt->execute([
            $targetYearLevel,
            $targetSemester,
            $targetAcademicYear,
            $existingStudentId,
        ]);

        $student_id = (int)$existingStudent['id'];
        $finalStudentId = $existingStudentId;

        // Reactivate user account
        $userSyncStmt = $pdo->prepare('
            UPDATE users u
            INNER JOIN students s ON s.email = u.email
            SET u.is_active = 1
            WHERE s.student_id = ?
        ');
        $userSyncStmt->execute([$existingStudentId]);

        syncApprovedEnrolledSubjects($pdo, $student_id, (int)$enrollee['course_id'], $targetYearLevel, $targetSemester, $admin_id);

        // Log
        $stmt = $pdo->prepare('
            INSERT INTO activity_logs
                (user_id, action, description, entity_type, entity_id)
            VALUES
                (?, "re_enrolled_student", ?, "student", ?)
        ');
        $stmt->execute([
            $admin_id,
            "Re-enrolled student {$existingStudentId} for {$targetAcademicYear} semester {$targetSemester}, year level {$targetYearLevel}",
            $student_id
        ]);

    } else {
        // ====== NEW STUDENT: Create new student record ======
        $batchYear = (string)date('Y');
        $generatedStudentId = generateStudentId($pdo, $batchYear);

        $insertColumns = [
            'student_id', 'pre_reg_number', 'first_name', 'last_name', 'middle_name', 'email', 'phone', 'address',
            'birth_date', 'gender', 'course_id', 'year_level', 'status', 'progression_status', 'is_account_active', 'current_semester', 'current_academic_year', 'batch_number', 'enrollment_date'
        ];
        $insertValues = [
            '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '"active"', '"enrolled"', '1', '?', '?', '?', 'NOW()'
        ];
        $insertParams = [
            $generatedStudentId,
            $enrollee['pre_reg_number'],
            $enrollee['first_name'],
            $enrollee['last_name'],
            $enrollee['middle_name'],
            $enrollee['email'],
            $enrollee['phone'],
            $enrollee['address'],
            $enrollee['birth_date'],
            $enrollee['gender'],
            $enrollee['course_id'],
            $targetYearLevel,
            $targetSemester,
            $targetAcademicYear,
            $batchYear
        ];

        if ($hasStudentGuardianContact) {
            $insertColumns[] = 'guardian_contact';
            $insertValues[] = '?';
            $insertParams[] = $enrollee['guardian_contact'] ?? null;
        }

        if ($hasStudentFbName) {
            $insertColumns[] = 'fb_name';
            $insertValues[] = '?';
            $insertParams[] = $enrollee['fb_name'] ?? null;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO students (' . implode(', ', $insertColumns) . ') VALUES (' . implode(', ', $insertValues) . ')'
        );
        $stmt->execute($insertParams);

        $student_id = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare('SELECT student_id FROM students WHERE id = ?');
        $stmt->execute([$student_id]);
        $studentRow = $stmt->fetch(PDO::FETCH_ASSOC);
        $finalStudentId = $studentRow['student_id'];

        // Create or update a student user account
        $roleStmt = $pdo->prepare('SELECT id FROM roles WHERE name = ? LIMIT 1');
        $roleStmt->execute(['student']);
        $roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
        $studentRoleId = $roleRow ? (int)$roleRow['id'] : null;

        $username = strtolower(trim($enrollee['email']));
        $fullName = trim($enrollee['first_name'] . ' ' . ($enrollee['middle_name'] ?? '') . ' ' . $enrollee['last_name']);
        $passwordHash = $enrollee['password_hash'] ?: password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);

        $userCheck = $pdo->prepare('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1');
        $userCheck->execute([$enrollee['email'], $username]);
        $existingUser = $userCheck->fetch(PDO::FETCH_ASSOC);

        if ($existingUser) {
            $updateUser = $pdo->prepare('UPDATE users SET full_name = ?, role = ?, role_id = ?, is_active = TRUE, password = ? WHERE id = ?');
            $updateUser->execute([
                $fullName,
                'student',
                $studentRoleId,
                $passwordHash,
                (int)$existingUser['id'],
            ]);
        } else {
            $insertUser = $pdo->prepare('INSERT INTO users (username, email, password, full_name, role, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)');
            $insertUser->execute([
                $username,
                $enrollee['email'],
                $passwordHash,
                $fullName,
                'student',
                $studentRoleId,
            ]);
        }

        syncApprovedEnrolledSubjects($pdo, $student_id, (int)$enrollee['course_id'], $targetYearLevel, $targetSemester, $admin_id);

        // Log
        $stmt = $pdo->prepare('
            INSERT INTO activity_logs
                (user_id, action, description, entity_type, entity_id)
            VALUES
                (?, "approved_student", ?, "student", ?)
        ');
        $stmt->execute([
            $admin_id,
            "Approved enrollee {$enrollee['pre_reg_number']} as student {$finalStudentId}",
            $student_id
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'student_id' => $finalStudentId,
        'message' => $isReturning ? 'Student re-enrolled successfully' : 'Enrollee approved successfully',
        'is_returning' => $isReturning,
        'semester_info' => [
            'academic_year' => $targetAcademicYear,
            'semester' => $targetSemester === 1 ? '1st Semester' : '2nd Semester',
            'year_level' => $targetYearLevel
        ]
    ]);
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to approve enrollee',
        'details' => $e->getMessage()
    ]);
}

function resolveReturningEnrollmentTarget(PDO $pdo, string $existingStudentId, int $fallbackYearLevel, int $fallbackSemester, string $fallbackAcademicYear): array
{
    $stmt = $pdo->prepare('SELECT id, student_id, year_level, current_semester, current_academic_year FROM students WHERE student_id = ? LIMIT 1');
    $stmt->execute([$existingStudentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

    if (!$student) {
        return [
            'student' => null,
            'year_level' => $fallbackYearLevel,
            'semester' => $fallbackSemester,
            'academic_year' => $fallbackAcademicYear,
        ];
    }

    $previousSemester = (int)($student['current_semester'] ?? 1);
    $currentStoredYearLevel = (int)($student['year_level'] ?? 1);
    $academicYear = trim((string)($student['current_academic_year'] ?? ''));

    // IMPORTANT: student_year_progression.php already moved students to their target semester/year
    // The student record's current_semester and year_level are ALREADY correct
    // We just need to use those values when re-enrolling
    $yearLevel = $currentStoredYearLevel;
    $semester = $previousSemester;
    
    if ($academicYear === '') {
        $academicYear = $fallbackAcademicYear;
    }

    return [
        'student' => $student,
        'year_level' => $yearLevel,
        'semester' => $semester,
        'academic_year' => $academicYear,
    ];
}

function incrementAcademicYear(string $academicYear): string
{
    if (preg_match('/^(\d{4})-(\d{4})$/', trim($academicYear), $matches) === 1) {
        return ((int)$matches[1] + 1) . '-' . ((int)$matches[2] + 1);
    }

    return $academicYear;
}

function generateStudentId(PDO $pdo, string $batchYear = ''): string
{
    $year = (string)date('Y');
    if (preg_match('/(\d{4})/', $batchYear, $matches) === 1) {
        $year = $matches[1];
    }

    $stmt = $pdo->prepare('SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1');
    $stmt->execute([$year . '%']);
    $lastStudentId = (string)($stmt->fetchColumn() ?: '');

    $next = 1;
    if (preg_match('/^\d{4}-?(\d{4})$/', $lastStudentId, $matches) === 1) {
        $next = ((int)$matches[1]) + 1;
    }

    return sprintf('%s%04d', $year, $next);
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

function getTableColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    $stmt->execute();
    return array_map(static function (array $column): string {
        return $column['Field'];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function ensureStudentEnrolledSubjectsTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS student_enrolled_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            curriculum_id INT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT "enrolled",
            enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at DATETIME NULL DEFAULT NULL,
            approved_by INT NULL,
            UNIQUE KEY uniq_student_enrolled_subject (student_id, curriculum_id),
            KEY idx_student_enrolled_student (student_id),
            KEY idx_student_enrolled_curriculum (curriculum_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

function ensureOfferColumnExists(PDO $pdo): void
{
    $stmt = $pdo->query("SHOW COLUMNS FROM curriculum LIKE 'is_offered'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE curriculum ADD COLUMN is_offered TINYINT(1) NOT NULL DEFAULT 0 AFTER professor_id');
    }

    $pdo->exec('UPDATE curriculum SET is_offered = 1 WHERE professor_id IS NOT NULL');
}

function syncApprovedEnrolledSubjects(PDO $pdo, int $studentId, int $courseId, int $yearLevel, int $semester, int $approvedBy): void
{
    if ($studentId <= 0 || $courseId <= 0 || $yearLevel <= 0 || $semester <= 0) {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO student_enrolled_subjects (student_id, curriculum_id, status, enrolled_at, approved_at, approved_by)
         SELECT ?, cu.id, "enrolled", NOW(), NOW(), ?
         FROM curriculum cu
         WHERE cu.course_id = ?
           AND cu.year_level = ?
           AND cu.semester = ?
           AND cu.is_active = TRUE
           AND COALESCE(cu.is_offered, 0) = 1
         ON DUPLICATE KEY UPDATE status = "enrolled", approved_at = NOW(), approved_by = VALUES(approved_by)'
    );

    $stmt->execute([$studentId, $approvedBy > 0 ? $approvedBy : null, $courseId, $yearLevel, $semester]);
}

