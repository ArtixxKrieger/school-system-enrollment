-- Database Migration: Calendar-Free Enrollment System

-- =====================================================
-- REMOVE ACADEMIC CALENDAR MODULE DATA
-- =====================================================

DELETE FROM role_permissions WHERE permission_module_slug = 'academic-calendar';
DELETE FROM permission_modules WHERE module_slug = 'academic-calendar';

-- =====================================================
-- REMOVE ACADEMIC CALENDAR REFERENCES FROM TABLES
-- =====================================================

SET @has_fk = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'enrollment'
      AND TABLE_NAME = 'course_enrollment_schedule'
      AND COLUMN_NAME = 'academic_calendar_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
);
SET @fk_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'enrollment'
      AND TABLE_NAME = 'course_enrollment_schedule'
      AND COLUMN_NAME = 'academic_calendar_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);
SET @sqlstmt = IF(@has_fk = 1, CONCAT('ALTER TABLE course_enrollment_schedule DROP FOREIGN KEY ', @fk_name), 'SELECT "No FK on course_enrollment_schedule.academic_calendar_id"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND INDEX_NAME = 'academic_calendar_id');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE course_enrollment_schedule DROP INDEX academic_calendar_id', 'SELECT "Index academic_calendar_id not found"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND INDEX_NAME = 'idx_ces_course');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE course_enrollment_schedule ADD INDEX idx_ces_course (course_id)', 'SELECT "Index idx_ces_course already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND INDEX_NAME = 'unique_course_calendar');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE course_enrollment_schedule DROP INDEX unique_course_calendar', 'SELECT "Index unique_course_calendar not found"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'course_enrollment_schedule' AND COLUMN_NAME = 'academic_calendar_id' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE course_enrollment_schedule DROP COLUMN academic_calendar_id', 'SELECT "Column course_enrollment_schedule.academic_calendar_id already removed"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND INDEX_NAME = 'unique_course');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE course_enrollment_schedule ADD UNIQUE KEY unique_course (course_id)', 'SELECT "Index unique_course already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'enrollment'
      AND TABLE_NAME = 'curriculum'
      AND COLUMN_NAME = 'academic_calendar_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
);
SET @fk_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'enrollment'
      AND TABLE_NAME = 'curriculum'
      AND COLUMN_NAME = 'academic_calendar_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);
SET @sqlstmt = IF(@has_fk = 1, CONCAT('ALTER TABLE curriculum DROP FOREIGN KEY ', @fk_name), 'SELECT "No FK on curriculum.academic_calendar_id"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'curriculum' AND INDEX_NAME = 'idx_curriculum_calendar');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE curriculum DROP INDEX idx_curriculum_calendar', 'SELECT "Index idx_curriculum_calendar not found"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'curriculum' AND INDEX_NAME = 'unique_subject');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE curriculum DROP INDEX unique_subject', 'SELECT "Index unique_subject not found"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'curriculum' AND COLUMN_NAME = 'academic_calendar_id' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE curriculum DROP COLUMN academic_calendar_id', 'SELECT "Column curriculum.academic_calendar_id already removed"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'curriculum' AND INDEX_NAME = 'unique_subject');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE curriculum ADD UNIQUE KEY unique_subject (course_id, subject_code)', 'SELECT "Index unique_subject already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'academic_calendar' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 1, 'DROP TABLE academic_calendar', 'SELECT "Table academic_calendar already removed"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- ENSURE CURRENT REQUIRED COLUMNS
-- =====================================================

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'phone' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER full_name', 'SELECT "Column users.phone already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'address' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone', 'SELECT "Column users.address already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER address', 'SELECT "Column users.birth_date already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'gender' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL AFTER birth_date', 'SELECT "Column users.gender already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_photo' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE users ADD COLUMN profile_photo MEDIUMTEXT NULL AFTER gender', 'SELECT "Column users.profile_photo already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'session_version' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE users ADD COLUMN session_version INT NULL AFTER last_login', 'SELECT "Column users.session_version already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'profile_photo' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE students ADD COLUMN profile_photo TEXT NULL AFTER address', 'SELECT "Column profile_photo already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'enrollees' AND COLUMN_NAME = 'guardian_contact' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE enrollees ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone', 'SELECT "Column enrollees.guardian_contact already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'enrollees' AND COLUMN_NAME = 'fb_name' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE enrollees ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact', 'SELECT "Column enrollees.fb_name already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'guardian_contact' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE students ADD COLUMN guardian_contact VARCHAR(20) NULL AFTER phone', 'SELECT "Column students.guardian_contact already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'fb_name' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE students ADD COLUMN fb_name VARCHAR(100) NULL AFTER guardian_contact', 'SELECT "Column students.fb_name already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'flag_group' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE students ADD COLUMN flag_group ENUM("faithfulness", "kindness", "peace", "love", "self_control", "joy", "greatfulness", "gentleness") NULL AFTER current_academic_year', 'SELECT "Column students.flag_group already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'student_type' AND TABLE_SCHEMA = 'enrollment');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE students ADD COLUMN student_type ENUM("regular", "irregular") NOT NULL DEFAULT "regular"', 'SELECT "Column students.student_type already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS student_curriculum_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  curriculum_id INT NOT NULL,
  source_year_level INT NOT NULL,
  source_semester INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  assigned_by INT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  UNIQUE KEY uniq_student_curriculum (student_id, curriculum_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

UPDATE users u
JOIN roles r ON r.name = u.role
SET u.role_id = r.id
WHERE u.role_id IS NULL;

UPDATE users u
JOIN students s ON s.email = u.email
SET u.full_name = COALESCE(NULLIF(u.full_name, ''), TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name))),
    u.phone = COALESCE(u.phone, s.phone),
    u.address = COALESCE(u.address, s.address),
    u.birth_date = COALESCE(u.birth_date, s.birth_date),
    u.gender = COALESCE(u.gender, s.gender),
    u.profile_photo = COALESCE(u.profile_photo, s.profile_photo);

