<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    require_permission('schedule', 'edit');
}

$pdo = require __DIR__ . '/../config/db.php';

function enrollment_schedule_request_ip(): ?string
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
            // Get all course enrollment schedules
            $stmt = $pdo->query('
                SELECT ces.*, c.course_name, c.course_code
                FROM course_enrollment_schedule ces
                JOIN courses c ON ces.course_id = c.id
                ORDER BY c.course_name, ces.updated_at DESC, ces.id DESC
            ');
            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['ok' => true, 'schedules' => $schedules]);
            break;

        case 'POST':
            // Create or update course enrollment schedule
            $raw = file_get_contents('php://input');
            $data = json_decode($raw ?: '', true);

            if (!$data) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Invalid JSON data']);
                exit;
            }

            $required = ['course_id', 'enrollment_start_date', 'enrollment_end_date'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    http_response_code(400);
                    echo json_encode(['ok' => false, 'error' => "Missing required field: {$field}"]);
                    exit;
                }
            }

            $pdo->beginTransaction();
            $user = current_user() ?? [];

            $courseStmt = $pdo->prepare('SELECT id, course_code, course_name FROM courses WHERE id = ? LIMIT 1');
            $courseStmt->execute([(int)$data['course_id']]);
            $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

            if (!$course) {
                http_response_code(404);
                echo json_encode(['ok' => false, 'error' => 'Course not found']);
                exit;
            }

            $previousSchedule = null;

            if (isset($data['id']) && $data['id']) {
                $oldStmt = $pdo->prepare('SELECT id, course_id, enrollment_start_date, enrollment_end_date, max_slots FROM course_enrollment_schedule WHERE id = ? LIMIT 1');
                $oldStmt->execute([(int)$data['id']]);
                $previousSchedule = $oldStmt->fetch(PDO::FETCH_ASSOC) ?: null;

                // Update existing
                $stmt = $pdo->prepare('
                    UPDATE course_enrollment_schedule
                    SET course_id = ?, enrollment_start_date = ?, enrollment_end_date = ?, max_slots = ?
                    WHERE id = ?
                ');
                $stmt->execute([
                    $data['course_id'],
                    $data['enrollment_start_date'],
                    $data['enrollment_end_date'],
                    $data['max_slots'] ?? null,
                    $data['id']
                ]);
                $message = 'Course enrollment schedule updated successfully';
            } else {
                // Upsert by course_id
                $checkStmt = $pdo->prepare('SELECT id FROM course_enrollment_schedule WHERE course_id = ? LIMIT 1');
                $checkStmt->execute([$data['course_id']]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    $oldStmt = $pdo->prepare('SELECT id, course_id, enrollment_start_date, enrollment_end_date, max_slots FROM course_enrollment_schedule WHERE id = ? LIMIT 1');
                    $oldStmt->execute([(int)$existing['id']]);
                    $previousSchedule = $oldStmt->fetch(PDO::FETCH_ASSOC) ?: null;

                    $stmt = $pdo->prepare('
                        UPDATE course_enrollment_schedule
                        SET enrollment_start_date = ?, enrollment_end_date = ?, max_slots = ?
                        WHERE course_id = ?
                    ');
                    $stmt->execute([
                        $data['enrollment_start_date'],
                        $data['enrollment_end_date'],
                        $data['max_slots'] ?? null,
                        $data['course_id']
                    ]);
                    $message = 'Course enrollment schedule updated successfully';
                } else {
                    $stmt = $pdo->prepare('
                        INSERT INTO course_enrollment_schedule
                            (course_id, enrollment_start_date, enrollment_end_date, max_slots)
                        VALUES (?, ?, ?, ?)
                    ');
                    $stmt->execute([
                        $data['course_id'],
                        $data['enrollment_start_date'],
                        $data['enrollment_end_date'],
                        $data['max_slots'] ?? null
                    ]);
                    $message = 'Course enrollment schedule created successfully';
                }
            }

            $newSchedule = [
                'course_id' => (int)$data['course_id'],
                'course_code' => (string)$course['course_code'],
                'course_name' => (string)$course['course_name'],
                'enrollment_start_date' => (string)$data['enrollment_start_date'],
                'enrollment_end_date' => (string)$data['enrollment_end_date'],
                'max_slots' => $data['max_slots'] ?? null,
            ];

            $logStmt = $pdo->prepare(
                'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, old_value, new_value, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $logStmt->execute([
                isset($user['id']) ? (int)$user['id'] : null,
                'course_enrollment_schedule_saved',
                'Saved enrollment window for ' . $course['course_code'] . ' - ' . $course['course_name'] . '.',
                'course_enrollment_schedule',
                isset($data['id']) && $data['id'] ? (int)$data['id'] : (isset($existing['id']) ? (int)$existing['id'] : null),
                $previousSchedule ? json_encode($previousSchedule, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
                json_encode($newSchedule, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                enrollment_schedule_request_ip(),
            ]);

            $pdo->commit();
            echo json_encode(['ok' => true, 'message' => $message]);
            break;

        case 'DELETE':
            // Delete course enrollment schedule
            $raw = file_get_contents('php://input');
            $data = json_decode($raw ?: '', true);

            if (!$data || !isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Schedule ID required']);
                exit;
            }

            $lookupStmt = $pdo->prepare('SELECT ces.id, ces.course_id, ces.enrollment_start_date, ces.enrollment_end_date, ces.max_slots, c.course_code, c.course_name FROM course_enrollment_schedule ces JOIN courses c ON c.id = ces.course_id WHERE ces.id = ? LIMIT 1');
            $lookupStmt->execute([(int)$data['id']]);
            $schedule = $lookupStmt->fetch(PDO::FETCH_ASSOC);

            if (!$schedule) {
                http_response_code(404);
                echo json_encode(['ok' => false, 'error' => 'Schedule not found']);
                exit;
            }

            $stmt = $pdo->prepare('DELETE FROM course_enrollment_schedule WHERE id = ?');
            $stmt->execute([$data['id']]);

            $user = current_user() ?? [];
            $logStmt = $pdo->prepare(
                'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id, old_value, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $logStmt->execute([
                isset($user['id']) ? (int)$user['id'] : null,
                'course_enrollment_schedule_deleted',
                'Deleted enrollment window for ' . $schedule['course_code'] . ' - ' . $schedule['course_name'] . '.',
                'course_enrollment_schedule',
                (int)$schedule['id'],
                json_encode($schedule, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                enrollment_schedule_request_ip(),
            ]);

            echo json_encode(['ok' => true, 'message' => 'Course enrollment schedule deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    }

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}