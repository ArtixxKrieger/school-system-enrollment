<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_login();
if (!has_permission('student', 'edit') && !has_permission('enrollment', 'create') && !has_permission('enrollment', 'edit')) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['import_file']) || !is_array($_FILES['import_file'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Import file is required']);
    exit;
}

$courseId = isset($_POST['course_id']) ? (int)$_POST['course_id'] : 0;
$yearLevel = isset($_POST['year_level']) ? (int)$_POST['year_level'] : 0;
$semester = isset($_POST['semester']) ? (int)$_POST['semester'] : 0;
$enrollmentDateInput = trim((string)($_POST['enrollment_date'] ?? ''));
$academicYearInput = trim((string)($_POST['academic_year'] ?? ''));
$batchNumberInput = normalizeBatchNumber((string)($_POST['batch_number'] ?? ''));
$defaultPassword = trim((string)($_POST['default_password'] ?? 'student123'));
$file = $_FILES['import_file'];

if ($courseId <= 0 || $yearLevel <= 0 || !in_array($semester, [1, 2], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please select course, year level, and semester for the import']);
    exit;
}

$enrollmentDate = normalizeDateValue($enrollmentDateInput) ?: date('Y-m-d');
$academicYear = $academicYearInput !== '' ? $academicYearInput : inferAcademicYearFromDate($enrollmentDate);
$currentBatchYear = (string)date('Y');

if ($batchNumberInput !== '' && extractBatchYear($batchNumberInput) !== $currentBatchYear) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'Only the current year batch is allowed for newly imported enrollees',
        'expected_batch_year' => $currentBatchYear,
    ]);
    exit;
}

$batchNumber = $currentBatchYear;

