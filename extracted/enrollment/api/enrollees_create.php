<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('enrollees', 'create');

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

// Expected keys (from enrollees.js modal)
$enrolleeId = isset($payload['id']) ? trim((string)$payload['id']) : '';
$courseCode = isset($payload['course']) ? trim((string)$payload['course']) : '';
$yearLevel = isset($payload['yearLevel']) ? (int)$payload['yearLevel'] : 0;
$semester = isset($payload['semester']) ? (int)$payload['semester'] : 1;

$firstName = isset($payload['firstName']) ? trim((string)$payload['firstName']) : '';
$middleName = isset($payload['middleName']) ? trim((string)$payload['middleName']) : '';
$lastName = isset($payload['lastName']) ? trim((string)$payload['lastName']) : '';

$email = isset($payload['email']) ? trim((string)$payload['email']) : '';
$phone = isset($payload['phone']) ? trim((string)$payload['phone']) : null;
$address = isset($payload['address']) ? trim((string)$payload['address']) : null;
$guardian = isset($payload['guardian']) ? trim((string)$payload['guardian']) : null;

$birthDate = isset($payload['birthDate']) ? trim((string)$payload['birthDate']) : null; // expected YYYY-MM-DD
$enrollmentDate = isset($payload['enrollmentDate']) ? trim((string)$payload['enrollmentDate']) : null; // expected YYYY-MM-DD

if (
    $enrolleeId === '' || $courseCode === '' || $yearLevel < 1 || $email === '' ||
    $firstName === '' || $lastName === '' || $birthDate === null || $guardian === null
) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

// Normalize optional fields
$phone = ($phone === '') ? null : $phone;
$address = ($address === '') ? null : $address;
$guardian = ($guardian === '') ? null : $guardian;
$middleName = ($middleName === '') ? null : $middleName;
$enrollmentDate = ($enrollmentDate === '' || $enrollmentDate === null) ? null : $enrollmentDate;

$pdo = require __DIR__ . '/../config/db.php';

try {
    $pdo->beginTransaction();

    // Dummy password hash required because users.password is NOT NULL.
    $dummyHash = password_hash(bin2hex(random_bytes(6)), PASSWORD_DEFAULT);
    $fullName = trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName);

    // Upsert user record so UI can display names (via join).
    $stmtUser = $pdo->prepare('
        INSERT INTO users
            (username, email, password, is_active, full_name, role)
        VALUES
            (:username, :email, :password, 1, :full_name, :role)
        ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            password = VALUES(password),
            full_name = VALUES(full_name),
            role = VALUES(role),
            is_active = 1
    ');

    $stmtUser->execute([
        ':username' => $email,
        ':email' => $email,
        ':password' => $dummyHash,
        ':full_name' => $fullName,
        ':role' => 'student',
    ]);

    $stmtEnrollee = $pdo->prepare('
        INSERT INTO enrollees
            (id, course_code, year_level, semester, status, enrollment_date, email, phone, address, birth_date, guardian)
        VALUES
            (:id, :course_code, :year_level, :semester, "pending", :enrollment_date, :email, :phone, :address, :birth_date, :guardian)
        ON DUPLICATE KEY UPDATE
            course_code = VALUES(course_code),
            year_level = VALUES(year_level),
            semester = VALUES(semester),
            status = VALUES(status),
            enrollment_date = VALUES(enrollment_date),
            email = VALUES(email),
            phone = VALUES(phone),
            address = VALUES(address),
            birth_date = VALUES(birth_date),
            guardian = VALUES(guardian)
    ');

    $stmtEnrollee->execute([
        ':id' => $enrolleeId,
        ':course_code' => $courseCode,
        ':year_level' => $yearLevel,
        ':semester' => $semester,
        ':enrollment_date' => $enrollmentDate,
        ':email' => $email,
        ':phone' => $phone,
        ':address' => $address,
        ':birth_date' => $birthDate,
        ':guardian' => $guardian,
    ]);

    $pdo->commit();

    // Return created enrollee (name from users)
    $stmtReturn = $pdo->prepare('
        SELECT
            e.id,
            e.course_code,
            e.year_level,
            e.semester,
            e.status,
            e.enrollment_date,
            e.email,
            e.phone,
            e.address,
            e.birth_date,
            e.guardian,
            CONCAT_WS(" ", u.first_name, u.middle_name, u.last_name) AS name
        FROM enrollees e
        LEFT JOIN users u ON u.email = e.email
        WHERE e.id = :id
        LIMIT 1
    ');
    $stmtReturn->execute([':id' => $enrolleeId]);
    $row = $stmtReturn->fetch();

    echo json_encode([
        'ok' => true,
        'enrollee' => [
            'id' => (string)($row['id'] ?? $enrolleeId),
            'name' => (string)($row['name'] ?? ''),
            'course' => (string)($row['course_code'] ?? $courseCode),
            'yearLevel' => (string)($row['year_level'] ?? $yearLevel),
            'semester' => (int)($row['semester'] ?? $semester),
            'status' => (string)($row['status'] ?? 'pending'),
            'enrollmentDate' => $row['enrollment_date'] ? (string)$row['enrollment_date'] : ($enrollmentDate ?? ''),
            'email' => (string)($row['email'] ?? $email),
            'phone' => (string)($row['phone'] ?? ''),
            'address' => (string)($row['address'] ?? ''),
            'birthDate' => $row['birth_date'] ? (string)$row['birth_date'] : ($birthDate ?? ''),
            'guardian' => (string)($row['guardian'] ?? ''),
        ]
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to create enrollee', 'details' => $e->getMessage()]);
}

