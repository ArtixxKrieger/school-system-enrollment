<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();

$pdo = require __DIR__ . '/../config/db.php';

function enrollment_settings_request_ip(): ?string
{
    $ipAddress = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
    if (strpos($ipAddress, ',') !== false) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }

    return $ipAddress !== '' ? $ipAddress : null;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get advanced enrollment settings
            $stmt = $pdo->query('SELECT * FROM enrollment_settings WHERE id = 1');
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$settings) {
                // Create default settings if not exist
                $stmt = $pdo->prepare('
                    INSERT INTO enrollment_settings
                        (auto_close_accounts, strict_enrollment_windows, auto_progression, system_close_date)
                    VALUES (?, ?, ?, NULL)
                ');
                $stmt->execute(['never', false, true]);

                $settings = [
                    'auto_close_accounts' => 'never',
                    'strict_enrollment_windows' => false,
                    'auto_progression' => true,
                    'system_close_date' => null
                ];
            }

            echo json_encode(['ok' => true, 'settings' => $settings]);
            break;

        case 'POST':
            require_permission('settings', 'edit');
            // Update advanced enrollment settings
            $raw = file_get_contents('php://input');
            $data = json_decode($raw ?: '', true);

            if (!$data) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Invalid JSON data']);
                exit;
            }

            $currentStmt = $pdo->query('SELECT * FROM enrollment_settings WHERE id = 1 LIMIT 1');
            $previousSettings = $currentStmt->fetch(PDO::FETCH_ASSOC) ?: [];

            $stmt = $pdo->prepare('
                UPDATE enrollment_settings
                SET auto_close_accounts = ?, strict_enrollment_windows = ?, auto_progression = ?, system_close_date = ?, updated_at = NOW()
                WHERE id = 1
            ');

            $systemCloseDate = !empty($data['system_close_date']) ? $data['system_close_date'] : null;

            $stmt->execute([
                $data['auto_close_accounts'] ?? 'never',
                $data['strict_enrollment_windows'] ?? false,
                $data['auto_progression'] ?? true,
                $systemCloseDate
            ]);

            // If no rows updated, insert new record
            if ($stmt->rowCount() === 0) {
                $stmt = $pdo->prepare('
                    INSERT INTO enrollment_settings
                        (auto_close_accounts, strict_enrollment_windows, auto_progression, system_close_date)
                    VALUES (?, ?, ?, ?)
                ');
                $stmt->execute([
                    $data['auto_close_accounts'] ?? 'never',
                    $data['strict_enrollment_windows'] ?? false,
                    $data['auto_progression'] ?? true,
                    $systemCloseDate
                ]);
            }

            $user = current_user() ?? [];
            $updatedSettings = [
                'auto_close_accounts' => $data['auto_close_accounts'] ?? 'never',
                'strict_enrollment_windows' => (bool)($data['strict_enrollment_windows'] ?? false),
                'auto_progression' => (bool)($data['auto_progression'] ?? true),
                'system_close_date' => $systemCloseDate,
            ];

            $logStmt = $pdo->prepare(
                'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, old_value, new_value, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $logStmt->execute([
                isset($user['id']) ? (int)$user['id'] : null,
                'enrollment_settings_updated',
                'Updated advanced enrollment settings.',
                'enrollment_settings',
                1,
                $previousSettings ? json_encode($previousSettings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
                json_encode($updatedSettings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                enrollment_settings_request_ip(),
            ]);

            echo json_encode(['ok' => true, 'message' => 'Enrollment settings updated successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}