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
    $rolesStmt = $pdo->query(
        'SELECT r.id, r.name, r.description, r.is_system, r.is_active,
                COALESCE(u.user_count, 0) AS user_count,
                COALESCE(p.permission_count, 0) AS permission_count
         FROM roles r
         LEFT JOIN (
             SELECT role_id, COUNT(*) AS user_count
             FROM users
             WHERE role_id IS NOT NULL
             GROUP BY role_id
         ) u ON u.role_id = r.id
         LEFT JOIN (
             SELECT role_id, COUNT(*) AS permission_count
             FROM role_permissions
             WHERE is_allowed = 1
             GROUP BY role_id
         ) p ON p.role_id = r.id
         ORDER BY r.is_system DESC, r.name ASC'
    );
    $roles = $rolesStmt->fetchAll(PDO::FETCH_ASSOC);

    $permissionStmt = $pdo->query(
        'SELECT role_id, permission_module_slug, action
         FROM role_permissions
         WHERE is_allowed = 1'
    );
    $permissions = $permissionStmt->fetchAll(PDO::FETCH_ASSOC);

    $roleMap = [];
    foreach ($roles as &$role) {
        $role['permissions'] = [];
        $roleMap[(int)$role['id']] = &$role;
    }
    unset($role);

    foreach ($permissions as $permission) {
        $roleId = (int)$permission['role_id'];
        if (!isset($roleMap[$roleId])) {
            continue;
        }

        $moduleSlug = $permission['permission_module_slug'];
        $action = $permission['action'];

        if (!isset($roleMap[$roleId]['permissions'][$moduleSlug])) {
            $roleMap[$roleId]['permissions'][$moduleSlug] = [];
        }
        $roleMap[$roleId]['permissions'][$moduleSlug][$action] = true;
    }

    echo json_encode(['ok' => true, 'roles' => array_values($roles)]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to load roles', 'details' => $e->getMessage()]);
}