if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($file['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Failed to upload the import file']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    ensureStudentColumns($pdo);

    $courseStmt = $pdo->prepare('SELECT id, course_code, course_name FROM courses WHERE id = ? LIMIT 1');
    $courseStmt->execute([$courseId]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Selected course was not found']);
        exit;
    }

    validateEnrollmentWindow($pdo, $courseId, $enrollmentDate);

    $rows = loadImportRows($file);
    if (count($rows) === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'The uploaded file does not contain any student rows']);
        exit;
    }

    $roleStmt = $pdo->prepare('SELECT id FROM roles WHERE name = ? LIMIT 1');
    $roleStmt->execute(['student']);
    $roleId = $roleStmt->fetchColumn();
    $studentRoleId = $roleId !== false ? (int)$roleId : null;

    $inserted = 0;
    $updated = 0;
    $errors = [];

    $pdo->beginTransaction();

    foreach ($rows as $rowIndex => $row) {
        $displayRow = $rowIndex + 2;

        $fullNameInput = cleanText($row['name'] ?? '');
        $nameParts = splitFullName($fullNameInput);

        $firstName = cleanText($row['firstname'] ?? ($nameParts['first_name'] ?? ''));
        $middleName = cleanText($row['middlename'] ?? ($nameParts['middle_name'] ?? ''));
        $lastName = cleanText($row['lastname'] ?? ($nameParts['last_name'] ?? ''));
        $email = strtolower(cleanText($row['email'] ?? ($row['gmail'] ?? '')));
        $phone = cleanNullableText($row['phone'] ?? ($row['contact_number'] ?? ''));
        $guardianContact = cleanNullableText($row['guardian_contact'] ?? ($row['guardians_contact_number'] ?? ''));
        $fbName = cleanNullableText($row['fb_name'] ?? ($row['fb_account'] ?? ''));
        $address = cleanNullableText($row['address'] ?? '');
        $birthDate = normalizeDateValue($row['birth_date'] ?? '');
        $gender = normalizeGender($row['gender'] ?? '');
        $flagGroup = normalizeFlagGroup($row['flag_group'] ?? '');
        $rawPassword = trim((string)($row['password'] ?? ''));
        $passwordToUse = $rawPassword !== '' ? $rawPassword : $defaultPassword;
        $passwordHash = password_hash($passwordToUse, PASSWORD_DEFAULT);
        $fullName = trim($firstName . ' ' . ($middleName !== null && $middleName !== '' ? $middleName . ' ' : '') . $lastName);

        if ($firstName === '' || $lastName === '' || $email === '') {
            $errors[] = 'Row ' . $displayRow . ': Name and Gmail are required';
            continue;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Row ' . $displayRow . ': invalid email address';
            continue;
        }

        try {
            $existingStudentStmt = $pdo->prepare('SELECT id, student_id FROM students WHERE email = ? LIMIT 1');
            $existingStudentStmt->execute([$email]);
            $existingStudent = $existingStudentStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingStudent) {
                $updateStudentStmt = $pdo->prepare('
                    UPDATE students
                    SET first_name = ?,
                        middle_name = ?,
                        last_name = ?,
                        phone = ?,
                        guardian_contact = ?,
                        fb_name = ?,
                        address = ?,
                        birth_date = ?,
                        gender = ?,
                        flag_group = ?,
                        course_id = ?,
                        year_level = ?,
                        current_semester = ?,
                        current_academic_year = ?,
                        enrollment_date = ?,
                        status = ?,
                        is_account_active = TRUE
                    WHERE id = ?
                ');
                $updateStudentStmt->execute([
                    $firstName,
                    $middleName !== '' ? $middleName : null,
                    $lastName,
                    $phone,
                    $guardianContact,
                    $fbName,
                    $address,
                    $birthDate,
                    $gender,
                    $flagGroup,
                    $courseId,
                    $yearLevel,
                    $semester,
                    $academicYear,
                    $enrollmentDate,
                    'active',
                    (int)$existingStudent['id'],
                ]);
                $studentIdValue = (string)$existingStudent['student_id'];
                $updated++;
            } else {
                $studentIdValue = generateStudentId($pdo, $batchNumber);
                $insertStudentStmt = $pdo->prepare('
                    INSERT INTO students (
                        student_id, pre_reg_number, first_name, last_name, middle_name, email, phone,
                        guardian_contact, fb_name, address, birth_date, gender, flag_group, course_id, year_level,
                        enrollment_date, current_semester, current_academic_year, batch_number, status, is_account_active
                    ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
                ');
                $insertStudentStmt->execute([
                    $studentIdValue,
                    $firstName,
                    $lastName,
                    $middleName !== '' ? $middleName : null,
                    $email,
                    $phone,
                    $guardianContact,
                    $fbName,
                    $address,
                    $birthDate,
                    $gender,
                    $flagGroup,
                    $courseId,
                    $yearLevel,
                    $enrollmentDate,
                    $semester,
                    $academicYear,
                    $batchNumber,
                    'active',
                ]);
                $inserted++;
            }

            $existingUserStmt = $pdo->prepare('SELECT id, password FROM users WHERE email = ? OR username = ? LIMIT 1');
            $existingUserStmt->execute([$email, $email]);
            $existingUser = $existingUserStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingUser) {
                if ($rawPassword !== '') {
                    $updateUserStmt = $pdo->prepare('UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, role_id = ?, is_active = TRUE, password = ? WHERE id = ?');
                    $updateUserStmt->execute([$email, $email, $fullName, 'student', $studentRoleId, $passwordHash, (int)$existingUser['id']]);
                } else {
                    $updateUserStmt = $pdo->prepare('UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, role_id = ?, is_active = TRUE WHERE id = ?');
                    $updateUserStmt->execute([$email, $email, $fullName, 'student', $studentRoleId, (int)$existingUser['id']]);
                }
            } else {
                $insertUserStmt = $pdo->prepare('INSERT INTO users (username, email, password, full_name, role, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)');
                $insertUserStmt->execute([$email, $email, $passwordHash, $fullName, 'student', $studentRoleId]);
            }
        } catch (Throwable $rowError) {
            $errors[] = 'Row ' . $displayRow . ': ' . $rowError->getMessage();
        }
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'inserted' => $inserted,
        'updated' => $updated,
        'error_count' => count($errors),
        'errors' => $errors,
        'message' => 'Import completed for ' . ($inserted + $updated) . ' student record(s) under batch ' . $batchNumber,
        'defaults' => [
            'course' => $course['course_code'],
            'year_level' => $yearLevel,
            'semester' => $semester,
            'enrollment_date' => $enrollmentDate,
            'academic_year' => $academicYear,
            'batch_number' => $batchNumber,
            'default_password' => $defaultPassword,
        ],
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to import students',
        'details' => $e->getMessage(),
    ]);
}

