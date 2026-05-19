# Enrollment Lifecycle Testing - Implementation & Verification Guide

## Executive Summary

This document covers the complete testing implementation for the enrollment lifecycle system with semester progression, re-enrollment approval, and graduation handling. 

**Key Change**: Graduation logic has been implemented in `api/student_year_progression.php` to properly handle 4th year 2nd semester students.

---

## ✅ Implementation Completed

### 1. Graduation Logic (FIXED)
**File**: `api/student_year_progression.php` (Lines 137-195)

**What was changed**:
- Split semester 2 completion logic into two separate paths:
  - **Path 1: 4th Year Students** → Marked as graduated
  - **Path 2: Year 1-3 Students** → Advanced to next year

**Implementation Details**:
```
When action=trigger_semester_end AND semester=2:

For year_level = 4:
  - UPDATE status = "graduated"
  - UPDATE graduated_at = NOW()
  - UPDATE is_account_active = 0
  - NO returning enrollee created
  - Student moved to Records/Graduated section

For year_level < 4:
  - Increment year_level by 1
  - Set current_semester = 1
  - Set progression_status = "pending_progression"
  - CREATE returning enrollee with status="pending"
  - Student ready for re-enrollment approval
```

### 2. Idempotency (VERIFIED SAFE)
**Files**: `api/enrollees_approve.php` and `api/enrollees_bulk_approve.php`

**How it works**:
- Single approval: WHERE status IN ("pre-registered", "enrolled", "registered")
  - After approval, status="approved", so second call returns 0 rows
  - Safe from duplicate student creation
  
- Bulk approval: Includes error handling for each enrollee
  - Failed enrollees recorded in errors array
  - Partial success supported

- Returning enrollee: Uses unique constraint + ON DUPLICATE KEY UPDATE
  - Re-running creates no duplicates
  - Updates existing record instead

---

## 📋 Test Scenarios

### Scenario 1: New Applicant Pre-Registration (Regression Test)
**Purpose**: Verify new applicants can still pre-register and be approved

**Expected Flow**:
1. Student pre-registers via `/pre_reg.php`
2. Pre-reg record created with status="pre-registered", enrollment_type="new", year_level=1
3. Admin approves in UI (Enrollees page)
4. Student record created with:
   - status = "active"
   - progression_status = "enrolled"
   - year_level = 1
   - current_semester = 1
   - current_academic_year = "2025-2026"
5. Subjects auto-assigned for year 1 semester 1

**Verification Queries**:
```sql
-- Step 1: Check pre-reg
SELECT * FROM enrollees WHERE status='pre-registered' LIMIT 1;

-- Step 2: Check approved student
SELECT id, status, progression_status, year_level, current_semester 
FROM students WHERE status='active' AND progression_status='enrolled' 
ORDER BY id DESC LIMIT 1;

-- Step 3: Verify subjects
SELECT COUNT(*) FROM student_enrolled_subjects ses 
INNER JOIN curriculum cu ON cu.id=ses.curriculum_id 
WHERE ses.student_id=<STUDENT_ID> AND cu.year_level=1 AND cu.semester=1;
```

---

### Scenario 2: End 1st Semester → Re-enroll
**Purpose**: Verify semester progression within same year

**Expected Flow**:
1. Student enrolled in year 1, semester 1
2. Admin clicks "End 1st Sem"
3. Student status updated:
   - current_semester = 2
   - progression_status = "pending_progression"
   - year_level = 1 (unchanged)
4. Returning enrollee created:
   - enrollment_type = "returning"
   - status = "pending"
   - existing_student_id = student_id
5. Admin approves re-enrollment
6. Student status updated:
   - progression_status = "enrolled"
   - status = "active"
   - Subjects assigned for year 1 semester 2

**Verification Queries**:
```sql
-- After semester end
SELECT year_level, current_semester, progression_status 
FROM students WHERE id=<STUDENT_ID>;
-- Expected: (1, 2, 'pending_progression')

-- Check returning enrollee
SELECT * FROM enrollees WHERE enrollment_type='returning' 
AND status='pending' ORDER BY id DESC LIMIT 1;

-- After re-enroll
SELECT progression_status FROM students WHERE id=<STUDENT_ID>;
-- Expected: 'enrolled'

-- Check semester 2 subjects
SELECT COUNT(*) FROM student_enrolled_subjects ses 
INNER JOIN curriculum cu ON cu.id=ses.curriculum_id 
WHERE ses.student_id=<STUDENT_ID> AND cu.year_level=1 AND cu.semester=2;
```

