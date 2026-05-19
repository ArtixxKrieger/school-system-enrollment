<?php
declare(strict_types=1);

/**
 * Comprehensive Enrollment Lifecycle Test Suite
 * Tests all major scenarios including semester progression, re-enrollment, and graduation
 */

header('Content-Type: text/plain; charset=utf-8');

$pdo = require __DIR__ . '/config/db.php';
$testResults = [];
$testNumber = 0;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function test(string $name, callable $fn, array &$results): void
{
    global $testNumber;
    $testNumber++;
    
    try {
        $fn();
        $results[$testNumber] = [
            'name' => $name,
            'status' => 'PASS',
            'error' => null
        ];
        echo "[✓ PASS] Test $testNumber: $name\n";
    } catch (Throwable $e) {
        $results[$testNumber] = [
            'name' => $name,
            'status' => 'FAIL',
            'error' => $e->getMessage()
        ];
        echo "[✗ FAIL] Test $testNumber: $name\n";
        echo "  Error: " . $e->getMessage() . "\n";
    }
}

function assertEquals($expected, $actual, string $message = ''): void
{
    if ($expected !== $actual) {
        throw new Exception(
            "Assertion failed: $message\n" .
            "Expected: " . var_export($expected, true) . "\n" .
            "Actual: " . var_export($actual, true)
        );
    }
}

function assertNotNull($value, string $message = ''): void
{
    if ($value === null) {
        throw new Exception("Assertion failed: Expected non-null value. $message");
    }
}

function assertNull($value, string $message = ''): void
{
    if ($value !== null) {
        throw new Exception("Assertion failed: Expected null value but got: " . var_export($value, true) . ". $message");
    }
}

function assertGreaterThan($threshold, $actual, string $message = ''): void
{
    if ($actual <= $threshold) {
        throw new Exception("Assertion failed: Expected > $threshold, got $actual. $message");
    }
}

function assertCount(int $expected, array $array, string $message = ''): void
{
    if (count($array) !== $expected) {
        throw new Exception("Assertion failed: Expected count $expected, got " . count($array) . ". $message");
    }
}

// ============================================================================
// TEST SETUP - Create test data
// ============================================================================

echo "\n=== ENROLLMENT LIFECYCLE TEST SUITE ===\n\n";
echo "Setting up test data...\n";

try {
    // Get or create a test course
    $courseStmt = $pdo->query('SELECT id FROM courses LIMIT 1');
    $courseRow = $courseStmt->fetch();
    if (!$courseRow) {
        throw new Exception('No courses found in database. Please create at least one course first.');
    }
    $testCourseId = (int)$courseRow['id'];

    // Get or create an admin user
    $adminStmt = $pdo->query("SELECT id FROM users WHERE role = 'admin' OR role = 'superadmin' LIMIT 1");
    $adminRow = $adminStmt->fetch();
    if (!$adminRow) {
        throw new Exception('No admin user found. Please create an admin user first.');
    }
    $adminId = (int)$adminRow['id'];

    // Verify curriculum exists for year 1-4, semester 1-2
    $curriculumCheck = $pdo->prepare('SELECT COUNT(*) as cnt FROM curriculum WHERE course_id = ? AND year_level = ? AND semester = ?');
    $curCount = 0;
    for ($y = 1; $y <= 4; $y++) {
        for ($s = 1; $s <= 2; $s++) {
            $curriculumCheck->execute([$testCourseId, $y, $s]);
            $r = $curriculumCheck->fetch();
            if ((int)$r['cnt'] > 0) {
                $curCount++;
            }
        }
    }
    
    if ($curCount < 8) {
        echo "WARNING: Not all curriculum levels/semesters exist. Found $curCount/8. Tests may be incomplete.\n";
    }

    echo "✓ Test setup complete. Using Course ID: $testCourseId, Admin ID: $adminId\n\n";

} catch (Throwable $e) {
    echo "ERROR: Setup failed - " . $e->getMessage() . "\n";
    exit(1);
}

// ============================================================================
// TEST SUITE 1: NEW APPLICANT PRE-REGISTRATION (Regression Test)
// ============================================================================

echo "--- TEST SUITE 1: New Applicant Pre-Registration (Regression) ---\n";

$preRegStudentId = null;
$preRegEnrolleeId = null;
$preRegEmail = 'test_prereg_' . time() . '@test.local';

