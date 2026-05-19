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

$studentId = isset($payload['id']) ? (int)$payload['id'] : 0;
$firstName = isset($payload['first_name']) ? trim((string)$payload['first_name']) : '';
$middleName = isset($payload['middle_name']) ? trim((string)$payload['middle_name']) : '';
$lastName = isset($payload['last_name']) ? trim((string)$payload['last_name']) : '';
$email = isset($payload['email']) ? trim((string)$payload['email']) : '';
$phone = isset($payload['phone']) ? trim((string)$payload['phone']) : '';
$guardianContact = isset($payload['guardian_contact']) ? trim((string)$payload['guardian_contact']) : '';
$fbName = isset($payload['fb_name']) ? trim((string)$payload['fb_name']) : '';
$address = isset($payload['address']) ? trim((string)$payload['address']) : '';
$birthDate = isset($payload['birth_date']) ? trim((string)$payload['birth_date']) : '';
$gender = isset($payload['gender']) ? trim((string)$payload['gender']) : '';
$status = isset($payload['status']) ? trim((string)$payload['status']) : '';
$financeStatus = isset($payload['finance_status']) ? trim((string)$payload['finance_status']) : '';
$flagGroup = isset($payload['flag_group']) ? trim((string)$payload['flag_group']) : '';
$profilePhoto = array_key_exists('profile_photo', $payload) ? $payload['profile_photo'] : null;
$courseId = isset($payload['course_id']) ? (int)$payload['course_id'] : 0;
$yearLevel = isset($payload['year_level']) ? (int)$payload['year_level'] : 0;
$currentSemester = isset($payload['current_semester']) ? (int)$payload['current_semester'] : 0;
$currentAcademicYear = isset($payload['current_academic_year']) ? trim((string)$payload['current_academic_year']) : '';
$createMode = strtolower(trim((string)($payload['create_mode'] ?? '')));
$studentType = strtolower(trim((string)($payload['student_type'] ?? '')));
$reason = trim((string)($payload['reason'] ?? ''));
$isCreateMode = in_array($createMode, ['transferee', 'transferee_add'], true);

