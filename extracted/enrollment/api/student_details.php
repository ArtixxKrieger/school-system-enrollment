<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'view');

$pdo = require __DIR__ . '/../config/db.php';

try {
    $studentId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($studentId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Student ID required']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT s.*, c.course_code, c.course_name
         FROM students s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.id = ?'
    );
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Student not found']);
        exit;
    }

    ensureStudentEnrolledSubjectsTable($pdo);

    $curriculum = [];
    $curriculumStmt = $pdo->prepare(
        'SELECT c.subject_code, c.subject_name, c.units, c.description, c.prerequisites
         FROM student_enrolled_subjects ses
         JOIN curriculum c ON c.id = ses.curriculum_id
         WHERE ses.student_id = ?
           AND ses.status = "enrolled"
         ORDER BY c.year_level, c.semester, c.subject_code'
    );
    $curriculumStmt->execute([$studentId]);
    $curriculum = $curriculumStmt->fetchAll(PDO::FETCH_ASSOC);


    $assignedCurriculumStmt = $pdo->prepare(
        'SELECT sca.id, sca.curriculum_id, sca.source_year_level, sca.source_semester, sca.is_completed,
                sca.assigned_at, sca.completed_at,
                c.subject_code, c.subject_name, c.units, c.semester, c.year_level, c.prerequisites
         FROM student_curriculum_assignments sca
         JOIN curriculum c ON c.id = sca.curriculum_id
         WHERE sca.student_id = ?
         ORDER BY sca.is_completed ASC, c.year_level ASC, c.semester ASC, c.subject_code ASC'
    );
    $assignedCurriculumStmt->execute([$studentId]);
    $assignedCurriculum = $assignedCurriculumStmt->fetchAll(PDO::FETCH_ASSOC);

    $studentType = strtolower((string)($student['student_type'] ?? 'regular'));
    if ($studentType !== 'irregular') {
        foreach ($assignedCurriculum as $assigned) {
            if (empty($assigned['is_completed'])) {
                $studentType = 'irregular';
                break;
            }
        }
    }
    $student['student_type'] = $studentType;

    echo json_encode([
        'ok' => true,
        'student' => array_merge($student, [
            'curriculum' => $curriculum,
            'assigned_curriculum' => $assignedCurriculum,
        ])
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to load student details',
        'details' => $e->getMessage()
    ]);
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
