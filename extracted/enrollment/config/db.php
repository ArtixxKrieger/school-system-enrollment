<?php
declare(strict_types=1);

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('DB_NAME') ?: 'enrollment';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_CHARSET = 'utf8mb4';

// If you prefer editing by hand, replace the variables above instead of env vars.

try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $DB_HOST, $DB_NAME, $DB_CHARSET);
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Throwable $e) {
    // Fail fast with a clear message (useful during development).
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Database connection failed',
        'details' => $e->getMessage(),
    ]);
    exit;
}

return $pdo;

