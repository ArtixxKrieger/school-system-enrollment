CREATE DATABASE IF NOT EXISTS enrollment;
USE enrollment;
-- USERS TABLE
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    address TEXT NULL,
    birth_date DATE NULL,
    gender VARCHAR(20) NULL,
    profile_photo MEDIUMTEXT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    role_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    session_version INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Role management tables
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permission_modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module_slug VARCHAR(64) NOT NULL UNIQUE,
    module_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_module_slug VARCHAR(64) NOT NULL,
    action ENUM('view','create','edit','delete','approve') NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role_id, permission_module_slug, action),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

INSERT INTO permission_modules (module_slug, module_name, description) VALUES
('dashboard', 'Dashboard', 'Access and view the system dashboard'),
('student', 'Students', 'Manage student records and enrollment data'),
('course', 'Courses', 'Manage course catalog and course details'),
('enrollment', 'Enrollment', 'Manage enrolled students and enrollment details'),
('enrollees', 'Enrollees', 'Manage pending and approved enrollees'),
('curriculum', 'Curriculum', 'Manage curriculum and subject schedules'),
('schedule', 'Schedule', 'Manage class schedules and faculty assignments'),
('professor', 'Professors', 'Manage professor information and assignments'),
('administrator', 'Administrators', 'Manage administrator accounts and system access'),
('rolemanagement', 'Role Management', 'Manage system roles and permissions'),
('settings', 'Settings', 'Manage account and system configuration settings'),
('reports', 'Reports', 'View and generate system reports');

INSERT INTO roles (name, description, is_system, is_active) VALUES
('superadmin', 'Full system access with all permissions', TRUE, TRUE),
('admin', 'Administrator access with broad privileges', TRUE, TRUE),
('staff', 'Staff access with limited editing and enrollment privileges', TRUE, TRUE),
('professor', 'Professor access with schedule and student view permissions', TRUE, TRUE),
('student', 'Student access with dashboard and curriculum view only', TRUE, TRUE);

-- Insert sample user accounts for testing
INSERT INTO users (username, email, password, full_name, role, is_active) VALUES
('superadmin', 'hazelantazo4@gmail.com', '$2y$10$oGQX5vuBPFvTy7UPtvHXPu2QOAtXZJrMctrUPYXiwnWARSh0SYVby', 'Super Admin', 'superadmin', TRUE),
('admin', 'admin@gmail.com', '$2y$10$uxSefr4/ONOvh3xKITVQ8.hBL9FJbNjWYSKnhC4S0g/8QxUjGfOn6', 'System Administrator', 'admin', TRUE),
('staff1', 'staff1@gmail.com', '$2y$10$K7Pxfq7XPE62a5VbP770K.1TwlxliNPq1gcux1QkVTV9D0MvHr8Fm', 'Staff User', 'staff', TRUE),
('professor1', 'professor1@gmail.com', '$2y$10$IVwA1cizsDq/BcNJMIA1ue37dqdwEv4l.QMqaRcYviPi5ymSwhyUy', 'Professor User', 'professor', TRUE),
('student1', 'student1@gmail.com', '$2y$10$pGK5nWNIKc9gHGQ/cQBinOCQj8oEy1iue1Y.LiRy4W9sepW7WSP6m', 'Student User', 'student', TRUE);

ALTER TABLE users
    ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

UPDATE users u
SET u.role_id = (
    SELECT r.id FROM roles r WHERE r.name = u.role
)
WHERE u.role IN ('superadmin', 'admin', 'staff', 'professor', 'student');

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'view', TRUE
FROM roles r
CROSS JOIN permission_modules pm
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'create', TRUE
FROM roles r
CROSS JOIN permission_modules pm
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'edit', TRUE
FROM roles r
CROSS JOIN permission_modules pm
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'delete', TRUE
FROM roles r
CROSS JOIN permission_modules pm
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'approve', TRUE
FROM roles r
CROSS JOIN permission_modules pm
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'view', TRUE
FROM roles r
JOIN permission_modules pm ON pm.module_slug IN ('dashboard','curriculum','settings')
WHERE r.name = 'staff'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'view', TRUE
FROM roles r
JOIN permission_modules pm ON pm.module_slug IN ('dashboard','curriculum','settings','student')
WHERE r.name = 'professor'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

INSERT INTO role_permissions (role_id, permission_module_slug, action, is_allowed)
SELECT r.id, pm.module_slug, 'view', TRUE
FROM roles r
JOIN permission_modules pm ON pm.module_slug IN ('dashboard','curriculum','settings')
WHERE r.name = 'student'
ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed);

