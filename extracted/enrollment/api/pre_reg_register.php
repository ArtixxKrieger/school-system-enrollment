<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

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

$lastname = isset($payload['lastname']) ? trim((string)$payload['lastname']) : '';
$firstname = isset($payload['firstname']) ? trim((string)$payload['firstname']) : '';
$middlename = isset($payload['middlename']) ? trim((string)$payload['middlename']) : '';
$course_code = isset($payload['course']) ? trim((string)$payload['course']) : '';
$email = isset($payload['email']) ? trim((string)$payload['email']) : '';
$phone = isset($payload['phone']) ? trim((string)$payload['phone']) : '';
$guardian_contact = isset($payload['guardian_contact']) ? trim((string)$payload['guardian_contact']) : '';
$fb_name = isset($payload['fb_name']) ? trim((string)$payload['fb_name']) : '';
$address = isset($payload['address']) ? trim((string)$payload['address']) : '';
$birth_date = isset($payload['birth_date']) ? trim((string)$payload['birth_date']) : '';
$gender = isset($payload['gender']) ? trim((string)$payload['gender']) : '';
$year_level = isset($payload['year_level']) ? trim((string)$payload['year_level']) : '';
$password = isset($payload['password']) ? trim((string)$payload['password']) : '';
$confirmPassword = isset($payload['confirmPassword']) ? trim((string)$payload['confirmPassword']) : '';

if ($lastname === '' || $firstname === '' || $course_code === '' || $email === '' || $password === '' || $confirmPassword === '' || $year_level === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Passwords do not match']);
    exit;
}