---

### Scenario 3: End 2nd Semester → Re-enroll (Year Progression)
**Purpose**: Verify year advancement works correctly

**Expected Flow**:
1. Student enrolled in year 1, semester 2
2. Admin clicks "End 2nd Sem"
3. Student status updated:
   - year_level = 2
   - current_semester = 1
   - progression_status = "pending_progression"
4. Returning enrollee created for year 2
5. Admin approves re-enrollment
6. Student status updated:
   - year_level = 2
   - current_semester = 1
   - progression_status = "enrolled"
   - Subjects assigned for year 2 semester 1

**Verification Queries**:
```sql
-- After semester end
SELECT year_level, current_semester, progression_status 
FROM students WHERE id=<STUDENT_ID>;
-- Expected: (2, 1, 'pending_progression')

-- Check returning enrollee
SELECT year_level FROM enrollees WHERE enrollment_type='returning' 
AND status='pending' ORDER BY id DESC LIMIT 1;
-- Expected: 2

-- After re-enroll
SELECT year_level, current_semester, progression_status 
FROM students WHERE id=<STUDENT_ID>;
-- Expected: (2, 1, 'enrolled')

-- Verify year 2 semester 1 subjects
SELECT COUNT(*) FROM student_enrolled_subjects ses 
INNER JOIN curriculum cu ON cu.id=ses.curriculum_id 
WHERE ses.student_id=<STUDENT_ID> AND cu.year_level=2 AND cu.semester=1;
```

---

### Scenario 4: End 2nd Semester for 4th Year (Graduation)
**Purpose**: Verify 4th year students graduate and don't create re-enrollees

**Expected Flow**:
1. Student enrolled in year 4, semester 2
2. Admin clicks "End 2nd Sem"
3. Student status updated:
   - status = "graduated" ✅ (NEW)
   - graduated_at = NOW() ✅ (NEW)
   - is_account_active = 0 ✅ (NEW)
4. **NO returning enrollee created** ✅ (NEW)
5. Student appears in Records/Graduated section

**Verification Queries**:
```sql
-- After semester end
SELECT status, graduated_at, is_account_active 
FROM students WHERE id=<STUDENT_ID>;
-- Expected: ('graduated', <TIMESTAMP>, 0)

-- Verify NO re-enrollee
SELECT COUNT(*) FROM enrollees 
WHERE enrollment_type='returning' AND year_level=4;
-- Expected: 0

-- Check Records
SELECT * FROM students 
WHERE status='graduated' AND archived_at IS NULL ORDER BY id DESC LIMIT 1;
-- Should find the graduated student
```

---

### Scenario 5: Single Approval Idempotency
**Purpose**: Verify approving same enrollee twice is safe

**Expected Flow**:
1. Create pre-registration enrollee
2. First approval: succeeds, creates student record
3. Second approval: fails safely (enrollee status now "approved")
4. Database has only 1 student record (no duplicates)

**Verification Queries**:
```sql
-- After first approval
SELECT status FROM enrollees WHERE id=<ENROLLEE_ID>;
-- Expected: 'approved'

-- After second approval attempt
-- API should return error: "Enrollee not found or already processed"

-- Verify no duplicates
SELECT COUNT(*) FROM students WHERE email=<TEST_EMAIL>;
-- Expected: 1
```

---

### Scenario 6: Bulk Approval Idempotency
**Purpose**: Verify bulk approval doesn't duplicate-process already-approved enrollees

**Expected Flow**:
1. Create multiple pre-registration enrollees
2. First bulk approval: succeeds, creates student records
3. Second bulk approval: returns 0 approved (already processed)
4. Database has correct number of student records (no duplicates)

**Verification Queries**:
```sql
-- After first bulk approval
SELECT COUNT(*) FROM students WHERE email LIKE 'test_bulk_%';
-- Expected: <NUMBER_OF_ENROLLEES>

-- After second bulk approval
-- API should return approved_count: 0

-- Verify no duplicates
SELECT COUNT(*) FROM students WHERE email LIKE 'test_bulk_%';
-- Expected: <SAME_NUMBER> (not doubled)
```

---

## 🔧 Testing Files Created

### 1. ENROLLMENT_TEST.php
**Location**: `c:\xampp\htdocs\enrollment\ENROLLMENT_TEST.php`