-- COURSES TABLE
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- ENROLLEES TABLE (Pre-registered students)
CREATE TABLE enrollees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pre_reg_number VARCHAR(20) NOT NULL UNIQUE,
    existing_student_id VARCHAR(20) NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    guardian_contact VARCHAR(20),
    fb_name VARCHAR(100),
    address TEXT,
    birth_date DATE,
    gender ENUM('Male', 'Female', 'Other'),
    password_hash VARCHAR(255) NULL,
    course_id INT,
    year_level INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pre-registered',
    enrollment_type VARCHAR(20) DEFAULT 'new',
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL,
    approved_by INT NULL,
    notes TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);
-- STUDENTS TABLE (Enrolled students)
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    pre_reg_number VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    guardian_contact VARCHAR(20),
    fb_name VARCHAR(100),
    address TEXT,
    profile_photo TEXT,
    birth_date DATE,
    gender ENUM('Male', 'Female', 'Other'),
    course_id INT NOT NULL,
    year_level INT DEFAULT 1,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finance_status ENUM('fully_paid', 'down_payment', 'promisory') DEFAULT 'fully_paid',
    finance_total DECIMAL(10,2) DEFAULT 0.00,
    finance_paid DECIMAL(10,2) DEFAULT 0.00,
    student_type ENUM('regular', 'irregular') DEFAULT 'regular',
    status ENUM('active', 'inactive', 'graduated', 'transferred') DEFAULT 'active',
    gpa DECIMAL(3,2) DEFAULT 0.00,
    current_semester TINYINT(1) DEFAULT 1,
    current_academic_year VARCHAR(20) NULL,
    graduated_at DATETIME NULL,
    archived_at DATETIME NULL,
    archive_reason VARCHAR(50) NULL,
    flag_group ENUM('faithfulness', 'kindness', 'peace', 'love', 'self_control', 'joy', 'greatfulness', 'gentleness') NULL,
    is_account_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (pre_reg_number) REFERENCES enrollees(pre_reg_number) ON DELETE SET NULL
);

CREATE TABLE student_records_archive (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_pk INT NOT NULL,
    student_id VARCHAR(20) NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    course_id INT NULL,
    course_code VARCHAR(20) NULL,
    course_name VARCHAR(100) NULL,
    year_level INT DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'graduated',
    graduated_at DATETIME NULL,
    archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archive_reason VARCHAR(50) NOT NULL DEFAULT 'graduated_3_years',
    notes TEXT NULL,
    UNIQUE KEY uniq_student_records_archive (student_pk),
    KEY idx_records_archive_reason (archive_reason),
    KEY idx_records_archive_archived_at (archived_at),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);
-- CURRICULUM TABLE
CREATE TABLE curriculum (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    year_level INT NOT NULL,
    semester INT NOT NULL,
    units INT NOT NULL DEFAULT 3,
    description TEXT,
    prerequisites TEXT,
    professor_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_subject (course_id, subject_code, year_level, semester)
);

CREATE TABLE student_curriculum_assignments (
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
-- COURSE ENROLLMENT SCHEDULE TABLE
CREATE TABLE course_enrollment_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    enrollment_start_date DATE NOT NULL,
    enrollment_end_date DATE NOT NULL,
    max_slots INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course (course_id)
);

-- ACTIVITY LOGS TABLE
 CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ENROLLMENT SETTINGS TABLE (Fixed CHECK constraint)
