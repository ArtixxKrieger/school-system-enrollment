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

function jsonInput(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
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

try {
    ensureProfessorColumnExists($pdo);
    ensureOfferColumnExists($pdo);

    $data = jsonInput();
    $items = $data['items'] ?? null;
    if (!is_array($items) || count($items) === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing items']);
        exit;
    }

    $pdo->beginTransaction();

    $resolveCourse = $pdo->prepare('SELECT id FROM courses WHERE course_code = ? AND is_active = TRUE LIMIT 1');
    $insert = $pdo->prepare('
        INSERT INTO curriculum
            (course_id, subject_code, subject_name, year_level, semester, units, description, prerequisites, professor_id, is_offered, is_active)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    ');
    $checkDup = $pdo->prepare('
        SELECT id
        FROM curriculum
        WHERE course_id = ?
          AND subject_code = ?
        LIMIT 1
    ');

    $created = 0;
    $skipped = 0;

    foreach ($items as $i => $item) {
        if (!is_array($item)) continue;
        $courseCode = strtoupper(trim((string)($item['course_code'] ?? '')));
        $subjectCode = strtoupper(trim((string)($item['subject_code'] ?? '')));
        $subjectName = trim((string)($item['subject_name'] ?? ''));
        $yearLevel = (int)($item['year_level'] ?? 0);
        $semester = (int)($item['semester'] ?? 0);
        $units = (int)($item['units'] ?? 0);
        $description = isset($item['description']) ? trim((string)$item['description']) : null;
        $prereq = isset($item['prerequisites']) ? trim((string)$item['prerequisites']) : null;
        $professorId = isset($item['professor_id']) && $item['professor_id'] !== null && $item['professor_id'] !== ''
            ? (int)$item['professor_id']
            : null;
        $isOffered = array_key_exists('is_offered', $item)
            ? (!empty($item['is_offered']) ? 1 : 0)
            : ($professorId !== null ? 1 : 0);

        if ($professorId !== null && !isProfessorUser($pdo, $professorId)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Selected professor must be an active professor user', 'details' => ['index' => $i]]);
            exit;
        }

        if ($courseCode === '' || $subjectCode === '' || $subjectName === '' || $yearLevel <= 0 || $semester <= 0 || $units <= 0) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid item', 'details' => ['index' => $i]]);
            exit;
        }

        $resolveCourse->execute([$courseCode]);
        $courseRow = $resolveCourse->fetch(PDO::FETCH_ASSOC);
        $courseId = (int)($courseRow['id'] ?? 0);
        if ($courseId <= 0) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid course_code', 'details' => ['index' => $i, 'course_code' => $courseCode]]);
            exit;
        }

        $checkDup->execute([$courseId, $subjectCode]);
        if ($checkDup->fetch(PDO::FETCH_ASSOC)) {
            $skipped++;
            continue;
        }

        $insert->execute([
            $courseId,
            $subjectCode,
            $subjectName,
            $yearLevel,
            $semester,
            $units,
            $description,
            $prereq,
            $professorId,
            $isOffered,
        ]);
        $created++;
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'created' => $created,
        'skipped' => $skipped,
        'message' => 'Curriculum saved',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save curriculum', 'details' => $e->getMessage()]);
}