function loadImportRows(array $file): array
{
    $tmpName = (string)($file['tmp_name'] ?? '');

    if ($tmpName === '' || !is_file($tmpName)) {
        throw new RuntimeException('Uploaded file is missing');
    }

    if (isZipBasedSpreadsheet($tmpName)) {
        return readXlsxRows($tmpName);
    }

    $rows = readDelimitedRows($tmpName);
    if (count($rows) > 0) {
        return $rows;
    }

    $rows = readHtmlTableRows($tmpName);
    if (count($rows) > 0) {
        return $rows;
    }

    throw new RuntimeException('The file could not be read. Keep the same column format and upload it as any spreadsheet or text file.');
}

function readCsvRows(string $filePath): array
{
    return readDelimitedRows($filePath);
}

function readDelimitedRows(string $filePath): array
{
    $content = @file_get_contents($filePath);
    if ($content === false) {
        throw new RuntimeException('Unable to read the import file');
    }

    $content = normalizeImportText($content);
    if ($content === '') {
        return [];
    }

    $delimiter = detectDelimitedFileSeparator($content);
    $lines = preg_split('/\r\n|\n|\r/', $content) ?: [];

    $rawRows = [];
    foreach ($lines as $line) {
        if (trim($line) === '') {
            continue;
        }

        $rawRows[] = array_map(static function ($value): string {
            return trim((string)$value);
        }, str_getcsv($line, $delimiter));
    }

    return convertTabularRowsToAssociative($rawRows);
}

function readHtmlTableRows(string $filePath): array
{
    if (!class_exists('DOMDocument')) {
        return [];
    }

    $content = @file_get_contents($filePath);
    if ($content === false) {
        return [];
    }

    $content = normalizeImportText($content);
    if ($content === '' || stripos($content, '<table') === false) {
        return [];
    }

    $dom = new DOMDocument();
    $previous = libxml_use_internal_errors(true);
    $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?>' . $content);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    if (!$loaded) {
        return [];
    }

    $rows = [];
    foreach ($dom->getElementsByTagName('tr') as $tr) {
        $cells = [];
        foreach ($tr->childNodes as $cell) {
            if (!in_array(strtolower($cell->nodeName), ['th', 'td'], true)) {
                continue;
            }
            $cells[] = trim((string)$cell->textContent);
        }
        if (!empty(array_filter($cells, static function ($value): bool {
            return trim((string)$value) !== '';
        }))) {
            $rows[] = $cells;
        }
    }

    return convertTabularRowsToAssociative($rows);
}

