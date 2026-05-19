<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

$pdo = require __DIR__ . '/../config/db.php';
$user = current_user();
$userId = (int)($user['id'] ?? 0);
$userEmail = (string)($user['email'] ?? '');
$role = strtolower((string)($user['role'] ?? ''));

// Only refresh for students
if (normalize_role_name($role) !== 'student') {
    echo json_encode([
        'ok' => true,
        'refreshed' => false,
        'message' => 'Session refresh only applicable for students',
        'user' => $_SESSION['user'] ?? null
    ]);
    exit;
}

try {
    // Query current student data from database
    $stmt = $pdo->prepare(
        'SELECT s.year_level, s.current_semester, s.progression_status, s.profile_photo, 
                s.status, s.is_account_active, c.course_code
         FROM students s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.email = ?
         LIMIT 1'
    );
    $stmt->execute([$userEmail]);
    $studentInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$studentInfo) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'error' => 'Student record not found'
        ]);
        exit;
    }

    // Update session with fresh data
    $_SESSION['user']['year_level'] = (int)$studentInfo['year_level'];
    $_SESSION['user']['current_semester'] = (int)$studentInfo['current_semester'];
    $_SESSION['user']['progression_status'] = $studentInfo['progression_status'] ?? 'enrolled';
    $_SESSION['user']['course_code'] = $studentInfo['course_code'] ?? '';
    $_SESSION['user']['profile_photo'] = $studentInfo['profile_photo'] ?? null;
    $_SESSION['user']['status'] = $studentInfo['status'] ?? '';
    $_SESSION['user']['is_account_active'] = (int)($studentInfo['is_account_active'] ?? 0) === 1;

    echo json_encode([
        'ok' => true,
        'refreshed' => true,
        'user' => $_SESSION['user']
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to refresh session',
        'details' => $e->getMessage()
    ]);
}
