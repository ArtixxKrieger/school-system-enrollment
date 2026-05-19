<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/auth.php';

$pdo = require __DIR__ . '/../config/db.php';
ensure_app_schema($pdo);

function notification_request_payload(): array
{
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw ?: '', true);
    return is_array($payload) ? $payload : $_POST;
}

function notification_request_ip(): ?string
{
    $ipAddress = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''));
    if (strpos($ipAddress, ',') !== false) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }

    return $ipAddress !== '' ? $ipAddress : null;
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

try {
    if ($method === 'GET') {
        require_permission('settings', 'view');

        $stmt = $pdo->query(
            "SELECT al.id, al.user_id, al.description, al.new_value, al.created_at,
                    u.full_name, u.username, u.role
             FROM activity_logs al
             LEFT JOIN users u ON u.id = al.user_id
             WHERE al.action = 'notification_report'
             ORDER BY al.created_at DESC
             LIMIT 100"
        );

        $reports = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $meta = json_decode((string)($row['new_value'] ?? ''), true);
            if (!is_array($meta)) {
                $meta = [];
            }

            $reports[] = [
                'id' => (int)$row['id'],
                'title' => (string)($meta['title'] ?? $row['description'] ?? 'Notification Report'),
                'category' => (string)($meta['category'] ?? 'issue'),
                'categoryLabel' => (string)($meta['categoryLabel'] ?? 'System Issue'),
                'details' => (string)($meta['details'] ?? ''),
                'status' => (string)($meta['status'] ?? 'Pending Review'),
                'submittedAt' => (string)($row['created_at'] ?? ''),
                'submittedBy' => trim((string)($row['full_name'] ?? $row['username'] ?? 'System User')),
                'submitterRole' => (string)($row['role'] ?? ''),
            ];
        }

        echo json_encode([
            'ok' => true,
            'reports' => $reports,
        ]);
        exit;
    }

    if ($method === 'POST') {
        require_permission('settings', 'view');

        $payload = notification_request_payload();
        $title = trim((string)($payload['title'] ?? ''));
        $category = strtolower(trim((string)($payload['category'] ?? 'issue')));
        $details = trim((string)($payload['details'] ?? ''));

        if ($title === '' || $details === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please provide a title and details for the report']);
            exit;
        }

        $categoryLabels = [
            'issue' => 'System Issue',
            'alert' => 'Enrollment Alert',
            'suggestion' => 'Improvement Suggestion',
            'audit' => 'Audit Notice',
        ];
        $categoryLabel = $categoryLabels[$category] ?? 'System Issue';

        $user = current_user() ?? [];
        $reportMeta = [
            'title' => $title,
            'category' => $category,
            'categoryLabel' => $categoryLabel,
            'details' => $details,
            'status' => 'Pending Review',
        ];

        $stmt = $pdo->prepare(
            'INSERT INTO activity_logs (user_id, action, description, entity_type, new_value, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            isset($user['id']) ? (int)$user['id'] : null,
            'notification_report',
            '[' . $categoryLabel . '] ' . $title,
            'notification_report',
            json_encode($reportMeta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            notification_request_ip(),
        ]);

        echo json_encode([
            'ok' => true,
            'message' => 'Report delivered to the admin team for review.',
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Unable to process notification report',
        'details' => $e->getMessage(),
    ]);
}
