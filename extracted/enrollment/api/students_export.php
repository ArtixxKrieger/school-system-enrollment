<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
require_permission('student', 'view');

try {
    $pdo = require __DIR__ . '/../config/db.php';

    $search = trim((string)($_GET['search'] ?? ''));
    $courseId = trim((string)($_GET['course_id'] ?? ''));
    $yearLevel = trim((string)($_GET['year_level'] ?? ''));
    $financeStatus = strtolower(trim((string)($_GET['finance_status'] ?? '')));
    $type = strtolower(trim((string)($_GET['type'] ?? '')));
    $status = strtolower(trim((string)($_GET['status'] ?? '')));

    $conditions = ['1=1'];
    $params = [];

    if ($search !== '') {
        $conditions[] = '(s.first_name LIKE ? OR s.last_name LIKE ? OR s.middle_name LIKE ? OR s.email LIKE ? OR s.student_id LIKE ?)';
        $term = '%' . $search . '%';
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if ($courseId !== '' && ctype_digit($courseId)) {
        $conditions[] = 's.course_id = ?';
        $params[] = (int)$courseId;
    }

    if ($yearLevel !== '' && ctype_digit($yearLevel)) {
        $conditions[] = 's.year_level = ?';
        $params[] = (int)$yearLevel;
    }

    $allowedFinance = ['promisory', 'fully_paid', 'down_payment'];
    if ($financeStatus !== '' && in_array($financeStatus, $allowedFinance, true)) {
        $conditions[] = 'LOWER(COALESCE(s.finance_status, "")) = ?';
        $params[] = $financeStatus;
    }

    $allowedTypes = ['regular', 'irregular'];
    if ($type !== '' && in_array($type, $allowedTypes, true)) {
        $conditions[] = 'LOWER(COALESCE(s.student_type, "regular")) = ?';
        $params[] = $type;
    }

    $allowedStatus = ['active', 'inactive', 'graduated', 'transferred'];
    if ($status !== '' && in_array($status, $allowedStatus, true)) {
        $conditions[] = 'LOWER(COALESCE(s.status, "")) = ?';
        $params[] = $status;
    } else {
        $conditions[] = 's.status <> "transferred"';
    }

    $whereSql = implode(' AND ', $conditions);

    $stmt = $pdo->prepare("
        SELECT
            s.student_id,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.email,
            s.phone,
            s.guardian_contact,
            s.fb_name,
            s.address,
            s.gender,
            s.flag_group,
            s.year_level,
            s.enrollment_date,
            s.status,
            c.course_code,
            c.course_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE $whereSql
        ORDER BY s.last_name, s.first_name, s.id
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $courseLabel = 'All Courses';
    if ($courseId !== '' && ctype_digit($courseId)) {
        $courseStmt = $pdo->prepare('SELECT course_code, course_name FROM courses WHERE id = ? LIMIT 1');
        $courseStmt->execute([(int)$courseId]);
        $course = $courseStmt->fetch(PDO::FETCH_ASSOC);
        if ($course) {
            $courseLabel = (string)($course['course_code'] ?: $course['course_name']);
        }
    }

    $titleOne = strtoupper($courseLabel) . ($yearLevel !== '' && ctype_digit($yearLevel) ? ' - ' . ordinalLabel((int)$yearLevel) . ' YEAR' : ' - STUDENT LIST');
    $titleTwo = 'DATABASE EXPORT - ' . date('F j, Y');

    $filename = 'students_export_' . date('Ymd_His') . '.xls';
    header('Content-Type: application/vnd.ms-excel; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    $html = '<html><head><meta charset="utf-8"></head><body>';
    $html .= '<table border="1" style="border-collapse:collapse; font-family: Arial, sans-serif; width: 100%;">';
    $html .= '<tr><th colspan="12" style="background:#d9ead3; font-size:16px; text-align:center;">' . h($titleOne) . '</th></tr>';
    $html .= '<tr><th colspan="12" style="background:#d9ead3; font-size:14px; text-align:center;">' . h($titleTwo) . '</th></tr>';
    $html .= '<tr>';
    foreach (['NO.', 'Student ID', 'Name', 'GENDER', 'Address', 'CONTACT NUMBER', 'GMAIL', 'FB ACCOUNT', "GUARDIAN'S CONTACT NO.", 'FLAG GROUP', 'COURSE', 'STATUS'] as $heading) {
        $html .= '<th style="background:#b6d7a8; font-weight:bold;">' . h($heading) . '</th>';
    }
    $html .= '</tr>';

    foreach ($rows as $index => $row) {
        $fullName = trim(implode(' ', array_filter([
            (string)($row['first_name'] ?? ''),
            (string)($row['middle_name'] ?? ''),
            (string)($row['last_name'] ?? ''),
        ])));

        $html .= '<tr>';
        $html .= '<td>' . h((string)($index + 1)) . '</td>';
        $html .= '<td>' . h((string)($row['student_id'] ?? '')) . '</td>';
        $html .= '<td>' . h($fullName) . '</td>';
        $html .= '<td>' . h((string)($row['gender'] ?? '')) . '</td>';
        $html .= '<td>' . h((string)($row['address'] ?? '')) . '</td>';
        $html .= '<td>' . h((string)($row['phone'] ?? '')) . '</td>';
        $html .= '<td>' . h((string)($row['email'] ?? '')) . '</td>';
        $html .= '<td>' . h((string)($row['fb_name'] ?? '')) . '</td>';
        $html .= '<td>' . h((string)($row['guardian_contact'] ?? '')) . '</td>';
        $html .= '<td>' . h(formatFlagGroup((string)($row['flag_group'] ?? ''))) . '</td>';
        $html .= '<td>' . h((string)($row['course_code'] ?: $row['course_name'] ?: '')) . '</td>';
        $html .= '<td>' . h(ucfirst((string)($row['status'] ?? ''))) . '</td>';
        $html .= '</tr>';
    }

    if (count($rows) === 0) {
        $html .= '<tr><td colspan="12" style="text-align:center; color:#6b7280;">No student records found for the selected filters.</td></tr>';
    }

    $html .= '</table></body></html>';
    echo $html;
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to export students',
        'details' => $e->getMessage(),
    ]);
    exit;
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function ordinalLabel(int $number): string
{
    $map = [1 => '1ST', 2 => '2ND', 3 => '3RD', 4 => '4TH'];
    return $map[$number] ?? ($number . 'TH');
}

function formatFlagGroup(string $value): string
{
    $value = trim(str_replace('_', ' ', $value));
    return $value === '' ? '' : ucwords($value);
}
