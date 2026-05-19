<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('curriculum', 'edit');

$pdo = require __DIR__ . '/../config/db.php';

function ensureProfessorColumnExists(PDO $pdo): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $stmt = $pdo->query("SHOW COLUMNS FROM curriculum LIKE 'professor_id'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE curriculum ADD COLUMN professor_id INT NULL AFTER prerequisites');
    }
}

function ensureOfferColumnExists(PDO $pdo): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $stmt = $pdo->query("SHOW COLUMNS FROM curriculum LIKE 'is_offered'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE curriculum ADD COLUMN is_offered TINYINT(1) NOT NULL DEFAULT 0 AFTER professor_id');
    }

    $pdo->exec('UPDATE curriculum SET is_offered = 1 WHERE professor_id IS NOT NULL');
}

function isProfessorUser(PDO $pdo, ?int $userId): bool {
    if ($userId === null || $userId <= 0) {
        return false;
    }

    $stmt = $pdo->prepare(
        "SELECT u.id
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?
           AND u.is_active = TRUE
           AND LOWER(COALESCE(r.name, u.role, '')) LIKE '%prof%'
         LIMIT 1"
    );
    $stmt->execute([$userId]);

    return (bool)$stmt->fetchColumn();
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

try {
    ensureProfessorColumnExists($pdo);
    ensureOfferColumnExists($pdo);

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing id']);
        exit;
    }

    $courseCode = strtoupper(trim((string)($data['course_code'] ?? '')));
    $subjectCode = strtoupper(trim((string)($data['subject_code'] ?? '')));
    $subjectName = trim((string)($data['subject_name'] ?? ''));
    $yearLevel = (int)($data['year_level'] ?? 0);
    $semester = (int)($data['semester'] ?? 0);
    $units = (int)($data['units'] ?? 0);
    $description = isset($data['description']) ? trim((string)$data['description']) : null;
    $prereq = isset($data['prerequisites']) ? trim((string)$data['prerequisites']) : null;
    $professorId = isset($data['professor_id']) && $data['professor_id'] !== null && $data['professor_id'] !== ''
        ? (int)$data['professor_id']
        : null;
    $isOffered = array_key_exists('is_offered', $data)
        ? (!empty($data['is_offered']) ? 1 : 0)
        : ($professorId !== null ? 1 : null);

    if ($professorId !== null && !isProfessorUser($pdo, $professorId)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Selected professor must be an active professor user']);
        exit;
    }

    if ($courseCode === '' || $subjectCode === '' || $subjectName === '' || $yearLevel <= 0 || $semester <= 0 || $units <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Please complete all required subject fields']);
        exit;
    }

    $resolveCourse = $pdo->prepare('SELECT id FROM courses WHERE course_code = ? AND is_active = TRUE LIMIT 1');
    $resolveCourse->execute([$courseCode]);
    $courseRow = $resolveCourse->fetch(PDO::FETCH_ASSOC);
    $courseId = (int)($courseRow['id'] ?? 0);

    if ($courseId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid course code']);
        exit;
    }

    $dupStmt = $pdo->prepare('
        SELECT id FROM curriculum
        WHERE course_id = ? AND subject_code = ? AND id <> ?
        LIMIT 1
    ');
    $dupStmt->execute([$courseId, $subjectCode, $id]);
    if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Another subject already uses that code for this course']);
        exit;
    }

    $stmt = $pdo->prepare('
        UPDATE curriculum
        SET course_id = ?, subject_code = ?, subject_name = ?, year_level = ?, semester = ?, units = ?, description = ?, prerequisites = ?, professor_id = ?, is_offered = COALESCE(?, is_offered)
        WHERE id = ?
    ');
    $stmt->execute([$courseId, $subjectCode, $subjectName, $yearLevel, $semester, $units, $description, $prereq, $professorId, $isOffered, $id]);

    echo json_encode(['ok' => true, 'message' => 'Curriculum updated']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to update curriculum', 'details' => $e->getMessage()]);
}

