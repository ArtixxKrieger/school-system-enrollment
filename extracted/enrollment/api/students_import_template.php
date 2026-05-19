<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/auth.php';
require_login();
if (!has_permission('student', 'edit') && !has_permission('enrollment', 'create') && !has_permission('enrollment', 'edit')) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: application/vnd.ms-excel; charset=utf-8');
header('Content-Disposition: attachment; filename="student_import_template.xls"');

$titleOne = 'BACHELOR OF SCIENCE IN CRIMINOLOGY -FIRST YEAR';
$titleTwo = '2ND SEMESTER A.Y 2025-2026 ENROLLMENT ATTENDANCE';

$html = '<html><head><meta charset="utf-8"></head><body>';
$html .= '<table border="1" style="border-collapse:collapse; font-family: Arial, sans-serif;">';
$html .= '<tr><th colspan="9" style="background:#d9ead3; font-size:16px; text-align:center;">' . htmlspecialchars($titleOne, ENT_QUOTES, 'UTF-8') . '</th></tr>';
$html .= '<tr><th colspan="9" style="background:#d9ead3; font-size:14px; text-align:center;">' . htmlspecialchars($titleTwo, ENT_QUOTES, 'UTF-8') . '</th></tr>';
$html .= '<tr>';
foreach (['NO.', 'Name', 'GENDER', 'Address', 'CONTACT NUMBER', 'GMAIL', 'FB ACCOUNT', "GUARDIAN'S CONTACT NO.", 'FLAG GROUP'] as $heading) {
    $html .= '<th style="background:#b6d7a8; font-weight:bold;">' . htmlspecialchars($heading, ENT_QUOTES, 'UTF-8') . '</th>';
}
$html .= '</tr>';

$sampleRows = [
    ['1', 'Juan Dela Cruz', 'Male', 'Bendita 2', '09123456789', 'juan.delacruz@gmail.com', 'Juan Dela Cruz', '09987654321', 'Kindness'],
    ['2', 'Maria Clara Santos', 'Female', 'Nasugbu', '09998887777', 'maria.clara@gmail.com', 'Maria Clara Santos', '09112223344', 'Love'],
];

foreach ($sampleRows as $row) {
    $html .= '<tr>';
    foreach ($row as $cell) {
        $html .= '<td>' . htmlspecialchars($cell, ENT_QUOTES, 'UTF-8') . '</td>';
    }
    $html .= '</tr>';
}

$html .= '</table></body></html>';
echo $html;
exit;
