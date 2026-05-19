<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
require_permission('rolemanagement', 'view');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query(
        'SELECT u.id, u.username AS user_id, u.email, u.full_name, u.is_active, u.role_id, u.role AS legacy_role, r.name AS assigned_role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         ORDER BY u.id DESC'
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $users = array_map(function ($row) {
        $roleName = $row['assigned_role'] ?: $row['legacy_role'] ?? '';
        $roles = [];
        if ($roleName !== '') {
            $roles[] = $roleName;
        }

        return [
            'id' => (int)$row['id'],
            'user_id' => $row['user_id'],
            'email' => $row['email'],
            'name' => trim($row['full_name'] ?: $row['user_id']),
            'is_active' => (int)$row['is_active'] === 1,
            'role_id' => $row['role_id'] !== null ? (int)$row['role_id'] : null,
            'roles' => $roles,
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'users' => $users]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to load users', 'details' => $e->getMessage()]);
}
