<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
require_permission('rolemanagement', 'edit');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$name = isset($payload['name']) ? trim((string)$payload['name']) : '';
$description = isset($payload['description']) ? trim((string)$payload['description']) : '';
$isActive = isset($payload['is_active']) ? (bool)$payload['is_active'] : true;
$permissions = isset($payload['permissions']) && is_array($payload['permissions']) ? $payload['permissions'] : null;
$roleId = isset($payload['id']) && $payload['id'] !== null ? (int)$payload['id'] : null;

// Allow permissions-only update (no name required if updating existing role with only permissions)
$permissionsOnly = $roleId && $name === '' && is_array($permissions);

if ($name === '' && !$permissionsOnly) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Role name is required']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    $pdo->beginTransaction();

    if ($roleId) {
        if (!$permissionsOnly) {
            $stmt = $pdo->prepare('UPDATE roles SET name = :name, description = :description, is_active = :is_active, updated_at = NOW() WHERE id = :id');
            $stmt->execute([
                ':name' => $name,
                ':description' => $description,
                ':is_active' => $isActive ? 1 : 0,
                ':id' => $roleId,
            ]);

            if ($stmt->rowCount() === 0) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['ok' => false, 'error' => 'Role not found']);
                exit;
            }
        } else {
            // Verify role exists for permissions-only update
            $checkStmt = $pdo->prepare('SELECT id FROM roles WHERE id = ?');
            $checkStmt->execute([$roleId]);
            if (!$checkStmt->fetch()) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['ok' => false, 'error' => 'Role not found']);
                exit;
            }
        }
    } else {
        $insert = $pdo->prepare('INSERT INTO roles (name, description, is_system, is_active) VALUES (:name, :description, 0, :is_active)');
        $insert->execute([
            ':name' => $name,
            ':description' => $description,
            ':is_active' => $isActive ? 1 : 0,
        ]);
        $roleId = (int)$pdo->lastInsertId();
    }

    if (is_array($permissions)) {
        $delete = $pdo->prepare('DELETE FROM role_permissions WHERE role_id = :role_id');
        $delete->execute([':role_id' => $roleId]);

        $insertPermission = $pdo->prepare('INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed) VALUES (:role_id, :module_slug, :action, 1)');
        foreach ($permissions as $moduleSlug => $actions) {
            if (!is_array($actions)) {
                continue;
            }
            foreach ($actions as $action => $enabled) {
                if ($enabled) {
                    $insertPermission->execute([
                        ':role_id' => $roleId,
                        ':module_slug' => $moduleSlug,
                        ':action' => $action,
                    ]);
                }
            }
        }
    }

    $pdo->commit();

    $roleStmt = $pdo->prepare('SELECT id, name, description, is_system, is_active FROM roles WHERE id = ?');
    $roleStmt->execute([$roleId]);
    $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

    $permissionStmt = $pdo->prepare('SELECT permission_module_slug, action FROM role_permissions WHERE role_id = ? AND is_allowed = 1');
    $permissionStmt->execute([$roleId]);
    $permissionRows = $permissionStmt->fetchAll(PDO::FETCH_ASSOC);

    $role['permissions'] = [];
    foreach ($permissionRows as $permission) {
        $moduleSlug = $permission['permission_module_slug'];
        $action = $permission['action'];
        if (!isset($role['permissions'][$moduleSlug])) {
            $role['permissions'][$moduleSlug] = [];
        }
        $role['permissions'][$moduleSlug][$action] = true;
    }

    $role['permission_count'] = count($permissionRows);
    $countStmt = $pdo->prepare('SELECT COUNT(*) AS user_count FROM users WHERE role_id = ?');
    $countStmt->execute([$roleId]);
    $role['user_count'] = (int)$countStmt->fetchColumn();

    echo json_encode(['ok' => true, 'role' => $role]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save role', 'details' => $e->getMessage()]);
}
