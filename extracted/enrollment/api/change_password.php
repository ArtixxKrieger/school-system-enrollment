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

$action = strtolower(trim((string)($payload['action'] ?? 'change_password')));
$currentPassword = isset($payload['current_password']) ? (string)$payload['current_password'] : '';
$newPassword = isset($payload['new_password']) ? (string)$payload['new_password'] : '';
$confirmPassword = isset($payload['confirm_password']) ? (string)$payload['confirm_password'] : '';
$email = trim((string)($payload['email'] ?? ''));
$resetCode = trim((string)($payload['reset_code'] ?? ''));

$pdo = require __DIR__ . '/../config/db.php';

function validate_forgot_code(string $email, string $code): array
{
    $verification = $_SESSION['forgot_password_verification'] ?? null;
    if (!is_array($verification)) {
        return [false, 'No password reset request was found. Please request a new code.'];
    }

    if (($verification['expires_at'] ?? 0) < time()) {
        unset($_SESSION['forgot_password_verification']);
        return [false, 'The authentication code has expired. Please request a new one.'];
    }

    if (!hash_equals((string)($verification['email'] ?? ''), $email)) {
        return [false, 'The email does not match the current reset request.'];
    }

    if (!hash_equals((string)($verification['code'] ?? ''), $code)) {
        $verification['attempts'] = (int)($verification['attempts'] ?? 0) + 1;
        $_SESSION['forgot_password_verification'] = $verification;
        if ($verification['attempts'] >= 5) {
            unset($_SESSION['forgot_password_verification']);
            return [false, 'Too many incorrect attempts. Please request a new code.'];
        }

        return [false, 'Invalid authentication code.'];
    }

    $verification['verified'] = true;
    $_SESSION['forgot_password_verification'] = $verification;
    return [true, 'Authentication code verified successfully.'];
}

try {
    if ($action === 'verify_reset_code') {
        if ($email === '' || $resetCode === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Email and authentication code are required']);
            exit;
        }

        [$ok, $message] = validate_forgot_code($email, $resetCode);
        if (!$ok) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $message]);
            exit;
        }

        echo json_encode(['ok' => true, 'message' => $message]);
        exit;
    }

    if ($action === 'forgot_reset') {
        if ($email === '' || $resetCode === '' || $newPassword === '' || $confirmPassword === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Email, authentication code, and new password are required']);
            exit;
        }

        if ($newPassword !== $confirmPassword) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'New password and confirmation do not match']);
            exit;
        }

        if (strlen($newPassword) < 8) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Password must be at least 8 characters']);
            exit;
        }

        [$ok, $message] = validate_forgot_code($email, $resetCode);
        if (!$ok) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $message]);
            exit;
        }

        $userStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND is_active = 1 LIMIT 1');
        $userStmt->execute([$email]);
        $userId = (int)$userStmt->fetchColumn();

        if ($userId <= 0) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'No active account found for that email']);
            exit;
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
        $updateStmt->execute([$hash, $userId]);

        unset($_SESSION['forgot_password_verification']);

        echo json_encode(['ok' => true, 'message' => 'Password changed successfully. You can now log in.']);
        exit;
    }

    require_login();

    if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'All password fields are required']);
        exit;
    }

    if ($newPassword !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'New password and confirmation do not match']);
        exit;
    }

    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Password must be at least 8 characters']);
        exit;
    }

    $user = current_user();
    if (!$user || !isset($user['id'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Authentication required']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !isset($row['password']) || !password_verify($currentPassword, (string)$row['password'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Current password is incorrect']);
        exit;
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $updateStmt->execute([$hash, $user['id']]);

    echo json_encode(['ok' => true, 'message' => 'Password changed successfully']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to change password', 'details' => $e->getMessage()]);
}