**Purpose**: Automated PHP test suite with direct database operations

**Features**:
- 30+ test cases covering all scenarios
- Helper functions for assertions
- Automatic setup verification
- Pass/Fail summary

**Run via**:
```bash
php ENROLLMENT_TEST.php
```

**Output**: 
- Real-time test results with [✓ PASS] or [✗ FAIL] markers
- Summary showing pass/fail counts
- Error details for failed tests

---

### 2. ENROLLMENT_LIFECYCLE_TESTING.html
**Location**: `c:\xampp\htdocs\enrollment\ENROLLMENT_LIFECYCLE_TESTING.html`

**Purpose**: Interactive manual testing guide

**Features**:
- Step-by-step instructions for each test scenario
- Pre-formatted SQL queries (copy-paste ready)
- cURL commands for API testing
- Verification checklist
- Troubleshooting guide

**View via**:
```
http://localhost/enrollment/ENROLLMENT_LIFECYCLE_TESTING.html
```

---

## 📊 Database Schema Requirements

The system requires proper curriculum setup for all tests to pass:

```sql
-- Verify curriculum exists
SELECT DISTINCT year_level, semester, COUNT(*) as subjects
FROM curriculum 
WHERE course_id = <TEST_COURSE_ID>
GROUP BY year_level, semester
ORDER BY year_level, semester;

-- Should show: 8 rows (4 years × 2 semesters) with subjects in each
```

If curriculum is missing:
```bash
mysql -u root enrollment < database_migration.sql
mysql -u root enrollment < database_migration_reenroll.sql
```

---

## 🔍 Key Files Modified

### api/student_year_progression.php
**Change**: Separated year 4 graduation logic from normal progression

**Before**:
- All semester 2 completions treated the same
- Used CASE WHEN to cap year_level at 4
- Created re-enrollees for all students

**After**:
- Year 4 students: marked as graduated, no re-enrollee
- Year 1-3 students: advanced to next year, re-enrollee created
- Proper graduated_at timestamp tracking

### config/auth.php
**No changes needed** - Already has required helper functions

### api/enrollees_approve.php
**No changes** - Idempotency already handled safely via WHERE status checks

### api/enrollees_bulk_approve.php
**No changes** - Idempotency already handled via individual error handling

---

## ✅ Verification Checklist

Before marking tests as complete, verify:

- [ ] **Setup**: Database has courses, curriculum for years 1-4, and test admin user
- [ ] **TEST 1**: New pre-registration flow works, student created with year=1, sem=1
- [ ] **TEST 2**: End 1st sem → student moves to sem 2, re-enrollee created, re-enroll works
- [ ] **TEST 3**: End 2nd sem → student advances to year 2 sem 1, re-enrollee created with year=2
- [ ] **TEST 4**: End 2nd sem for year 4 → status=graduated, graduated_at set, NO re-enrollee
- [ ] **TEST 5**: Single approval idempotency - 2nd approval fails safely, no duplicate student
- [ ] **TEST 6**: Bulk approval idempotency - 2nd bulk returns 0, no duplicate students
- [ ] **UI**: Graduated students appear in Records/Graduated section
- [ ] **API**: All endpoints return correct status codes and messages
- [ ] **Database**: Activity logs show correct progression events

---

## 🚀 Next Steps

1. **Run Automated Tests**:
   ```bash
   cd c:\xampp\htdocs\enrollment
   php ENROLLMENT_TEST.php
   ```

2. **Follow Manual Testing Guide**:
   - Open `ENROLLMENT_LIFECYCLE_TESTING.html` in browser
   - Execute each test scenario step-by-step
   - Record results in checklist

3. **Fix Any Issues**:
   - Check error messages in test output
   - Consult troubleshooting section
   - Verify database state with provided SQL queries

4. **Document Results**:
   - Record pass/fail for each scenario
   - Note any edge cases or unexpected behavior
   - Update TESTING_GUIDE.md with final verification steps

---

## 📞 Support

If tests fail, check:

1. **Database Connection**: Can connect to enrollment DB?
2. **Curriculum Data**: Do curriculum records exist for all years/semesters?
3. **Admin User**: Is authenticated user an admin?
4. **Enrollment Settings**: Are windows configured correctly?
5. **Permissions**: Does API have required permissions?

See troubleshooting section in `ENROLLMENT_LIFECYCLE_TESTING.html` for solutions.