test('Create new pre-registration enrollee', function() use ($pdo, $testCourseId, &$preRegEnrolleeId, $preRegEmail) {
    $stmt = $pdo->prepare("
        INSERT INTO enrollees (
            pre_reg_number, first_name, last_name, email, phone, course_id, 
            year_level, status, enrollment_type, application_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        'PRE-' . time(),
        'PreReg',
        'Student',
        $preRegEmail,
        '09123456789',
        $testCourseId,
        1,
        'pre-registered',
        'new'
    ]);
    $preRegEnrolleeId = (int)$pdo->lastInsertId();
    
    assertGreaterThan(0, $preRegEnrolleeId, 'Enrollee ID should be generated');
}, $testResults);

test('Verify new pre-reg enrollee has correct initial state', function() use ($pdo, $preRegEnrolleeId) {
    $stmt = $pdo->prepare('SELECT status, enrollment_type, year_level FROM enrollees WHERE id = ?');
    $stmt->execute([$preRegEnrolleeId]);
    $enrollee = $stmt->fetch();
    
    assertEquals('pre-registered', $enrollee['status'], 'Status should be pre-registered');
    assertEquals('new', $enrollee['enrollment_type'], 'Enrollment type should be new');
    assertEquals(1, $enrollee['year_level'], 'Year level should be 1');
}, $testResults);

test('Approve new pre-registration enrollee', function() use ($pdo, $testCourseId, $preRegEnrolleeId, $adminId, &$preRegStudentId, $preRegEmail) {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$preRegEmail]);
    $user = $stmt->fetch();
    
    // Simulate what enrollees_approve.php does
    $insertStmt = $pdo->prepare("
        INSERT INTO students (
            student_id, pre_reg_number, first_name, last_name, email, phone,
            course_id, year_level, status, progression_status, is_account_active,
            current_semester, current_academic_year, enrollment_date
        ) SELECT
            CONCAT(?, '-', LPAD(?, 5, '0')),
            pre_reg_number, first_name, last_name, email, phone,
            course_id, year_level, 'active', 'enrolled', 1, 1, '2025-2026', NOW()
        FROM enrollees WHERE id = ?
    ");
    
    $maxIdStmt = $pdo->query('SELECT COALESCE(MAX(CAST(SUBSTRING(student_id, POSITION("-" IN student_id) + 1) AS UNSIGNED)), 0) + 1 as next_num FROM students');
    $maxRow = $maxIdStmt->fetch();
    $nextNum = (int)$maxRow['next_num'];
    $courseCode = $pdo->query('SELECT code FROM courses WHERE id = ' . $testCourseId)->fetch()['code'] ?? 'TST';
    
    $insertStmt->execute([$courseCode, $nextNum, $preRegEnrolleeId]);
    $preRegStudentId = (int)$pdo->lastInsertId();
    
    $approveStmt = $pdo->prepare('UPDATE enrollees SET status = "approved", approved_date = NOW(), approved_by = ? WHERE id = ?');
    $approveStmt->execute([$adminId, $preRegEnrolleeId]);
    
    assertGreaterThan(0, $preRegStudentId, 'Student ID should be generated');
}, $testResults);

test('Verify new student has year 1, semester 1, status active', function() use ($pdo, $preRegStudentId) {
    $stmt = $pdo->prepare('SELECT year_level, current_semester, status, progression_status FROM students WHERE id = ?');
    $stmt->execute([$preRegStudentId]);
    $student = $stmt->fetch();
    
    assertEquals(1, $student['year_level'], 'Year level should be 1');
    assertEquals(1, $student['current_semester'], 'Semester should be 1');
    assertEquals('active', $student['status'], 'Status should be active');
    assertEquals('enrolled', $student['progression_status'], 'Progression status should be enrolled');
}, $testResults);

echo "\n";

// ============================================================================
// TEST SUITE 2: 1st Semester Progression
// ============================================================================

echo "--- TEST SUITE 2: End 1st Semester, Approve Re-enroll ---\n";

$year1Sem1StudentId = null;
$year1Sem1Student = null;
$year1Sem1ReenrollEnrolleeId = null;