CREATE TABLE enrollment_settings (
    id INT PRIMARY KEY DEFAULT 1,
    auto_close_accounts ENUM('never', 'after_semester', 'after_academic_year') DEFAULT 'never',
    strict_enrollment_windows BOOLEAN DEFAULT FALSE,
    auto_progression BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default enrollment settings
INSERT INTO enrollment_settings (id, auto_close_accounts, strict_enrollment_windows, auto_progression)
VALUES (1, 'never', FALSE, TRUE)
ON DUPLICATE KEY UPDATE id = id;
INSERT INTO courses (course_code, course_name, description, display_order) VALUES
('BSIT', 'Bachelor of Science in Information Technology', 'Focus on software development, networking, and database management', 1),
('BSCRIM', 'Bachelor of Science in Criminology', 'Study of crime, criminal behavior, and law enforcement', 2),
('BSED', 'Bachelor of Secondary Education', 'Preparation for teaching in secondary schools', 3),
('BSBA', 'Bachelor of Science in Business Administration', 'Focus on management, marketing, and finance', 4),
('THEO', 'Theology', 'Study of religious faith, practice, and experience', 5);
INSERT INTO enrollees (pre_reg_number, first_name, last_name, email, phone, course_id, year_level, status) VALUES
('PRE-2025001', 'John', 'Doe', 'john.doe@example.com', '09123456789', 1, 1, 'pre-registered'),
('PRE-2025002', 'Jane', 'Smith', 'jane.smith@example.com', '09987654321', 2, 1, 'pre-registered'),
('PRE-2025003', 'Mark', 'Johnson', 'mark.johnson@example.com', '09234567890', 3, 2, 'pre-registered');
-- Insert sample students
INSERT INTO students (student_id, pre_reg_number, first_name, last_name, email, phone, course_id, year_level, current_semester, current_academic_year, status) VALUES
('2024-0001', NULL, 'Alice', 'Brown', 'alice.brown@example.com', '09111222333', 1, 2, 2, '2024-2025', 'active'),
('2024-0002', NULL, 'Bob', 'Wilson', 'bob.wilson@example.com', '09222333444', 2, 3, 1, '2024-2025', 'active');
-- Insert sample curriculum
INSERT INTO curriculum (course_id, subject_code, subject_name, year_level, semester, units) VALUES
(1, 'IT101', 'Introduction to Computing', 1, 1, 3),
(1, 'IT102', 'Programming Logic and Design', 1, 1, 3),
(1, 'IT103', 'Web Development Fundamentals', 1, 2, 3),
(2, 'CRIM101', 'Introduction to Criminology', 1, 1, 3),
(2, 'CRIM102', 'Philippine Criminal Justice System', 1, 1, 3);
DELIMITER //
-- Function to generate unique PRE registration number
CREATE FUNCTION generate_pre_reg_number() RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE new_number VARCHAR(20);
    DECLARE counter INT DEFAULT 1;
    DECLARE base_year VARCHAR(4);
    DECLARE num_exists INT DEFAULT 1;
    SET base_year = YEAR(CURDATE());
    WHILE num_exists > 0 DO
        SET new_number = CONCAT('PRE-', base_year, LPAD(counter, 4, '0'));
        SELECT COUNT(*) INTO num_exists FROM enrollees WHERE pre_reg_number = new_number;
        SET counter = counter + 1;
    END WHILE;
    RETURN new_number;
END //
-- Function to generate unique Student ID
CREATE FUNCTION generate_student_id() RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE new_id VARCHAR(20);
    DECLARE year_prefix VARCHAR(4);
    DECLARE sequence INT DEFAULT 1;
    SET year_prefix = YEAR(CURDATE());
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(student_id, '-', -1) AS UNSIGNED)), 0) + 1
    INTO sequence
    FROM students
    WHERE student_id LIKE CONCAT(year_prefix, '-%');
    SET new_id = CONCAT(year_prefix, '-', LPAD(sequence, 4, '0'));
    RETURN new_id;
END //
-- Trigger for enrollees to auto-generate PRE number
CREATE TRIGGER before_insert_enrollee
BEFORE INSERT ON enrollees
FOR EACH ROW
BEGIN
    IF NEW.pre_reg_number IS NULL OR NEW.pre_reg_number = '' THEN
        SET NEW.pre_reg_number = generate_pre_reg_number();
    END IF;
END //
-- Trigger for students to auto-generate Student ID
CREATE TRIGGER before_insert_student
BEFORE INSERT ON students
FOR EACH ROW
BEGIN
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        SET NEW.student_id = generate_student_id();
    END IF;
END //
DELIMITER ;
-- View: Pending Enrollees
CREATE VIEW view_pending_enrollees AS
SELECT 
    e.id,
    e.pre_reg_number,
    e.first_name,
    e.last_name,
    e.email,
    e.phone,
    c.course_code,
    c.course_name,
    e.year_level,
    e.application_date
FROM enrollees e
LEFT JOIN courses c ON e.course_id = c.id
WHERE e.status = 'pre-registered'
ORDER BY e.application_date DESC;

-- View: Active Students by Course
CREATE VIEW view_active_students_by_course AS
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.email,
    c.course_code,
    c.course_name,
    s.year_level,
    s.current_semester,
    s.current_academic_year,
    s.gpa
FROM students s
JOIN courses c ON s.course_id = c.id
WHERE s.status = 'active' AND s.is_account_active = TRUE
ORDER BY c.display_order, s.last_name;
-- View: Active Curriculum
CREATE VIEW view_active_curriculum AS
SELECT 
    cur.id,
    c.course_code,
    c.course_name,
    cur.subject_code,
    cur.subject_name,
    cur.year_level,
    cur.semester,
    cur.units
FROM curriculum cur
JOIN courses c ON cur.course_id = c.id
WHERE cur.is_active = TRUE
ORDER BY c.display_order, cur.year_level, cur.semester;
-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_enrollees_status ON enrollees(status);
CREATE INDEX idx_enrollees_course ON enrollees(course_id);
CREATE INDEX idx_enrollees_email ON enrollees(email);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_curriculum_course ON curriculum(course_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
