<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

$pdo = require __DIR__ . '/../config/db.php';
$user = current_user();
$currentUserId = (int)($user['id'] ?? 0);
$requestedUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $currentUserId;
$role = strtolower((string)($user['role'] ?? ''));

function ensureUserProfileColumns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $columns = [
        'phone' => 'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER email',
        'address' => 'ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone',
        'birth_date' => 'ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER address',
        'gender' => 'ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL AFTER birth_date',
        'profile_photo' => 'ALTER TABLE users ADD COLUMN profile_photo MEDIUMTEXT NULL AFTER gender'
    ];

    foreach ($columns as $column => $sql) {
        $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE " . $pdo->quote($column));
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->exec($sql);
        }
    }
}

if ($requestedUserId !== $currentUserId) {
    require_permission('rolemanagement', 'view');
}

try {
    ensureUserProfileColumns($pdo);

    $userStmt = $pdo->prepare('
        SELECT id, username, email, full_name, role, role_id, is_active, last_login, created_at, updated_at, phone, address, birth_date, gender, profile_photo
        FROM users
        WHERE id = ?
        LIMIT 1
    ');
    $userStmt->execute([$requestedUserId]);
    $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userRow) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'User not found']);
        exit;
    }

    $profile = [
        'id' => (int)$userRow['id'],
        'user_id' => (string)$userRow['username'],
        'email' => (string)($userRow['email'] ?? ''),
        'full_name' => (string)($userRow['full_name'] ?? ''),
        'role' => (string)($userRow['role'] ?? $role),
        'role_id' => isset($userRow['role_id']) ? (int)$userRow['role_id'] : null,
        'is_active' => (int)($userRow['is_active'] ?? 0) === 1,
        'last_login' => $userRow['last_login'] ?? null,
        'created_at' => $userRow['created_at'] ?? null,
        'updated_at' => $userRow['updated_at'] ?? null,
        'first_name' => null,
        'middle_name' => null,
        'last_name' => null,
        'birth_date' => $userRow['birth_date'] ?? null,
        'gender' => $userRow['gender'] ?? null,
        'phone' => $userRow['phone'] ?? null,
        'address' => $userRow['address'] ?? null,
        'profile_photo' => $userRow['profile_photo'] ?? null,
        'student_id' => null,
        'course_code' => null,
        'course_name' => null,
        'guardian_contact' => null,
        'fb_name' => null,
        'flag_group' => null,
        'assigned_curriculum' => [],
    ];

    $selectedRole = strtolower((string)($userRow['role'] ?? $role));

    if (normalize_role_name($selectedRole) === 'student') {
        $studentStmt = $pdo->prepare('
                        SELECT s.id AS student_pk, s.student_id, s.first_name, s.middle_name, s.last_name,
                   s.birth_date, s.gender, s.phone, s.address,
                     s.guardian_contact, s.fb_name, s.flag_group,
                   c.course_code, c.course_name
            FROM students s
            LEFT JOIN courses c ON s.course_id = c.id
            WHERE s.email = ?
            ORDER BY s.id DESC
            LIMIT 1
        ');
        $studentStmt->execute([(string)$userRow['email']]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

        if ($student) {
            $profile['student_id'] = $student['student_id'] ?? null;
            $profile['first_name'] = $student['first_name'] ?? null;
            $profile['middle_name'] = $student['middle_name'] ?? null;
            $profile['last_name'] = $student['last_name'] ?? null;
            $profile['birth_date'] = $student['birth_date'] ?? null;
            $profile['gender'] = $student['gender'] ?? null;
            $profile['phone'] = $student['phone'] ?? null;
            $profile['address'] = $student['address'] ?? null;
            $profile['guardian_contact'] = $student['guardian_contact'] ?? null;
            $profile['fb_name'] = $student['fb_name'] ?? null;
            $profile['flag_group'] = $student['flag_group'] ?? null;
            $profile['course_code'] = $student['course_code'] ?? null;
            $profile['course_name'] = $student['course_name'] ?? null;

            $assignedStmt = $pdo->prepare(
                'SELECT sca.id, sca.is_completed, sca.assigned_at, sca.completed_at,
                        c.subject_code, c.subject_name, c.units, c.year_level, c.semester
                 FROM student_curriculum_assignments sca
                 JOIN curriculum c ON c.id = sca.curriculum_id
                 WHERE sca.student_id = ?
                 ORDER BY sca.is_completed ASC, c.year_level ASC, c.semester ASC, c.subject_code ASC'
            );
            $studentIdNumeric = (int)($student['student_pk'] ?? 0);
            if ($studentIdNumeric > 0) {
                $assignedStmt->execute([$studentIdNumeric]);
                $profile['assigned_curriculum'] = $assignedStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            $computedName = trim(implode(' ', array_filter([
                (string)($student['first_name'] ?? ''),
                (string)($student['middle_name'] ?? ''),
                (string)($student['last_name'] ?? ''),
            ])));
            if ($computedName !== '') {
                $profile['full_name'] = $computedName;
            }
        }
    }

    echo json_encode(['ok' => true, 'profile' => $profile]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to load profile data',
        'details' => $e->getMessage(),
    ]);
}