test('Create 1st year 1st semester student for test', function() use ($pdo, $testCourseId, $adminId, &$year1Sem1StudentId, &$year1Sem1Student) {
    $stmt = $pdo->prepare("
        INSERT INTO students (
            student_id, pre_reg_number, first_name, last_name, email, phone,
            course_id, year_level, status, progression_status, is_account_active,
            current_semester, current_academic_year, enrollment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active', 'enrolled', 1, 1, '2025-2026', NOW())
    ");
    
    $testStudentId = 'Y1S1-' . time();
    $stmt->execute([
        $testStudentId, 'PRE-' . time(), 'Year1Sem1', 'Student', 
        'y1s1_' . time() . '@test.local', '09100000001', $testCourseId
    ]);
    
    $year1Sem1StudentId = (int)$pdo->lastInsertId();
    $fetchStmt = $pdo->prepare('SELECT * FROM students WHERE id = ?');
    $fetchStmt->execute([$year1Sem1StudentId]);
    $year1Sem1Student = $fetchStmt->fetch();
    
    assertNotNull($year1Sem1Student, 'Student should exist');
}, $testResults);

test('Trigger end of 1st semester', function() use ($pdo, $year1Sem1StudentId, $year1Sem1Student) {
    $stmt = $pdo->prepare('
        UPDATE students
        SET current_semester = 2,
            progression_status = "pending_progression",
            status = "active",
            is_account_active = 1
        WHERE id = ? AND current_semester = 1 AND status = "active"
    ');
    $stmt->execute([$year1Sem1StudentId]);
    
    assertGreaterThan(0, $stmt->rowCount(), 'Student should be updated to semester 2');
}, $testResults);

test('Verify student moved to 2nd semester with pending_progression', function() use ($pdo, $year1Sem1StudentId) {
    $stmt = $pdo->prepare('SELECT current_semester, progression_status, year_level FROM students WHERE id = ?');
    $stmt->execute([$year1Sem1StudentId]);
    $student = $stmt->fetch();
    
    assertEquals(2, $student['current_semester'], 'Semester should be 2');
    assertEquals('pending_progression', $student['progression_status'], 'Status should be pending_progression');
    assertEquals(1, $student['year_level'], 'Year level should still be 1');
}, $testResults);

test('Verify returning enrollee created in re-enrollment queue', function() use ($pdo, $year1Sem1Student, &$year1Sem1ReenrollEnrolleeId) {
    $stmt = $pdo->prepare('
        SELECT id FROM enrollees 
        WHERE existing_student_id = ? 
        AND enrollment_type = "returning"
        AND status = "pending"
        ORDER BY application_date DESC
        LIMIT 1
    ');
    $stmt->execute([$year1Sem1Student['student_id']]);
    $enrollee = $stmt->fetch();
    
    assertNotNull($enrollee, 'Returning enrollee should be created');
    $year1Sem1ReenrollEnrolleeId = (int)$enrollee['id'];
}, $testResults);

test('Approve re-enrollment for 1st semester completion student', function() use ($pdo, $year1Sem1ReenrollEnrolleeId, $adminId) {
    // Simulate what enrollees_approve.php does for returning students
    $getEnrolleeStmt = $pdo->prepare('SELECT existing_student_id, year_level FROM enrollees WHERE id = ?');
    $getEnrolleeStmt->execute([$year1Sem1ReenrollEnrolleeId]);
    $enrollee = $getEnrolleeStmt->fetch();
    
    $updateStmt = $pdo->prepare('
        UPDATE students
        SET status = "active",
            is_account_active = 1,
            progression_status = "enrolled",
            import_semester = NULL,
            year_level = ?,
            current_semester = 2,
            current_academic_year = "2025-2026",
            enrollment_date = NOW()
        WHERE student_id = ?
    ');
    $updateStmt->execute([$enrollee['year_level'], $enrollee['existing_student_id']]);
    
    $approveStmt = $pdo->prepare('UPDATE enrollees SET status = "approved", approved_date = NOW(), approved_by = ? WHERE id = ?');
    $approveStmt->execute([$adminId, $year1Sem1ReenrollEnrolleeId]);
    
    assertGreaterThan(0, $updateStmt->rowCount(), 'Student should be reactivated');
}, $testResults);

test('Verify student is now enrolled in 2nd semester', function() use ($pdo, $year1Sem1StudentId) {
    $stmt = $pdo->prepare('SELECT current_semester, progression_status, status, year_level FROM students WHERE id = ?');
    $stmt->execute([$year1Sem1StudentId]);
    $student = $stmt->fetch();
    
    assertEquals(2, $student['current_semester'], 'Semester should be 2');
    assertEquals('enrolled', $student['progression_status'], 'Status should be enrolled');
    assertEquals('active', $student['status'], 'Status should be active');
    assertEquals(1, $student['year_level'], 'Year level should still be 1');
}, $testResults);

test('Verify subjects assigned for 2nd semester', function() use ($pdo, $year1Sem1StudentId, $testCourseId) {
    $stmt = $pdo->prepare('
        SELECT COUNT(*) as cnt FROM student_enrolled_subjects ses
        INNER JOIN curriculum cu ON cu.id = ses.curriculum_id
        WHERE ses.student_id = ? AND cu.year_level = 1 AND cu.semester = 2
    ');
    $stmt->execute([$year1Sem1StudentId]);
    $result = $stmt->fetch();
    
    assertGreaterThan(0, (int)$result['cnt'], 'Subjects should be assigned for 2nd semester');
}, $testResults);

echo "\n";

// ============================================================================
// TEST SUITE 3: 2nd Semester Progression (Year Advancement)
// ============================================================================

echo "--- TEST SUITE 3: End 2nd Semester, Approve Re-enroll (Year Progression) ---\n";

$year1Sem2StudentId = null;
$year1Sem2Student = null;
$year1Sem2ReenrollEnrolleeId = null;

test('Create 1st year 2nd semester student for test', function() use ($pdo, $testCourseId, &$year1Sem2StudentId, &$year1Sem2Student) {
    $stmt = $pdo->prepare("
        INSERT INTO students (
            student_id, pre_reg_number, first_name, last_name, email, phone,
            course_id, year_level, status, progression_status, is_account_active,
            current_semester, current_academic_year, enrollment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active', 'enrolled', 1, 2, '2025-2026', NOW())
    ");
    
    $testStudentId = 'Y1S2-' . time();
    $stmt->execute([
        $testStudentId, 'PRE-' . time(), 'Year1Sem2', 'Student', 
        'y1s2_' . time() . '@test.local', '09100000002', $testCourseId
    ]);
    
    $year1Sem2StudentId = (int)$pdo->lastInsertId();
    $fetchStmt = $pdo->prepare('SELECT * FROM students WHERE id = ?');
    $fetchStmt->execute([$year1Sem2StudentId]);
    $year1Sem2Student = $fetchStmt->fetch();
    
    assertNotNull($year1Sem2Student, 'Student should exist');
}, $testResults);

test('Trigger end of 2nd semester (year advancement)', function() use ($pdo, $year1Sem2StudentId) {
    $stmt = $pdo->prepare('
        UPDATE students
        SET year_level = 2,
            current_semester = 1,
            progression_status = "pending_progression",
            status = "active",
            is_account_active = 1
        WHERE id = ? AND current_semester = 2 AND status = "active" AND year_level < 4
    ');
    $stmt->execute([$year1Sem2StudentId]);
    
    assertGreaterThan(0, $stmt->rowCount(), 'Student should be updated to year 2');
}, $testResults);

test('Verify student advanced to year 2, semester 1', function() use ($pdo, $year1Sem2StudentId) {
    $stmt = $pdo->prepare('SELECT year_level, current_semester, progression_status FROM students WHERE id = ?');
    $stmt->execute([$year1Sem2StudentId]);
    $student = $stmt->fetch();
    
    assertEquals(2, $student['year_level'], 'Year level should be 2');
    assertEquals(1, $student['current_semester'], 'Semester should be 1');
    assertEquals('pending_progression', $student['progression_status'], 'Status should be pending_progression');
}, $testResults);

test('Verify returning enrollee created for year 2', function() use ($pdo, $year1Sem2Student, &$year1Sem2ReenrollEnrolleeId) {
    $stmt = $pdo->prepare('
        SELECT id, year_level FROM enrollees 
        WHERE existing_student_id = ? 
        AND enrollment_type = "returning"
        AND status = "pending"
        ORDER BY application_date DESC
        LIMIT 1
    ');
    $stmt->execute([$year1Sem2Student['student_id']]);
    $enrollee = $stmt->fetch();
    
    assertNotNull($enrollee, 'Returning enrollee should be created');
    assertEquals(2, $enrollee['year_level'], 'Enrollee year_level should be 2');
    $year1Sem2ReenrollEnrolleeId = (int)$enrollee['id'];
}, $testResults);

test('Approve re-enrollment for year advancement', function() use ($pdo, $year1Sem2ReenrollEnrolleeId, $adminId) {
    $getEnrolleeStmt = $pdo->prepare('SELECT existing_student_id, year_level FROM enrollees WHERE id = ?');
    $getEnrolleeStmt->execute([$year1Sem2ReenrollEnrolleeId]);
    $enrollee = $getEnrolleeStmt->fetch();
    
    $updateStmt = $pdo->prepare('
        UPDATE students
        SET status = "active",
            is_account_active = 1,
            progression_status = "enrolled",
            import_semester = NULL,
            year_level = ?,
            current_semester = 1,
            current_academic_year = "2025-2026",
            enrollment_date = NOW()
        WHERE student_id = ?
    ');
    $updateStmt->execute([$enrollee['year_level'], $enrollee['existing_student_id']]);
    
    $approveStmt = $pdo->prepare('UPDATE enrollees SET status = "approved", approved_date = NOW(), approved_by = ? WHERE id = ?');
    $approveStmt->execute([$adminId, $year1Sem2ReenrollEnrolleeId]);
    
    assertGreaterThan(0, $updateStmt->rowCount(), 'Student should be reactivated');
}, $testResults);

test('Verify student is now year 2, semester 1, enrolled', function() use ($pdo, $year1Sem2StudentId) {
    $stmt = $pdo->prepare('SELECT year_level, current_semester, progression_status, status FROM students WHERE id = ?');
    $stmt->execute([$year1Sem2StudentId]);
    $student = $stmt->fetch();
    
    assertEquals(2, $student['year_level'], 'Year level should be 2');
    assertEquals(1, $student['current_semester'], 'Semester should be 1');
    assertEquals('enrolled', $student['progression_status'], 'Status should be enrolled');
    assertEquals('active', $student['status'], 'Status should be active');
}, $testResults);

test('Verify subjects assigned for year 2, semester 1', function() use ($pdo, $year1Sem2StudentId) {
    $stmt = $pdo->prepare('
        SELECT COUNT(*) as cnt FROM student_enrolled_subjects ses
        INNER JOIN curriculum cu ON cu.id = ses.curriculum_id
        WHERE ses.student_id = ? AND cu.year_level = 2 AND cu.semester = 1
    ');
    $stmt->execute([$year1Sem2StudentId]);
    $result = $stmt->fetch();
    
    assertGreaterThan(0, (int)$result['cnt'], 'Subjects should be assigned for year 2 semester 1');
}, $testResults);

echo "\n";

// ============================================================================
// TEST SUITE 4: Graduation (4th Year 2nd Semester)
// ============================================================================

echo "--- TEST SUITE 4: End 2nd Semester for 4th Year (Graduation) ---\n";

$year4StudentId = null;
$year4Student = null;

test('Create 4th year 2nd semester student for graduation test', function() use ($pdo, $testCourseId, &$year4StudentId, &$year4Student) {
    $stmt = $pdo->prepare("
        INSERT INTO students (
            student_id, pre_reg_number, first_name, last_name, email, phone,
            course_id, year_level, status, progression_status, is_account_active,
            current_semester, current_academic_year, enrollment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 4, 'active', 'enrolled', 1, 2, '2025-2026', NOW())
    ");
    
    $testStudentId = 'Y4S2-' . time();
    $stmt->execute([
        $testStudentId, 'PRE-' . time(), 'Year4Sem2', 'Grad', 
        'y4s2_' . time() . '@test.local', '09100000004', $testCourseId
    ]);
    
    $year4StudentId = (int)$pdo->lastInsertId();
    $fetchStmt = $pdo->prepare('SELECT * FROM students WHERE id = ?');
    $fetchStmt->execute([$year4StudentId]);
    $year4Student = $fetchStmt->fetch();
    
    assertNotNull($year4Student, 'Student should exist');
}, $testResults);

test('Trigger end of 2nd semester for 4th year student (graduation)', function() use ($pdo, $year4StudentId) {
    $stmt = $pdo->prepare('
        UPDATE students
        SET status = "graduated",
            progression_status = "enrolled",
            graduated_at = NOW(),
            is_account_active = 0
        WHERE id = ? AND current_semester = 2 AND year_level = 4 AND status = "active"
    ');
    $stmt->execute([$year4StudentId]);
    
    assertGreaterThan(0, $stmt->rowCount(), 'Student should be marked as graduated');
}, $testResults);

test('Verify student status is now graduated', function() use ($pdo, $year4StudentId) {
    $stmt = $pdo->prepare('SELECT status, graduated_at, is_account_active FROM students WHERE id = ?');
    $stmt->execute([$year4StudentId]);
    $student = $stmt->fetch();
    
    assertEquals('graduated', $student['status'], 'Status should be graduated');
    assertNotNull($student['graduated_at'], 'Graduated date should be set');
    assertEquals(0, $student['is_account_active'], 'Account should be deactivated');
}, $testResults);

test('Verify NO returning enrollee created for graduated student', function() use ($pdo, $year4Student) {
    $stmt = $pdo->prepare('
        SELECT COUNT(*) as cnt FROM enrollees 
        WHERE existing_student_id = ? 
        AND enrollment_type = "returning"
    ');
    $stmt->execute([$year4Student['student_id']]);
    $result = $stmt->fetch();
    
    assertEquals(0, $result['cnt'], 'No returning enrollee should be created for graduated student');
}, $testResults);

test('Verify graduated student appears in Records (mock)', function() use ($pdo, $year4StudentId) {
    $stmt = $pdo->prepare('
        SELECT * FROM students 
        WHERE id = ? AND status = "graduated" AND archived_at IS NULL
    ');
    $stmt->execute([$year4StudentId]);
    $student = $stmt->fetch();
    
    assertNotNull($student, 'Graduated student should be queryable from records');
}, $testResults);

echo "\n";

// ============================================================================
// TEST SUITE 5: Idempotency Testing
// ============================================================================

echo "--- TEST SUITE 5: Idempotency (Re-run Approval) ---\n";

$idempotentEnrolleeId = null;

test('Create enrollee for idempotency test', function() use ($pdo, $testCourseId, &$idempotentEnrolleeId) {
    $stmt = $pdo->prepare("
        INSERT INTO enrollees (
            pre_reg_number, first_name, last_name, email, phone, course_id, 
            year_level, status, enrollment_type, application_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        'IDEM-' . time(),
        'Idempotent',
        'Test',
        'idem_' . time() . '@test.local',
        '09100000005',
        $testCourseId,
        1,
        'pre-registered',
        'new'
    ]);
    $idempotentEnrolleeId = (int)$pdo->lastInsertId();
    
    assertGreaterThan(0, $idempotentEnrolleeId, 'Enrollee should be created');
}, $testResults);

test('Approve enrollee first time', function() use ($pdo, $idempotentEnrolleeId, $adminId) {
    $stmt = $pdo->prepare('UPDATE enrollees SET status = "approved", approved_date = NOW(), approved_by = ? WHERE id = ? AND status IN ("pre-registered", "enrolled", "registered")');
    $stmt->execute([$adminId, $idempotentEnrolleeId]);
    
    assertGreaterThan(0, $stmt->rowCount(), 'First approval should succeed');
}, $testResults);

test('Attempt to approve same enrollee again (should fail safely)', function() use ($pdo, $idempotentEnrolleeId, $adminId) {
    $stmt = $pdo->prepare('UPDATE enrollees SET status = "approved", approved_date = NOW(), approved_by = ? WHERE id = ? AND status IN ("pre-registered", "enrolled", "registered")');
    $stmt->execute([$adminId, $idempotentEnrolleeId]);
    
    assertEquals(0, $stmt->rowCount(), 'Second approval should not match (idempotent safe)');
}, $testResults);

test('Verify enrollee final status is still approved (not duplicated)', function() use ($pdo, $idempotentEnrolleeId) {
    $stmt = $pdo->prepare('SELECT status FROM enrollees WHERE id = ?');
    $stmt->execute([$idempotentEnrolleeId]);
    $result = $stmt->fetch();
    
    assertEquals('approved', $result['status'], 'Status should still be approved (not duplicated)');
}, $testResults);

echo "\n";

// ============================================================================
// TEST RESULTS SUMMARY
// ============================================================================

echo "=== TEST RESULTS SUMMARY ===\n\n";

$passCount = 0;
$failCount = 0;

foreach ($testResults as $num => $result) {
    if ($result['status'] === 'PASS') {
        $passCount++;
    } else {
        $failCount++;
        echo "FAILED TEST #{$num}: {$result['name']}\n";
        echo "  Error: {$result['error']}\n\n";
    }
}

echo "Total: " . ($passCount + $failCount) . " tests\n";
echo "Passed: $passCount\n";
echo "Failed: $failCount\n";

if ($failCount === 0) {
    echo "\n✓ ALL TESTS PASSED!\n";
} else {
    echo "\n✗ Some tests failed. Please review the errors above.\n";
}

echo "\n=== END OF TEST SUITE ===\n";
