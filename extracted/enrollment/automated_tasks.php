<?php
declare(strict_types=1);

/**
 * Automated Enrollment System Tasks
 * Run daily via scheduler if needed.
 */

$pdo = require __DIR__ . '/config/db.php';

echo "Starting automated enrollment tasks at " . date('Y-m-d H:i:s') . "\n";

try {
    autoCloseAccounts($pdo);
    autoProgressStudents($pdo);
    cleanupOldLogs($pdo);
    echo "All automated tasks completed successfully\n";
} catch (Throwable $e) {
    echo "Error in automated tasks: " . $e->getMessage() . "\n";
    exit(1);
}

function autoCloseAccounts(PDO $pdo): void
{
    echo "Checking for pre-registered accounts to auto-disable...\n";

    $stmt = $pdo->prepare('
        UPDATE users u
        JOIN enrollees e ON e.email = u.email
        JOIN course_enrollment_schedule ces ON ces.course_id = e.course_id
        SET u.is_active = 0
        WHERE e.status = "pre-registered"
          AND CURDATE() > ces.enrollment_end_date
          AND u.is_active = 1
    ');
    $stmt->execute();

    echo "Auto-disabled {$stmt->rowCount()} account(s) after enrollment window end\n";
}

function autoProgressStudents(PDO $pdo): void
{
    echo "Checking for students to auto-progress...\n";

    $settingsStmt = $pdo->query('SELECT * FROM enrollment_settings WHERE id = 1');
    $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings || !$settings['auto_progression']) {
        echo "Auto-progression is disabled\n";
        return;
    }

    $currentSemester = inferCurrentSemester();
    $currentAcademicYear = inferAcademicYear();

    $stmt = $pdo->prepare("\n        SELECT s.id, s.student_id, s.first_name, s.last_name, s.year_level, s.course_id\n        FROM students s\n        WHERE s.current_academic_year = ?\n        AND s.current_semester = ?\n        AND s.is_account_active = TRUE\n        AND NOT EXISTS (\n            SELECT 1 FROM activity_logs al\n            WHERE al.entity_type = 'student'\n            AND al.entity_id = s.id\n            AND al.action = 'auto_progressed'\n            AND DATE(al.created_at) = CURDATE()\n        )\n    ");

    $stmt->execute([$currentAcademicYear, $currentSemester]);
    $studentsToProgress = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($studentsToProgress)) {
        echo "No students to progress\n";
        return;
    }

    $pdo->beginTransaction();

    try {
        foreach ($studentsToProgress as $student) {
            $newYearLevel = (int)$student['year_level'];

            $completedSemestersStmt = $pdo->prepare("\n                SELECT COUNT(*) as count FROM students\n                WHERE student_id LIKE ?\n                AND current_academic_year = ?\n                AND year_level = ?\n            ");
            $completedSemestersStmt->execute([
                substr((string)$student['student_id'], 0, -2) . '%',
                $currentAcademicYear,
                (int)$student['year_level']
            ]);

            $completedCount = (int)$completedSemestersStmt->fetch()['count'];

            if ($completedCount >= 2) {
                $candidateLevel = (int)$student['year_level'] + 1;

                $curriculumCheckStmt = $pdo->prepare("\n                    SELECT COUNT(*) as count FROM curriculum\n                    WHERE course_id = ?\n                    AND year_level = ?\n                ");
                $curriculumCheckStmt->execute([(int)$student['course_id'], $candidateLevel]);

                if ((int)$curriculumCheckStmt->fetch()['count'] > 0) {
                    $newYearLevel = $candidateLevel;
                }
            }

            if ($newYearLevel !== (int)$student['year_level']) {
                $updateStmt = $pdo->prepare('UPDATE students SET year_level = ? WHERE id = ?');
                $updateStmt->execute([$newYearLevel, (int)$student['id']]);

                $logStmt = $pdo->prepare('INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (1, "auto_progressed", ?, "student", ?)');
                $logStmt->execute([
                    "Auto-progressed student {$student['student_id']} from year {$student['year_level']} to year {$newYearLevel}",
                    (int)$student['id']
                ]);

                echo "Progressed student {$student['student_id']} to year level {$newYearLevel}\n";
            } else {
                $logStmt = $pdo->prepare('INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (1, "auto_progressed", ?, "student", ?)');
                $logStmt->execute([
                    "Checked student {$student['student_id']} for progression (no change needed)",
                    (int)$student['id']
                ]);
            }
        }

        $pdo->commit();
        echo "Processed " . count($studentsToProgress) . " students for progression\n";
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function cleanupOldLogs(PDO $pdo): void
{
    echo "Cleaning up old activity logs...\n";
    $sixMonthsAgo = date('Y-m-d H:i:s', strtotime('-6 months'));
    $stmt = $pdo->prepare('DELETE FROM activity_logs WHERE created_at < ?');
    $stmt->execute([$sixMonthsAgo]);
    echo "Cleaned up {$stmt->rowCount()} old activity log entries\n";
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
