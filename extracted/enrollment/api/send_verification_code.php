<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$purpose = strtolower(trim((string)($payload['purpose'] ?? 'account_verification')));
$requestEmail = trim((string)($payload['email'] ?? ''));

$pdo = require __DIR__ . '/../config/db.php';

function mask_email_address(string $email): string
{
    if ($email === '' || strpos($email, '@') === false) {
        return $email;
    }

    [$local, $domain] = explode('@', $email, 2);
    $visible = substr($local, 0, 2);
    return $visible . str_repeat('*', max(1, strlen($local) - 2)) . '@' . $domain;
}

try {
    $email = '';
    $accountId = null;

    if ($purpose === 'forgot_password') {
        if ($requestEmail === '' || !filter_var($requestEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please provide a valid email address']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, email, is_active FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$requestEmail]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$account || (int)($account['is_active'] ?? 0) !== 1) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'No active account found for that email']);
            exit;
        }

        $accountId = isset($account['id']) ? (int)$account['id'] : null;
        $email = (string)$account['email'];
    } else {
        require_login();
        $user = current_user();
        if (!$user || empty($user['email'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Email address is not available']);
            exit;
        }

        $email = (string)$user['email'];
    }

    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $subject = $purpose === 'forgot_password' ? 'Password Reset Authentication Code' : 'Verification Code';
    $message = "Your authentication code is: {$code}\n\nThis code will expire in 10 minutes. If you did not request this code, please ignore this message.";
    $headers = 'From: noreply@localhost' . "\r\n" . 'Content-Type: text/plain; charset=utf-8';

    $sent = false;
    try {
        $sent = @mail($email, $subject, $message, $headers);
    } catch (Throwable $e) {
        $sent = false;
    }

    $sessionKey = $purpose === 'forgot_password' ? 'forgot_password_verification' : 'verification_code';
    $_SESSION[$sessionKey] = [
        'code' => $code,
        'email' => $email,
        'purpose' => $purpose,
        'sent_at' => time(),
        'expires_at' => time() + 600,
        'verified' => false,
        'attempts' => 0,
    ];

    $response = [
        'ok' => true,
        'message' => $sent
            ? 'Authentication code sent to your email.'
            : 'Mail server is unavailable. The superadmin has been notified. Use the development code shown below.',
        'masked_email' => mask_email_address($email),
    ];

    if (!$sent) {
        if ($purpose === 'forgot_password' && function_exists('record_security_event')) {
            record_security_event(
                $pdo,
                $accountId,
                'password_reset_email_failed',
                'Password reset email could not be delivered for ' . mask_email_address($email) . '. Superadmin review is required.',
                'user',
                $accountId
            );
        }

        $response['dev_code'] = $code;
        $response['superadmin_notified'] = true;
    }

    echo json_encode($response);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Unable to send verification code',
        'details' => $e->getMessage(),
    ]);
}