function normalizeImportText(string $content): string
{
    $content = str_replace("\0", '', $content);

    if (function_exists('mb_detect_encoding') && function_exists('mb_convert_encoding')) {
        $encoding = mb_detect_encoding($content, ['UTF-8', 'UTF-16', 'UTF-16LE', 'UTF-16BE', 'Windows-1252', 'ISO-8859-1'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        }
    }

    if (strncmp($content, "\xEF\xBB\xBF", 3) === 0) {
        $content = substr($content, 3);
    }

    return trim($content);
}

function detectDelimitedFileSeparator(string $content): string
{
    $sampleLines = preg_split('/\r\n|\n|\r/', $content) ?: [];
    $sampleLines = array_values(array_filter(array_map('trim', array_slice($sampleLines, 0, 10)), static function ($line): bool {
        return $line !== '';
    }));

    if (count($sampleLines) === 0) {
        return ',';
    }

    $candidates = [",", "\t", ";", "|"];
    $bestDelimiter = ',';
    $bestScore = -1;

    foreach ($candidates as $candidate) {
        $score = 0;
        foreach ($sampleLines as $line) {
            $score += substr_count($line, $candidate);
        }

        if ($score > $bestScore) {
            $bestScore = $score;
            $bestDelimiter = $candidate;
        }
    }

    return $bestDelimiter;
}

function isZipBasedSpreadsheet(string $filePath): bool
{
    $handle = @fopen($filePath, 'rb');
    if ($handle === false) {
        return false;
    }

    $signature = (string)fread($handle, 4);
    fclose($handle);

    return $signature === "PK\x03\x04" || $signature === "PK\x05\x06" || $signature === "PK\x07\x08";
}

function readXlsxRows(string $filePath): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('ZipArchive is not available on this server, so .xlsx imports are not supported');
    }

    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) {
        throw new RuntimeException('Unable to open the .xlsx file');
    }

    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    if ($sheetXml === false) {
        $zip->close();
        throw new RuntimeException('The first worksheet could not be read from the .xlsx file');
    }

    $sharedStrings = [];
    $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($sharedStringsXml !== false) {
        $sharedXmlRaw = simplexml_load_string($sharedStringsXml);
        if ($sharedXmlRaw !== false) {
            $sharedNamespaces = $sharedXmlRaw->getNamespaces(true);
            $sharedXml = isset($sharedNamespaces['']) ? $sharedXmlRaw->children($sharedNamespaces['']) : $sharedXmlRaw;

            foreach ($sharedXml->si as $stringItem) {
                if (isset($stringItem->t)) {
                    $sharedStrings[] = (string)$stringItem->t;
                    continue;
                }

                $buffer = '';
                foreach ($stringItem->r as $run) {
                    $buffer .= (string)$run->t;
                }
                $sharedStrings[] = $buffer;
            }
        }
    }

    $sheetRaw = simplexml_load_string($sheetXml);
    $zip->close();

    if ($sheetRaw === false) {
        throw new RuntimeException('The .xlsx worksheet could not be parsed');
    }

    $sheetNamespaces = $sheetRaw->getNamespaces(true);
    $sheet = isset($sheetNamespaces['']) ? $sheetRaw->children($sheetNamespaces['']) : $sheetRaw;

    if (!isset($sheet->sheetData)) {
        throw new RuntimeException('The .xlsx worksheet could not be parsed');
    }

    $rows = [];
    foreach ($sheet->sheetData->row as $row) {
        $currentRow = [];
        $nextIndex = 0;

        foreach ($row->c as $cell) {
            $reference = (string)($cell['r'] ?? '');
            $columnIndex = excelColumnIndex($reference);
            while ($nextIndex < $columnIndex) {
                $currentRow[] = '';
                $nextIndex++;
            }

            $value = '';
            $type = (string)($cell['t'] ?? '');

            if ($type === 'inlineStr' && isset($cell->is->t)) {
                $value = (string)$cell->is->t;
            } elseif (isset($cell->v)) {
                $value = (string)$cell->v;
                if ($type === 's') {
                    $value = $sharedStrings[(int)$value] ?? '';
                }
            }

            $currentRow[] = trim($value);
            $nextIndex++;
        }

        $rows[] = $currentRow;
    }

    return convertTabularRowsToAssociative($rows);
}

function excelColumnIndex(string $reference): int
{
    if ($reference === '') {
        return 0;
    }

    if (!preg_match('/^[A-Z]+/i', $reference, $matches)) {
        return 0;
    }

    $letters = strtoupper($matches[0]);
    $index = 0;
    $length = strlen($letters);
    for ($i = 0; $i < $length; $i++) {
        $index = ($index * 26) + (ord($letters[$i]) - 64);
    }

    return max(0, $index - 1);
}

function convertTabularRowsToAssociative(array $rawRows): array
{
    $filteredRows = [];
    foreach ($rawRows as $row) {
        $hasContent = false;
        foreach ($row as $cell) {
            if (trim((string)$cell) !== '') {
                $hasContent = true;
                break;
            }
        }
        if ($hasContent) {
            $filteredRows[] = $row;
        }
    }

    if (count($filteredRows) === 0) {
        return [];
    }

    $headerIndex = findHeaderRowIndex($filteredRows);
    $headerRow = $filteredRows[$headerIndex] ?? $filteredRows[0];
    $dataRows = array_slice($filteredRows, $headerIndex + 1);
    $headers = array_map('normalizeHeaderKey', $headerRow);

    $rows = [];
    foreach ($dataRows as $row) {
        $item = [];
        foreach ($headers as $index => $header) {
            if ($header === '') {
                continue;
            }
            $item[$header] = trim((string)($row[$index] ?? ''));
        }
        if (!empty(array_filter($item, static function ($value) {
            return trim((string)$value) !== '';
        }))) {
            $rows[] = $item;
        }
    }

    return $rows;
}

