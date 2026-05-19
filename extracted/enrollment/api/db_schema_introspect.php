<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$pdo = require __DIR__ . '/../config/db.php';

function getTableColumns(PDO $pdo, string $table): array {
    $stmt = $pdo->prepare('
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table
        ORDER BY ORDINAL_POSITION
    ');
    $stmt->execute([':table' => $table]);
    return $stmt->fetchAll();
}

function getRowCount(PDO $pdo, string $table): ?int {
    $stmt = $pdo->prepare("SELECT COUNT(*) AS c FROM `$table`");
    $stmt->execute();
    $row = $stmt->fetch();
    return isset($row['c']) ? (int)$row['c'] : null;
}

try {
    $tables = ['users', 'roles', 'permission_modules', 'role_permissions', 'enrollees', 'students', 'courses', 'schedules', 'events', 'audit_log'];

    $out = [];
    foreach ($tables as $t) {
        $out[$t] = [
            'exists' => true,
            'rowCount' => null,
            'columns' => [],
        ];

        // Check existence
        $existsStmt = $pdo->prepare('
            SELECT COUNT(*) AS cnt
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
        ');
        $existsStmt->execute([':table' => $t]);
        $exists = (int)($existsStmt->fetch()['cnt'] ?? 0);

        if ($exists === 0) {
            $out[$t]['exists'] = false;
            continue;
        }

        $out[$t]['rowCount'] = getRowCount($pdo, $t);
        $out[$t]['columns'] = getTableColumns($pdo, $t);
    }

    echo json_encode(['ok' => true, 'schema' => $out], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Introspection failed',
        'details' => $e->getMessage(),
    ]);
}