INSERT INTO users (username, email, password, full_name, role, role_id, is_active)
SELECT 'admin', 'admin@example.com', '$2y$10$uxSefr4/ONOvh3xKITVQ8.hBL9FJbNjWYSKnhC4S0g/8QxUjGfOn6', 'System Administrator', 'admin', r.id, TRUE
FROM roles r
WHERE r.name = 'admin'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin' OR email = 'admin@example.com');

INSERT INTO users (username, email, password, full_name, role, role_id, is_active)
SELECT 'staff1', 'staff1@example.com', '$2y$10$K7Pxfq7XPE62a5VbP770K.1TwlxliNPq1gcux1QkVTV9D0MvHr8Fm', 'Staff User', 'staff', r.id, TRUE
FROM roles r
WHERE r.name = 'staff'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'staff1' OR email = 'staff1@example.com');

INSERT INTO users (username, email, password, full_name, role, role_id, is_active)
SELECT 'professor1', 'professor1@example.com', '$2y$10$IVwA1cizsDq/BcNJMIA1ue37dqdwEv4l.QMqaRcYviPi5ymSwhyUy', 'Professor User', 'professor', r.id, TRUE
FROM roles r
WHERE r.name = 'professor'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'professor1' OR email = 'professor1@example.com');

INSERT INTO users (username, email, password, full_name, role, role_id, is_active, phone, address, birth_date, gender, profile_photo)
SELECT s.student_id,
       s.email,
       '$2y$10$pGK5nWNIKc9gHGQ/cQBinOCQj8oEy1iue1Y.LiRy4W9sepW7WSP6m',
       TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)),
       'student',
       r.id,
       COALESCE(s.is_account_active, 1),
       s.phone,
       s.address,
       s.birth_date,
       s.gender,
       s.profile_photo
FROM students s
JOIN roles r ON r.name = 'student'
LEFT JOIN users u ON u.email = s.email
WHERE u.id IS NULL
  AND LOWER(COALESCE(s.status, 'active')) = 'active';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Migration completed successfully' AS Status;
SELECT COUNT(*) AS academic_calendar_table_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'academic_calendar';
SELECT COUNT(*) AS academic_calendar_module_exists
FROM permission_modules
WHERE module_slug = 'academic-calendar';

-- =====================================================
-- YEAR LEVEL PROGRESSION & SYSTEM CLOSE DATE
-- =====================================================

-- Add system_close_date to enrollment_settings
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'enrollment_settings' AND COLUMN_NAME = 'system_close_date');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE enrollment_settings ADD COLUMN system_close_date DATE NULL DEFAULT NULL AFTER auto_progression', 'SELECT "Column system_close_date already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Revert course_enrollment_schedule to per-course-only windows (remove year_level)
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND COLUMN_NAME = 'year_level');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE course_enrollment_schedule DROP COLUMN year_level', 'SELECT "Column year_level already removed"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND INDEX_NAME = 'unique_course_year');
SET @sqlstmt = IF(@exists = 1, 'ALTER TABLE course_enrollment_schedule DROP INDEX unique_course_year', 'SELECT "Index unique_course_year not found"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'course_enrollment_schedule' AND INDEX_NAME = 'unique_course');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE course_enrollment_schedule ADD UNIQUE KEY unique_course (course_id)', 'SELECT "Index unique_course already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add import_semester to students to track imported-in-2nd-sem students
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'import_semester');
SET @sqlstmt = IF(@exists = 0, 'ALTER TABLE students ADD COLUMN import_semester TINYINT(1) NULL DEFAULT NULL AFTER is_account_active', 'SELECT "Column import_semester already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add progression_status to students
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'progression_status');
SET @sqlstmt = IF(@exists = 0, "ALTER TABLE students ADD COLUMN progression_status ENUM('enrolled','pending_progression','approved_progression') DEFAULT 'enrolled' AFTER import_semester", 'SELECT "Column progression_status already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Year level progression migration completed' AS Status;

-- =============================================
-- Migration: Change DATE to DATETIME for time support
-- =============================================

ALTER TABLE course_enrollment_schedule MODIFY enrollment_start_date DATETIME NOT NULL;
ALTER TABLE course_enrollment_schedule MODIFY enrollment_end_date DATETIME NOT NULL;
ALTER TABLE enrollment_settings MODIFY system_close_date DATETIME NULL DEFAULT NULL;

SELECT 'Date-to-datetime migration completed' AS Status;