$yearLevelValue = 1;
if (in_array($year_level, ['1', '2', '3', '4'], true)) {
    $yearLevelValue = (int)$year_level;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    // Check if enrollment is still open before accepting registration
    $settingsStmt = $pdo->query('SELECT strict_enrollment_windows, system_close_date FROM enrollment_settings WHERE id = 1');
    $enrollSettings = $settingsStmt ? $settingsStmt->fetch(PDO::FETCH_ASSOC) : null;

    if ($enrollSettings) {
        $now = new DateTime();
        $closeDate = $enrollSettings['system_close_date'] ?? null;
        if ($closeDate && $now > new DateTime($closeDate)) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => 'The enrollment period has ended. Pre-registration is closed.']);
            exit;
        }

        $strict = (int)($enrollSettings['strict_enrollment_windows'] ?? 0);
        if ($strict) {
            $nowStr = $now->format('Y-m-d H:i:s');
            $windowStmt = $pdo->prepare(
                'SELECT COUNT(*) FROM course_enrollment_schedule WHERE enrollment_start_date <= ? AND enrollment_end_date >= ?'
            );
            $windowStmt->execute([$nowStr, $nowStr]);
            if ((int)$windowStmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode(['ok' => false, 'error' => 'Pre-registration is currently closed. No enrollment windows are open.']);
                exit;
            }
        }
    }
    $enrolleeColumns = getTableColumns($pdo, 'enrollees');

    $hasGuardianContact = in_array('guardian_contact', $enrolleeColumns, true);
    if (!$hasGuardianContact) {
        $pdo->exec('ALTER TABLE enrollees ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone');
        $hasGuardianContact = true;
    }

    $hasFbName = in_array('fb_name', $enrolleeColumns, true);
    if (!$hasFbName) {
        $pdo->exec('ALTER TABLE enrollees ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact');
        $hasFbName = true;
    }

    // Get course_id from course_code
    $stmt = $pdo->prepare('SELECT id FROM courses WHERE course_code = ?');
    $stmt->execute([$course_code]);
    $course = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid course selected']);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $existingStudent = findExistingStudentByEmail($pdo, $email);
    $isInactiveReturningStudent = $existingStudent && (
        strtolower((string)($existingStudent['status'] ?? '')) === 'inactive'
        || (int)($existingStudent['is_account_active'] ?? 1) === 0
    );

    if ($isInactiveReturningStudent) {
        $preRegNumber = queueInactiveStudentForPreRegistration($pdo, $existingStudent, [
            'first_name' => $firstname,
            'last_name' => $lastname,
            'middle_name' => $middlename,
            'email' => $email,
            'phone' => $phone,
            'guardian_contact' => $guardian_contact !== '' ? $guardian_contact : null,
            'fb_name' => $fb_name !== '' ? $fb_name : null,
            'address' => $address,
            'birth_date' => $birth_date ?: null,
            'gender' => $gender ?: null,
            'password_hash' => $passwordHash,
            'course_id' => (int)$course['id'],
        ]);

        echo json_encode([
            'ok' => true,
            'pre_reg_number' => $preRegNumber,
            'message' => 'Pre-registration successful! Your PRE number is: ' . $preRegNumber
        ]);
        exit;
    }

    // Insert into enrollees table with a PHP-generated PRE number.
    // This keeps registration working even if DB triggers/functions were not imported on another laptop.
    $generatedPreRegNumber = generatePreRegNumber($pdo);

    $insertColumns = [
        'pre_reg_number',
        'first_name', 'last_name', 'middle_name', 'email', 'phone',
        'address', 'birth_date', 'gender', 'password_hash', 'course_id', 'year_level', 'status'
    ];
    $insertValues = [
        ':pre_reg_number',
        ':first_name', ':last_name', ':middle_name', ':email', ':phone',
        ':address', ':birth_date', ':gender', ':password_hash', ':course_id', ':year_level', ':status'
    ];

    if ($hasGuardianContact) {
        $insertColumns[] = 'guardian_contact';
        $insertValues[] = ':guardian_contact';
    }

    if ($hasFbName) {
        $insertColumns[] = 'fb_name';
        $insertValues[] = ':fb_name';
    }

    $stmt = $pdo->prepare(
        'INSERT INTO enrollees (' . implode(', ', $insertColumns) . ') VALUES (' . implode(', ', $insertValues) . ')'
    );

    $stmt->execute([
        ':pre_reg_number' => $generatedPreRegNumber,
        ':first_name' => $firstname,
        ':last_name' => $lastname,
        ':middle_name' => $middlename,
        ':email' => $email,
        ':phone' => $phone,
        ':guardian_contact' => $guardian_contact !== '' ? $guardian_contact : null,
        ':fb_name' => $fb_name !== '' ? $fb_name : null,
        ':address' => $address,
        ':birth_date' => $birth_date ?: null,
        ':gender' => $gender ?: null,
        ':password_hash' => $passwordHash,
        ':course_id' => $course['id'],
        ':year_level' => $yearLevelValue,
        ':status' => 'pre-registered',
    ]);

    // Get the generated PRE number
    $enrollee_id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT pre_reg_number FROM enrollees WHERE id = ?');
    $stmt->execute([$enrollee_id]);
    $enrollee = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'pre_reg_number' => $enrollee['pre_reg_number'],
        'message' => 'Pre-registration successful! Your PRE number is: ' . $enrollee['pre_reg_number']
    ]);
} catch (Throwable $e) {
    $details = $e->getMessage();
    $statusCode = 500;
    $errorMessage = 'Pre-registration failed';

    if (stripos($details, 'Duplicate entry') !== false && stripos($details, 'email') !== false) {
        $statusCode = 400;
        $errorMessage = 'Email is already registered';
    } elseif (stripos($details, 'pre_reg_number') !== false) {
        $statusCode = 500;
        $errorMessage = 'Registration setup is incomplete on this laptop';
    }

    http_response_code($statusCode);
    echo json_encode([
        'ok' => false,
        'error' => $errorMessage,
        'details' => $details,
    ]);
}

