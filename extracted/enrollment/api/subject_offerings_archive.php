<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

$pdo = require __DIR__ . '/../config/db.php';

/* ------------------------------------------------------------------
   Ensure subject_offerings exists and has the extra archive columns
------------------------------------------------------------------ */
function ensureOfferingsArchiveCols(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $done = true;

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS subject_offerings (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            curriculum_id INT NOT NULL,
            course_id     INT NOT NULL,
            year_level    TINYINT NOT NULL,
            semester      TINYINT NOT NULL,
            offered_by    INT NULL,
            is_active     TINYINT(1) NOT NULL DEFAULT 1,
            offered_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_subject_offering (curriculum_id, course_id, year_level, semester),
            KEY idx_soff_course (course_id, year_level, semester),
            KEY idx_soff_curriculum (curriculum_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $cols = array_column(
        $pdo->query('SHOW COLUMNS FROM subject_offerings')->fetchAll(PDO::FETCH_ASSOC),
        'Field'
    );

    if (!in_array('academic_year', $cols, true)) {
        $pdo->exec("ALTER TABLE subject_offerings ADD COLUMN academic_year VARCHAR(9) NULL AFTER semester");
    }
    if (!in_array('archived_at', $cols, true)) {
        $pdo->exec("ALTER TABLE subject_offerings ADD COLUMN archived_at DATETIME NULL AFTER is_active");
    }
}

ensureOfferingsArchiveCols($pdo);

$method = $_SERVER['REQUEST_METHOD'];

/* ------------------------------------------------------------------
   GET — return current active offerings + archived groups
------------------------------------------------------------------ */
if ($method === 'GET') {
    $activeCount = (int) $pdo->query(
        'SELECT COUNT(*) FROM subject_offerings WHERE is_active = 1'
    )->fetchColumn();

    // Active offerings summarised by academic_year
    $activeGroups = $pdo->query(
        'SELECT
            COALESCE(so.academic_year, CONCAT(YEAR(so.offered_at), "-", YEAR(so.offered_at)+1)) AS academic_year,
            COUNT(so.id)                                                                         AS subject_count,
            MAX(so.offered_at)                                                                   AS last_offered,
            GROUP_CONCAT(DISTINCT c.course_code ORDER BY c.course_code SEPARATOR ", ")          AS courses
         FROM subject_offerings so
         LEFT JOIN courses c ON c.id = so.course_id
         WHERE so.is_active = 1
         GROUP BY academic_year
         ORDER BY academic_year DESC'
    )->fetchAll(PDO::FETCH_ASSOC);

    // Archived offerings summarised by academic_year
    $archivedGroups = $pdo->query(
        'SELECT
            COALESCE(so.academic_year, CONCAT(YEAR(so.offered_at), "-", YEAR(so.offered_at)+1)) AS academic_year,
            COUNT(so.id)                                                                         AS subject_count,
            MAX(so.offered_at)                                                                   AS last_offered,
            MAX(so.archived_at)                                                                  AS archived_at,
            GROUP_CONCAT(DISTINCT c.course_code ORDER BY c.course_code SEPARATOR ", ")          AS courses
         FROM subject_offerings so
         LEFT JOIN courses c ON c.id = so.course_id
         WHERE so.is_active = 0
         GROUP BY academic_year
         ORDER BY academic_year DESC'
    )->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok'             => true,
        'active_count'   => $activeCount,
        'active'         => $activeGroups,
        'archived'       => $archivedGroups,
    ]);
    exit;
}

/* ------------------------------------------------------------------
   POST — archive or restore
------------------------------------------------------------------ */
if ($method === 'POST') {
    if (!has_permission('subjects', 'edit') && !has_permission('settings', 'edit')) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Forbidden']);
        exit;
    }

    $raw  = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON payload']);
        exit;
    }

    $action       = (string) ($data['action']        ?? '');
    $academicYear = trim((string) ($data['academic_year'] ?? ''));

    /* ---- archive_year -------------------------------------------- */
    if ($action === 'archive_year') {
        if (!preg_match('/^\d{4}-\d{4}$/', $academicYear)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid academic year. Use YYYY-YYYY format (e.g. 2024-2025).']);
            exit;
        }

        // Archive by academic_year column OR by year derived from offered_at
        $stmt = $pdo->prepare(
            'UPDATE subject_offerings
             SET is_active   = 0,
                 archived_at = NOW()
             WHERE is_active = 1
               AND (
                   academic_year = ?
                   OR (academic_year IS NULL AND CONCAT(YEAR(offered_at), "-", YEAR(offered_at)+1) = ?)
               )'
        );
        $stmt->execute([$academicYear, $academicYear]);
        $affected = $stmt->rowCount();

        echo json_encode([
            'ok'       => true,
            'archived' => $affected,
            'message'  => "Archived {$affected} offered subject(s) for {$academicYear}.",
        ]);
        exit;
    }

    /* ---- archive_all --------------------------------------------- */
    if ($action === 'archive_all') {
        $stmt = $pdo->prepare(
            'UPDATE subject_offerings SET is_active = 0, archived_at = NOW() WHERE is_active = 1'
        );
        $stmt->execute();
        $affected = $stmt->rowCount();

        echo json_encode([
            'ok'       => true,
            'archived' => $affected,
            'message'  => "All {$affected} active offered subject(s) have been archived.",
        ]);
        exit;
    }

    /* ---- restore_year -------------------------------------------- */
    if ($action === 'restore_year') {
        if (!preg_match('/^\d{4}-\d{4}$/', $academicYear)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid academic year format.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'UPDATE subject_offerings
             SET is_active   = 1,
                 archived_at = NULL
             WHERE is_active = 0
               AND (
                   academic_year = ?
                   OR (academic_year IS NULL AND CONCAT(YEAR(offered_at), "-", YEAR(offered_at)+1) = ?)
               )'
        );
        $stmt->execute([$academicYear, $academicYear]);
        $affected = $stmt->rowCount();

        echo json_encode([
            'ok'       => true,
            'restored' => $affected,
            'message'  => "Restored {$affected} offered subject(s) for {$academicYear}.",
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