function findHeaderRowIndex(array $rows): int
{
    foreach ($rows as $index => $row) {
        $normalized = array_map('normalizeHeaderKey', array_map(static function ($value): string {
            return trim((string)$value);
        }, $row));

        $recognized = array_intersect($normalized, [
            'name',
            'firstname',
            'lastname',
            'gender',
            'address',
            'contact_number',
            'gmail',
            'fb_account',
            'guardians_contact_number',
            'flag_group',
        ]);

        if (count($recognized) >= 3) {
            return $index;
        }
    }

    return 0;
}

function normalizeHeaderKey(string $header): string
{
    $normalized = strtolower(trim($header));
    $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized) ?? '';
    $normalized = trim($normalized, '_');

    return match ($normalized) {
        'no', 'no_' => '',
        'name', 'student_name', 'full_name' => 'name',
        'first_name', 'firstname', 'given_name' => 'firstname',
        'middle_name', 'middlename' => 'middlename',
        'last_name', 'lastname', 'surname', 'family_name' => 'lastname',
        'gmail', 'gmail_account', 'email_address', 'email' => 'gmail',
        'contact_number', 'contact_no', 'mobile_number', 'phone_number', 'phone' => 'contact_number',
        'guardian', 'guardian_phone', 'guardian_no', 'guardian_contact_no', 'guardian_contact_number', 'guardian_s_contact_no', 'guardians_contact_no', 'guardians_contact_number' => 'guardians_contact_number',
        'facebook', 'facebook_name', 'fb', 'fbname', 'fb_account' => 'fb_account',
        'birthday', 'date_of_birth' => 'birth_date',
        'flag', 'group_flag' => 'flag_group',
        default => $normalized,
    };
}

function normalizeDateValue($value): ?string
{
    $text = trim((string)$value);
    if ($text === '') {
        return null;
    }

    if (is_numeric($text)) {
        $serial = (int)$text;
        if ($serial > 20000) {
            $timestamp = ($serial - 25569) * 86400;
            return gmdate('Y-m-d', $timestamp);
        }
    }

    $timestamp = strtotime($text);
    if ($timestamp === false) {
        return null;
    }

    return date('Y-m-d', $timestamp);
}

function normalizeGender($value): ?string
{
    $text = strtolower(trim((string)$value));
    return match ($text) {
        'male', 'm' => 'Male',
        'female', 'f' => 'Female',
        'other' => 'Other',
        default => null,
    };
}

function normalizeFlagGroup($value): ?string
{
    $text = strtolower(trim((string)$value));
    $text = str_replace([' ', '-'], '_', $text);

    $aliases = [
        'gratefulness' => 'greatfulness',
        'gratitude' => 'greatfulness',
        'selfcontrol' => 'self_control',
    ];

    if (isset($aliases[$text])) {
        $text = $aliases[$text];
    }

    $allowed = ['faithfulness', 'kindness', 'peace', 'love', 'self_control', 'joy', 'greatfulness', 'gentleness', 'patience'];
    return in_array($text, $allowed, true) ? $text : null;
}

function splitFullName(string $fullName): array
{
    $fullName = trim(preg_replace('/\s+/', ' ', $fullName) ?? $fullName);
    if ($fullName === '') {
        return [
            'first_name' => '',
            'middle_name' => '',
            'last_name' => '',
        ];
    }

    $parts = explode(' ', $fullName);
    if (count($parts) === 1) {
        return [
            'first_name' => $parts[0],
            'middle_name' => '',
            'last_name' => $parts[0],
        ];
    }

    $firstName = array_shift($parts) ?: '';
    $lastName = array_pop($parts) ?: '';
    $middleName = implode(' ', $parts);

    return [
        'first_name' => $firstName,
        'middle_name' => $middleName,
        'last_name' => $lastName,
    ];
}

function cleanText($value): string
{
    return trim((string)$value);
}

function cleanNullableText($value): ?string
{
    $text = trim((string)$value);
    return $text === '' ? null : $text;
}