function findExistingStudentByEmail(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare('SELECT id, student_id, pre_reg_number, email, course_id, year_level, current_semester, status, is_account_active FROM students WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function queueInactiveStudentForPreRegistration(PDO $pdo, array $student, array $payload): string
{
    $nextYearLevel = (int)($student['year_level'] ?? 1);
    $currentSemester = (int)($student['current_semester'] ?? 1);
    if ($currentSemester === 2) {
        $nextYearLevel++;
    }

    $existingEnrollee = $pdo->prepare('SELECT pre_reg_number FROM enrollees WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1');
    $existingEnrollee->execute([$student['email']]);
    $existingEnrolleeRow = $existingEnrollee->fetch(PDO::FETCH_ASSOC) ?: [];

    $preRegNumber = trim((string)($student['pre_reg_number'] ?? ''));
    if ($preRegNumber === '') {
        $preRegNumber = trim((string)($existingEnrolleeRow['pre_reg_number'] ?? ''));
    }
    if ($preRegNumber === '') {
        $preRegNumber = generatePreRegNumber($pdo);
    }

    $upsert = $pdo->prepare('
        INSERT INTO enrollees
            (pre_reg_number, existing_student_id, first_name, last_name, middle_name, email, phone,
             guardian_contact, fb_name, address, birth_date, gender, password_hash, course_id, year_level,
             status, enrollment_type, application_date, approved_date, approved_by)
        VALUES
            (:pre_reg_number, :existing_student_id, :first_name, :last_name, :middle_name, :email, :phone,
             :guardian_contact, :fb_name, :address, :birth_date, :gender, :password_hash, :course_id, :year_level,
             "pre-registered", "returning", NOW(), NULL, NULL)
        ON DUPLICATE KEY UPDATE
            existing_student_id = VALUES(existing_student_id),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            middle_name = VALUES(middle_name),
            phone = VALUES(phone),
            guardian_contact = VALUES(guardian_contact),
            fb_name = VALUES(fb_name),
            address = VALUES(address),
            birth_date = VALUES(birth_date),
            gender = VALUES(gender),
            password_hash = VALUES(password_hash),
            course_id = VALUES(course_id),
            year_level = VALUES(year_level),
            status = "pre-registered",
            enrollment_type = "returning",
            application_date = NOW(),
            approved_date = NULL,
            approved_by = NULL
    ');

    $upsert->execute([
        ':pre_reg_number' => $preRegNumber,
        ':existing_student_id' => $student['student_id'],
        ':first_name' => $payload['first_name'],
        ':last_name' => $payload['last_name'],
        ':middle_name' => $payload['middle_name'],
        ':email' => $student['email'],
        ':phone' => $payload['phone'],
        ':guardian_contact' => $payload['guardian_contact'],
        ':fb_name' => $payload['fb_name'],
        ':address' => $payload['address'],
        ':birth_date' => $payload['birth_date'],
        ':gender' => $payload['gender'],
        ':password_hash' => $payload['password_hash'],
        ':course_id' => (int)($student['course_id'] ?? $payload['course_id']),
        ':year_level' => $nextYearLevel,
    ]);

    if ((string)($student['pre_reg_number'] ?? '') !== $preRegNumber) {
        $linkStmt = $pdo->prepare('UPDATE students SET pre_reg_number = ? WHERE id = ?');
        $linkStmt->execute([$preRegNumber, (int)$student['id']]);
    }

    return $preRegNumber;
}

function generatePreRegNumber(PDO $pdo): string
{
    $year = (string)date('Y');
    $stmt = $pdo->prepare('SELECT pre_reg_number FROM enrollees WHERE pre_reg_number LIKE ? ORDER BY id DESC LIMIT 1');
    $stmt->execute(['PRE-' . $year . '%']);
    $lastNumber = (string)($stmt->fetchColumn() ?: '');

    $next = 1;
    if (preg_match('/^PRE-\d{4}(\d{4})$/', $lastNumber, $matches) === 1) {
        $next = ((int)$matches[1]) + 1;
    }

    return sprintf('PRE-%s%04d', $year, $next);
}

function getTableColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    $stmt->execute();
    return array_map(static function (array $column): string {
        return $column['Field'];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

