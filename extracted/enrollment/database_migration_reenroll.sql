-- Migration: Add re-enrollment support for inactive students
-- Run this migration once on your database

-- Add enrollment_type to distinguish new pre-registrations from returning students
SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'enrollees' AND COLUMN_NAME = 'enrollment_type'
);
SET @sqlstmt = IF(@exists = 0,
    "ALTER TABLE enrollees ADD COLUMN enrollment_type ENUM('new', 'returning') NOT NULL DEFAULT 'new' AFTER status",
    'SELECT "Column enrollees.enrollment_type already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add student_id reference for returning students (their existing student ID)
SET @exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'enrollees' AND COLUMN_NAME = 'existing_student_id'
);
SET @sqlstmt = IF(@exists = 0,
    'ALTER TABLE enrollees ADD COLUMN existing_student_id VARCHAR(20) NULL AFTER pre_reg_number',
    'SELECT "Column enrollees.existing_student_id already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mark all existing enrollees as 'new' by default (already handled by DEFAULT)
-- Mark any with non-PRE pre_reg_numbers as 'returning' (legacy data)
UPDATE enrollees SET enrollment_type = 'returning'
WHERE pre_reg_number NOT LIKE 'PRE-%' AND enrollment_type = 'new';

-- Fix curriculum unique key to allow same subject code across different year/semester
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'curriculum' AND INDEX_NAME = 'unique_subject'
);
SET @old_key_cols = IF(@idx_exists > 0, (
    SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'curriculum' AND INDEX_NAME = 'unique_subject'
), '');
-- Drop old narrow key and recreate with year_level + semester only when needed
SET @sqlstmt = IF(
    @idx_exists > 0 AND @old_key_cols NOT LIKE '%year_level%',
    'ALTER TABLE curriculum DROP INDEX unique_subject, ADD UNIQUE KEY unique_subject (course_id, subject_code, year_level, semester)',
    IF(
        @idx_exists = 0,
        'ALTER TABLE curriculum ADD UNIQUE KEY unique_subject (course_id, subject_code, year_level, semester)',
        'SELECT "curriculum unique_subject index already correct"'
    )
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Expand subject_code column to support longer codes (was VARCHAR(10))
SET @col_type = (
    SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'enrollment' AND TABLE_NAME = 'curriculum' AND COLUMN_NAME = 'subject_code'
);
SET @sqlstmt = IF(
    @col_type = 'varchar(10)',
    'ALTER TABLE curriculum MODIFY subject_code VARCHAR(50) NOT NULL',
    'SELECT "curriculum.subject_code already correct"'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
