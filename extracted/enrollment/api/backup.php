<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
$pdo = require __DIR__ . '/../config/db.php';

$action = isset($_GET['action']) ? strtolower((string)$_GET['action']) : 'export';

if ($action === 'export') {
    require_permission('settings', 'view');
    exportBackup($pdo);
    exit;
}

if ($action === 'import' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_permission('settings', 'edit');
    importBackup($pdo);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Invalid backup action']);
exit;

function exportBackup(PDO $pdo): void
{
    if (!class_exists('ZipArchive')) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'ZipArchive is not available on this server']);
        return;
    }

    $tables = [
        'permission_modules',
        'roles',
        'users',
        'role_permissions',
        'courses',
        'enrollment_settings',
        'enrollees',
        'students',
        'curriculum',
        'course_enrollment_schedule',
        'activity_logs',
    ];

    $tempFile = tempnam(sys_get_temp_dir(), 'backup_');
    $zip = new ZipArchive();

    if ($zip->open($tempFile, ZipArchive::CREATE) !== true) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Unable to create backup package']);
        return;
    }

    foreach ($tables as $table) {
        $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
        $columns = [];

        if (!empty($rows)) {
            $columns = array_keys($rows[0]);
        } else {
            $columns = getTableColumns($pdo, $table);
        }

        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            continue;
        }

        fputcsv($stream, $columns);
        foreach ($rows as $row) {
            $line = [];
            foreach ($columns as $column) {
                $line[] = $row[$column] ?? null;
            }
            fputcsv($stream, $line);
        }

        rewind($stream);
        $content = stream_get_contents($stream);
        fclose($stream);

        if ($content !== false) {
            $zip->addFromString("{$table}.csv", $content);
        }
    }

    $zip->close();

    if (!file_exists($tempFile)) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Backup file could not be generated']);
        return;
    }

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="enrollment_backup_' . date('Y_m_d_His') . '.zip"');
    header('Content-Length: ' . filesize($tempFile));
    readfile($tempFile);
    unlink($tempFile);
}

function importBackup(PDO $pdo): void
{
    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_FILES['backupFile']) || $_FILES['backupFile']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'A valid backup ZIP file is required']);
        return;
    }

    $upload = $_FILES['backupFile'];
    $extension = strtolower(pathinfo((string)$upload['name'], PATHINFO_EXTENSION));

    if ($extension !== 'zip') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Only .zip backup files are accepted']);
        return;
    }

    $zip = new ZipArchive();
    if ($zip->open($upload['tmp_name']) !== true) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Unable to open backup ZIP file']);
        return;
    }

    $tableOrder = [
        'permission_modules',
        'roles',
        'users',
        'role_permissions',
        'courses',
        'enrollment_settings',
        'enrollees',
        'students',
        'curriculum',
        'course_enrollment_schedule',
        'activity_logs',
    ];

    try {
        $pdo->beginTransaction();
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

        foreach ($tableOrder as $table) {
            $entryName = "{$table}.csv";
            if ($zip->locateName($entryName) === false) {
                continue;
            }

            $content = $zip->getFromName($entryName);
            if ($content === false) {
                continue;
            }

            $rows = readCsvRows($content);
            if (count($rows) === 0) {
                continue;
            }

            $headers = array_shift($rows);
            if (empty($headers)) {
                continue;
            }

            $pdo->exec("TRUNCATE TABLE `{$table}`");
            $placeholders = rtrim(str_repeat('?,', count($headers)), ',');
            $columns = implode(', ', array_map(fn($column) => "`{$column}`", $headers));
            $stmt = $pdo->prepare("INSERT INTO `{$table}` ({$columns}) VALUES ({$placeholders})");

            foreach ($rows as $row) {
                if (count($row) !== count($headers)) {
                    continue;
                }
                $stmt->execute($row);
            }
        }

        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        $pdo->commit();

        echo json_encode(['ok' => true, 'message' => 'Backup restored successfully']);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Backup restore failed', 'details' => $e->getMessage()]);
    } finally {
        $zip->close();
    }
}

function getTableColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    $stmt->execute();

    return array_map(static function (array $column): string {
        return $column['Field'];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function readCsvRows(string $csvContent): array
{
    $csvContent = preg_replace('/\xEF\xBB\xBF/', '', $csvContent);
    $handle = fopen('php://temp', 'r+');
    if ($handle === false) {
        return [];
    }

    fwrite($handle, $csvContent);
    rewind($handle);

    $rows = [];
    while (($data = fgetcsv($handle)) !== false) {
        if ($data === [null] || $data === false) {
            continue;
        }
        $rows[] = $data;
    }

    fclose($handle);
    return $rows;
}