if (!$isCreateMode && $studentId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Student ID required']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $allowedStatus = ['active', 'inactive', 'graduated', 'transferred'];
    $allowedFinanceStatuses = ['fully_paid', 'down_payment', 'promisory'];
    $allowedGenders = ['Male', 'Female', 'Other'];
    $allowedFlagGroups = ['faithfulness', 'kindness', 'peace', 'love', 'self_control', 'joy', 'greatfulness', 'gentleness'];
    $allowedStudentTypes = ['regular', 'irregular'];
    $role = current_user_role();
    $canEditFlagGroup = in_array($role, ['admin', 'superadmin'], true);

    if ($isCreateMode && $status === '') {
        $status = 'active';
    }

    if ($isCreateMode && $studentType === '') {
        $studentType = 'irregular';
    }

    if ($status !== '' && !in_array($status, $allowedStatus, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid status']);
        exit;
    }

    if ($financeStatus !== '' && !in_array($financeStatus, $allowedFinanceStatuses, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid finance status']);
        exit;
    }

    if ($flagGroup !== '' && !in_array($flagGroup, $allowedFlagGroups, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid flag group']);
        exit;
    }

    if ($gender !== '' && !in_array($gender, $allowedGenders, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid gender']);
        exit;
    }

    if ($studentType !== '' && !in_array($studentType, $allowedStudentTypes, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid student type']);
        exit;
    }

    if ($courseId > 0) {
        $courseCheck = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND is_active = TRUE LIMIT 1');
        $courseCheck->execute([$courseId]);
        if (!$courseCheck->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid course']);
            exit;
        }
    }

    if ($yearLevel !== 0 && ($yearLevel < 1 || $yearLevel > 4)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid year level']);
        exit;
    }

    if ($currentSemester !== 0 && !in_array($currentSemester, [1, 2], true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid semester']);
        exit;
    }

    if ($currentAcademicYear !== '' && strlen($currentAcademicYear) > 20) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid academic year']);
        exit;
    }

    if ($isCreateMode && $courseId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Course is required']);
        exit;
    }

    if ($isCreateMode && $yearLevel <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Year level is required']);
        exit;
    }

    if ($isCreateMode && $currentSemester <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Semester is required']);
        exit;
    }

    if ($email === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Email is required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid email']);
        exit;
    }

    if ($firstName === '' || $lastName === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'First name and last name are required']);
        exit;
    }

    if ($birthDate !== '') {
        $date = DateTime::createFromFormat('Y-m-d', $birthDate);
        if (!$date || $date->format('Y-m-d') !== $birthDate) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid birth date']);
            exit;
        }
    }

    if ($isCreateMode && $currentAcademicYear === '') {
        $currentAcademicYear = inferAcademicYearValue();
    }

    if ($isCreateMode) {
        $pdo->beginTransaction();

        $duplicateStudentStmt = $pdo->prepare('SELECT id FROM students WHERE email = ? LIMIT 1');
        $duplicateStudentStmt->execute([$email]);
        if ($duplicateStudentStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'A student with this email already exists']);
            exit;
        }

        $duplicateUserStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1');
        $duplicateUserStmt->execute([$email, $email]);
        if ($duplicateUserStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'A user account with this email already exists']);
            exit;
        }

        $generatedStudentId = generateStudentIdForManualEntry($pdo);
        $studentRoleIdStmt = $pdo->prepare('SELECT id FROM roles WHERE name = ? LIMIT 1');
        $studentRoleIdStmt->execute(['student']);
        $studentRoleId = (int)($studentRoleIdStmt->fetchColumn() ?: 0);

        $insertStudentStmt = $pdo->prepare(
            'INSERT INTO students (
                student_id, pre_reg_number, first_name, last_name, middle_name, email, phone,
                guardian_contact, fb_name, address, birth_date, gender, course_id, year_level,
                enrollment_date, current_semester, current_academic_year, student_type, status, is_account_active
            ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, TRUE)'
        );
        $insertStudentStmt->execute([
            $generatedStudentId,
            $firstName,
            $lastName,
            $middleName !== '' ? $middleName : null,
            $email,
            $phone !== '' ? $phone : null,
            $guardianContact !== '' ? $guardianContact : null,
            $fbName !== '' ? $fbName : null,
            $address !== '' ? $address : null,
            $birthDate !== '' ? $birthDate : null,
            $gender !== '' ? $gender : null,
            $courseId,
            $yearLevel,
            $currentSemester,
            $currentAcademicYear,
            $studentType !== '' ? $studentType : 'irregular',
            $status !== '' ? $status : 'active',
        ]);

        $studentPk = (int)$pdo->lastInsertId();
        $fullName = trim($firstName . ' ' . $lastName);
        $temporaryPassword = 'student123';
        $passwordHash = password_hash($temporaryPassword, PASSWORD_DEFAULT);

        $insertUserStmt = $pdo->prepare(
            'INSERT INTO users (username, email, password, full_name, role, role_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)'
        );
        $insertUserStmt->execute([
            $email,
            $email,
            $passwordHash,
            $fullName,
            'student',
            $studentRoleId > 0 ? $studentRoleId : null,
        ]);

        $actorId = (int)(current_user()['id'] ?? 0);
        $logStmt = $pdo->prepare(
            'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id)
             VALUES (?, ?, ?, ?, ?)'
        );
        $logStmt->execute([
            $actorId > 0 ? $actorId : null,
            'add_transferee_student',
            'Added transferee student ' . $generatedStudentId . ($reason !== '' ? ' - ' . $reason : ''),
            'student',
            $studentPk,
        ]);

        $pdo->commit();

        echo json_encode([
            'ok' => true,
            'message' => 'Transferee student added successfully. Temporary password: ' . $temporaryPassword,
            'student_id' => $generatedStudentId,
        ]);
        exit;
    }

    $fields = [];
    $params = [];

    $fields[] = '`first_name` = ?';
    $params[] = $firstName;

    $fields[] = '`middle_name` = ?';
    $params[] = $middleName !== '' ? $middleName : null;

    $fields[] = '`last_name` = ?';
    $params[] = $lastName;

    $fields[] = '`email` = ?';
    $params[] = $email;

    $fields[] = '`phone` = ?';
    $params[] = $phone !== '' ? $phone : null;

    $fields[] = '`guardian_contact` = ?';
    $params[] = $guardianContact !== '' ? $guardianContact : null;

    $fields[] = '`fb_name` = ?';
    $params[] = $fbName !== '' ? $fbName : null;

    $fields[] = '`address` = ?';
    $params[] = $address !== '' ? $address : null;

    $fields[] = '`birth_date` = ?';
    $params[] = $birthDate !== '' ? $birthDate : null;

    $fields[] = '`gender` = ?';
    $params[] = $gender !== '' ? $gender : null;

    if ($status !== '') {
        $fields[] = '`status` = ?';
        $params[] = $status;
    }

    if ($financeStatus !== '') {
        $fields[] = '`finance_status` = ?';
        $params[] = $financeStatus;
    }

    if ($canEditFlagGroup) {
        $fields[] = '`flag_group` = ?';
        $params[] = $flagGroup !== '' ? $flagGroup : null;
    }

    if ($courseId > 0) {
        $fields[] = '`course_id` = ?';
        $params[] = $courseId;
    }

    if ($studentType !== '') {
        $fields[] = '`student_type` = ?';
        $params[] = $studentType;
    }

    if ($yearLevel > 0) {
        $fields[] = '`year_level` = ?';
        $params[] = $yearLevel;
    }

    if ($currentSemester > 0) {
        $fields[] = '`current_semester` = ?';
        $params[] = $currentSemester;
    }

    $fields[] = '`current_academic_year` = ?';
    $params[] = $currentAcademicYear !== '' ? $currentAcademicYear : null;

    if ($profilePhoto !== null) {
        $fields[] = '`profile_photo` = ?';
        $params[] = trim((string)$profilePhoto) === '' ? null : $profilePhoto;
    }

    $pdo->beginTransaction();

    $studentStmt = $pdo->prepare('SELECT email, first_name, last_name FROM students WHERE id = ?');
    $studentStmt->execute([$studentId]);
    $existingStudent = $studentStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existingStudent) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Student not found']);
        exit;
    }

    $oldStudentEmail = trim((string)$existingStudent['email']);
    $studentFullName = trim($firstName . ' ' . $lastName);

    $sql = 'UPDATE students SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $params[] = $studentId;
    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    if ($oldStudentEmail !== '') {
        $userStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $userStmt->execute([$oldStudentEmail]);
        $linkedUser = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($linkedUser) {
            $updateUserStmt = $pdo->prepare(
                'UPDATE users SET email = ?, username = ?, full_name = ? WHERE id = ?'
            );
            $updateUserStmt->execute([$email, $email, $studentFullName, (int)$linkedUser['id']]);
        }
    }

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (isset($_SESSION['user']) && isset($_SESSION['user']['email']) && strcasecmp(trim((string)$_SESSION['user']['email']), $oldStudentEmail) === 0) {
        $_SESSION['user']['email'] = $email;
        $_SESSION['user']['fullName'] = $studentFullName;
        if ($profilePhoto !== null) {
            $_SESSION['user']['photo'] = trim((string)$profilePhoto) === '' ? null : $profilePhoto;
            $_SESSION['user']['profile_photo'] = trim((string)$profilePhoto) === '' ? null : $profilePhoto;
        }
    }

    $pdo->commit();

    echo json_encode(['ok' => true, 'message' => 'Student updated successfully']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to update student',
        'details' => $e->getMessage(),
    ]);
}

function inferAcademicYearValue(): string
{
    $year = (int)date('Y');
    $month = (int)date('n');
    if ($month >= 8) {
        return $year . '-' . ($year + 1);
    }

    return ($year - 1) . '-' . $year;
}

function generateStudentIdForManualEntry(PDO $pdo): string
{
    $year = (string)date('Y');
    $stmt = $pdo->prepare('SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1');
    $stmt->execute([$year . '-%']);
    $lastStudentId = (string)($stmt->fetchColumn() ?: '');

    $next = 1;
    if (preg_match('/^\d{4}-(\d{4})$/', $lastStudentId, $matches) === 1) {
        $next = ((int)$matches[1]) + 1;
    }

    return sprintf('%s-%04d', $year, $next);
}

