<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');
require_login();

if (!has_permission('curriculum', 'view') && !has_permission('subjects', 'view')) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden']);
    exit;
}

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
}

function ensureStudentEnrolledSubjectsTable(PDO $pdo): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS student_enrolled_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            curriculum_id INT NOT NULL,
            offering_id INT NULL,
            status VARCHAR(20) NOT NULL DEFAULT "enrolled",
            enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at DATETIME NULL DEFAULT NULL,
            approved_by INT NULL,
            UNIQUE KEY uniq_student_enrolled_subject (student_id, curriculum_id),
            KEY idx_student_enrolled_student (student_id),
            KEY idx_student_enrolled_curriculum (curriculum_id),
            KEY idx_student_enrolled_offering (offering_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $stmt = $pdo->query("SHOW COLUMNS FROM student_enrolled_subjects LIKE 'offering_id'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE student_enrolled_subjects ADD COLUMN offering_id INT NULL AFTER curriculum_id');
    }
}

function ensureSubjectOfferingsTable(PDO $pdo): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS subject_offerings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            curriculum_id INT NOT NULL,
            course_id INT NOT NULL,
            year_level TINYINT NOT NULL,
            semester TINYINT NOT NULL,
            offered_by INT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            offered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_subject_offering (curriculum_id, course_id, year_level, semester),
            KEY idx_subject_offerings_course_setup (course_id, year_level, semester),
            KEY idx_subject_offerings_curriculum (curriculum_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

try {
    ensureProfessorColumnExists($pdo);
    ensureOfferColumnExists($pdo);
    ensureStudentEnrolledSubjectsTable($pdo);
    ensureSubjectOfferingsTable($pdo);

    $courseCode = trim((string)($_GET['course'] ?? ''));
    $yearLevel = isset($_GET['year_level']) ? (int)$_GET['year_level'] : 0;
    $semester = isset($_GET['semester']) ? (int)$_GET['semester'] : 0;
    $offeredOnly = !empty($_GET['offered_only']);
    $enrolledOnly = !empty($_GET['enrolled_only']);

    $currentRole = current_user_role();
    $studentRecord = null;

    if ($currentRole === 'student') {
        $sessionEmail = trim((string)($_SESSION['user']['email'] ?? ''));
        if ($sessionEmail !== '') {
            $studentStmt = $pdo->prepare(
                'SELECT s.id AS student_pk, s.course_id, s.year_level, s.current_semester, 
                        s.progression_status, c.course_code
                 FROM students s
                 JOIN courses c ON s.course_id = c.id
                 WHERE s.email = ?
                 ORDER BY s.id DESC
                 LIMIT 1'
            );
            $studentStmt->execute([$sessionEmail]);
            $studentRecord = $studentStmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$studentRecord) {
            echo json_encode(['ok' => true, 'curriculum' => [], 'professors' => []]);
            exit;
        }

        $courseCode = (string)($studentRecord['course_code'] ?? '');
        if (!$enrolledOnly) {
            $offeredOnly = true;
        }
    }

    if ($offeredOnly || $enrolledOnly) {
        $where = 'WHERE so.is_active = TRUE AND cu.is_active = TRUE';
        $params = [];
        $studentEnrollmentJoin = '';
        $studentEnrollmentSelect = '0 AS is_enrolled';

        if ($currentRole === 'student' && $studentRecord) {
            $studentId = (int)$studentRecord['student_pk'];
            $studentEnrollmentJoin = 'LEFT JOIN student_enrolled_subjects ses ON ses.student_id = ' . $studentId . ' AND ses.status = "enrolled" AND (ses.offering_id = so.id OR (ses.offering_id IS NULL AND ses.curriculum_id = cu.id))';
            $studentEnrollmentSelect = 'CASE WHEN ses.id IS NULL THEN 0 ELSE 1 END AS is_enrolled';
        }

        if ($courseCode !== '' && strtolower($courseCode) !== 'all') {
            $where .= ' AND tc.course_code = ?';
            $params[] = $courseCode;
        }

        if ($yearLevel > 0) {
            $where .= ' AND so.year_level = ?';
            $params[] = $yearLevel;
        }

        if ($semester > 0) {
            $where .= ' AND so.semester = ?';
            $params[] = $semester;
        }

        if ($currentRole === 'student' && $enrolledOnly) {
            $where .= ' AND ses.id IS NOT NULL';
        }

        // Add progression constraint for students: show based on enrollment period
        if ($currentRole === 'student' && $studentRecord) {
            $sYearLevel = (int)($studentRecord['year_level'] ?? 1);
            $sSemester = (int)($studentRecord['current_semester'] ?? 1);
            $progressionStatus = (string)($studentRecord['progression_status'] ?? 'enrolled');
            
            // Check if semester has ended and enrollment period is active
            $canSeeNextSemester = ($progressionStatus === 'pending_progression');
            
            if ($canSeeNextSemester) {
                // ENROLLMENT PERIOD: Show current + next enrollment term
                $nextYearLevel = $sSemester === 2 ? min($sYearLevel + 1, 4) : $sYearLevel;
                $nextSemester = $sSemester === 1 ? 2 : 1;
                
                error_log("Student enrollment period - Current: Y{$sYearLevel}S{$sSemester}, Can see next: Y{$nextYearLevel}S{$nextSemester}");
                
                // Allow: past years + current year up to current semester + next enrollment term
                $where .= ' AND (
                    so.year_level < ? 
                    OR (so.year_level = ? AND so.semester <= ?)
                    OR (so.year_level = ? AND so.semester = ?)
                )';
                $params[] = $sYearLevel;           // past years
                $params[] = $sYearLevel;           // current year
                $params[] = $sSemester;            // up to current semester
                $params[] = $nextYearLevel;        // next enrollment year
                $params[] = $nextSemester;         // next enrollment semester
            } else {
                // DURING SEMESTER: Show ONLY current + past (no next semester)
                error_log("Student during semester - Current: Y{$sYearLevel}S{$sSemester}, Next semester hidden until enrollment period");
                
                // Allow: past years + current year up to current semester ONLY
                $where .= ' AND (
                    so.year_level < ? 
                    OR (so.year_level = ? AND so.semester <= ?)
                )';
                $params[] = $sYearLevel;           // past years
                $params[] = $sYearLevel;           // current year
                $params[] = $sSemester;            // up to current semester ONLY
            }
        }

        $stmt = $pdo->prepare(
            "SELECT
                cu.id,
                so.id AS offering_id,
                cu.subject_code,
                cu.subject_name,
                so.year_level,
                so.semester,
                cu.units,
                cu.description,
                cu.prerequisites,
                cu.professor_id,
                1 AS is_offered,
                'Offered' AS offer_status,
                $studentEnrollmentSelect,
                tc.course_code,
                tc.course_name,
                COALESCE(u.full_name, '') AS professor_name
             FROM subject_offerings so
             JOIN curriculum cu ON cu.id = so.curriculum_id
             JOIN courses tc ON so.course_id = tc.id
             LEFT JOIN users u ON cu.professor_id = u.id
             $studentEnrollmentJoin
             $where
             ORDER BY tc.course_code, so.year_level, so.semester, cu.subject_code"
        );
        $stmt->execute($params);
        $curriculum = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $where = 'WHERE cu.is_active = TRUE';
        $params = [];

        if ($currentRole === 'professor') {
            $currentUserId = (int)($_SESSION['user']['id'] ?? 0);
            if ($currentUserId <= 0) {
                echo json_encode(['ok' => true, 'curriculum' => [], 'professors' => []]);
                exit;
            }
            $where .= ' AND cu.professor_id = ?';
            $params[] = $currentUserId;
        }

        if ($courseCode !== '' && strtolower($courseCode) !== 'all') {
            $where .= ' AND c.course_code = ?';
            $params[] = $courseCode;
        }

        if ($yearLevel > 0) {
            $where .= ' AND cu.year_level = ?';
            $params[] = $yearLevel;
        }

        if ($semester > 0) {
            $where .= ' AND cu.semester = ?';
            $params[] = $semester;
        }

        $stmt = $pdo->prepare(
            "SELECT
                cu.id,
                cu.subject_code,
                cu.subject_name,
                cu.year_level,
                cu.semester,
                cu.units,
                cu.description,
                cu.prerequisites,
                cu.professor_id,
                COALESCE(cu.is_offered, 0) AS is_offered,
                CASE WHEN COALESCE(cu.is_offered, 0) = 1 THEN 'Offered' ELSE 'Not offered' END AS offer_status,
                0 AS is_enrolled,
                c.course_code,
                c.course_name,
                COALESCE(u.full_name, '') AS professor_name
             FROM curriculum cu
             JOIN courses c ON cu.course_id = c.id
             LEFT JOIN users u ON cu.professor_id = u.id
             $where
             ORDER BY c.course_code, cu.year_level, cu.semester, cu.subject_code"
        );
        $stmt->execute($params);
        $curriculum = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $professorStmt = $pdo->query(
        "SELECT u.id, u.full_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.is_active = TRUE
           AND LOWER(COALESCE(r.name, u.role, '')) LIKE '%prof%'
         ORDER BY u.full_name ASC"
    );
    $professorRows = $professorStmt->fetchAll(PDO::FETCH_ASSOC);

    $professors = array_map(static function (array $row): array {
        return [
            'id' => (int)$row['id'],
            'name' => trim((string)$row['full_name']),
        ];
    }, $professorRows);

    echo json_encode([
        'ok' => true,
        'curriculum' => $curriculum,
        'professors' => $professors,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch curriculum',
        'details' => $e->getMessage()
    ]);
}