function inferAcademicYearFromDate(string $date): string
{
    $timestamp = strtotime($date);
    if ($timestamp === false) {
        $timestamp = time();
    }

    $year = (int)date('Y', $timestamp);
    $month = (int)date('n', $timestamp);
    if ($month >= 8) {
        return $year . '-' . ($year + 1);
    }

    return ($year - 1) . '-' . $year;
}

function normalizeBatchNumber(string $value): string
{
    $value = strtoupper(trim($value));
    $value = preg_replace('/\s+/', '-', $value) ?? '';
    $value = preg_replace('/[^A-Z0-9-]/', '', $value) ?? '';
    return substr($value, 0, 30);
}

function extractBatchYear(string $batchNumber): string
{
    if (preg_match('/(\d{4})/', $batchNumber, $matches) === 1) {
        return $matches[1];
    }

    return '';
}

function inferBatchNumberFromAcademicYear(string $academicYear, int $yearLevel): string
{
    if (preg_match('/(\d{4})/', $academicYear, $matches) === 1) {
        $startYear = (int)$matches[1];
    } else {
        $startYear = (int)date('Y');
    }

    $normalizedYearLevel = max(1, $yearLevel);
    return (string)($startYear - ($normalizedYearLevel - 1));
}

function validateEnrollmentWindow(PDO $pdo, int $courseId, string $enrollmentDate): void
{
    $settingsStmt = $pdo->query('SELECT strict_enrollment_windows FROM enrollment_settings WHERE id = 1 LIMIT 1');
    $settings = $settingsStmt ? $settingsStmt->fetch(PDO::FETCH_ASSOC) : null;
    $strict = isset($settings['strict_enrollment_windows']) ? (bool)(int)$settings['strict_enrollment_windows'] : false;

    if (!$strict) {
        return;
    }

    $scheduleStmt = $pdo->prepare('SELECT enrollment_start_date, enrollment_end_date FROM course_enrollment_schedule WHERE course_id = ? LIMIT 1');
    $scheduleStmt->execute([$courseId]);
    $schedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);

    if (!$schedule) {
        return;
    }

    // Compare using date part only, since enrollment_date from import is date-only
    $enrollDay = substr($enrollmentDate, 0, 10);
    $windowStartDay = substr((string)$schedule['enrollment_start_date'], 0, 10);
    $windowEndDay = substr((string)$schedule['enrollment_end_date'], 0, 10);

    if ($enrollDay < $windowStartDay || $enrollDay > $windowEndDay) {
        throw new RuntimeException('The selected enrollment date is outside the configured enrollment window for this course');
    }
}

function generateStudentId(PDO $pdo, string $batchNumber = ''): string
{
    $year = (string)date('Y');
    if (preg_match('/(\d{4})/', $batchNumber, $matches) === 1) {
        $year = $matches[1];
    }

    $stmt = $pdo->prepare('SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1');
    $stmt->execute([$year . '%']);
    $lastStudentId = (string)($stmt->fetchColumn() ?: '');

    $next = 1;
    if (preg_match('/^\d{4}-?(\d{4})$/', $lastStudentId, $matches) === 1) {
        $next = ((int)$matches[1]) + 1;
    }

    return sprintf('%s%04d', $year, $next);
}

function ensureStudentColumns(PDO $pdo): void
{
    $columns = getTableColumns($pdo, 'students');

    if (!in_array('guardian_contact', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone');
    }

    if (!in_array('fb_name', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact');
    }

    if (!in_array('batch_number', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN batch_number VARCHAR(30) NULL AFTER current_academic_year');
    }

    if (!in_array('flag_group', $columns, true)) {
        $pdo->exec('ALTER TABLE students ADD COLUMN flag_group ENUM("faithfulness", "kindness", "peace", "love", "self_control", "joy", "greatfulness", "gentleness", "patience") NULL AFTER batch_number');
    } else {
        $pdo->exec('ALTER TABLE students MODIFY COLUMN flag_group ENUM("faithfulness", "kindness", "peace", "love", "self_control", "joy", "greatfulness", "gentleness", "patience") NULL');
    }
}

function getTableColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    $stmt->execute();
    return array_map(static function (array $column): string {
        return $column['Field'];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}
