<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/auth.php';
require_permission('curriculum', 'edit');

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

$courseCode = strtoupper(trim((string)($_POST['course_code'] ?? '')));
$yearLevel = isset($_POST['year_level']) ? (int)$_POST['year_level'] : 0;
$semester = isset($_POST['semester']) ? (int)$_POST['semester'] : 0;
$file = $_FILES['import_file'];

if ($courseCode === '' || $yearLevel <= 0 || !in_array($semester, [1, 2], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please select course, year level, and semester for the curriculum import']);
    exit;
}

if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($file['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Failed to upload the curriculum file']);
    exit;
}

$pdo = require __DIR__ . '/../config/db.php';

try {
    ensureProfessorColumnExists($pdo);
    ensureOfferColumnExists($pdo);

    $resolveCourse = $pdo->prepare('SELECT id FROM courses WHERE course_code = ? AND is_active = TRUE LIMIT 1');
    $resolveCourse->execute([$courseCode]);
    $courseId = (int)($resolveCourse->fetchColumn() ?: 0);

    if ($courseId <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Selected course was not found']);
        exit;
    }

    $rows = loadImportRows($file);
    if (count($rows) === 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'The uploaded file does not contain any curriculum rows']);
        exit;
    }

    $checkDup = $pdo->prepare('SELECT id FROM curriculum WHERE course_id = ? AND subject_code = ? AND year_level = ? AND semester = ? LIMIT 1');
    $insert = $pdo->prepare('
        INSERT INTO curriculum
            (course_id, subject_code, subject_name, year_level, semester, units, description, prerequisites, professor_id, is_offered, is_active)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, TRUE)
    ');

    $created = 0;
    $skipped = 0;
    $errors = [];

    $pdo->beginTransaction();

    foreach ($rows as $index => $row) {
        $displayRow = $index + 2;
        $subjectCode = strtoupper(cleanText($row['subject_code'] ?? ''));
        $subjectDescription = cleanText($row['subject_description'] ?? ($row['subject_name'] ?? ($row['description'] ?? '')));
        $units = (int)trim((string)($row['units'] ?? '0'));
        $prerequisites = cleanNullableText($row['prerequisites'] ?? ($row['prerequisite'] ?? ''));

        if ($subjectCode === '' || $subjectDescription === '' || $units <= 0) {
            $errors[] = 'Row ' . $displayRow . ': Subject Code, Subject Description, and Units are required';
            continue;
        }

        $checkDup->execute([$courseId, $subjectCode, $yearLevel, $semester]);
        if ($checkDup->fetch(PDO::FETCH_ASSOC)) {
            $skipped++;
            continue;
        }

        $insert->execute([
            $courseId,
            $subjectCode,
            $subjectDescription,
            $yearLevel,
            $semester,
            $units,
            $subjectDescription,
            $prerequisites,
        ]);
        $created++;
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'created' => $created,
        'skipped' => $skipped,
        'error_count' => count($errors),
        'errors' => $errors,
        'message' => 'Curriculum import completed successfully',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to import curriculum',
        'details' => $e->getMessage(),
    ]);
}

function ensureProfessorColumnExists(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $stmt = $pdo->query("SHOW COLUMNS FROM curriculum LIKE 'professor_id'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE curriculum ADD COLUMN professor_id INT NULL AFTER prerequisites');
    }
}

function ensureOfferColumnExists(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $stmt = $pdo->query("SHOW COLUMNS FROM curriculum LIKE 'is_offered'");
    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->exec('ALTER TABLE curriculum ADD COLUMN is_offered TINYINT(1) NOT NULL DEFAULT 0 AFTER professor_id');
    }
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

        if (!empty(array_filter($item, static function ($value): bool {
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
            'subject_code',
            'subject_description',
            'units',
            'prerequisites',
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
        'subject_code', 'subjectcode', 'code' => 'subject_code',
        'subject_description', 'subjectdescription', 'subject_name', 'subject', 'description' => 'subject_description',
        'units', 'unit' => 'units',
        'prerequisite', 'prerequisites', 'prerequisites_optional', 'pre_requisite' => 'prerequisites',
        default => $normalized,
    };
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
