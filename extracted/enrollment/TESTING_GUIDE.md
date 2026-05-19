# System Testing & Deployment Guide

## Enrollment Lifecycle System - Complete Feature Implementation

### System Overview
This document covers the complete enrollment lifecycle system with semester progression, admin approval, curriculum dependency, and automated account management.

---

## Phase 1: Database Deployment

### 1.1 Initial Setup
```bash
# 1. Create database (if not exists)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS enrollment;"

# 2. Deploy schema
mysql -u root enrollment < database_schema.sql

# 3. Run migrations
mysql -u root enrollment < database_migration.sql
mysql -u root enrollment < database_migration_reenroll.sql
```

### 1.2 Verify Database
```bash
mysql -u root enrollment -e "
  SELECT COUNT(*) as tables_count FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = 'enrollment';
  
  SELECT COUNT(*) AS user_count FROM users;
  
  SELECT * FROM course_enrollment_schedule LIMIT 5;
  
  SELECT * FROM enrollment_settings WHERE id = 1;
"
```

---

## Phase 2: API Testing

### 2.1 Enrollees Management APIs

#### Test: List Enrollees with Semester Info
```bash
curl -X GET "http://localhost/enrollment/api/enrollees_list.php?page=1&status=pre-registered"
```
**Expected Response:**
- `ok: true`
- Enrollees array with `current_semester`, `current_academic_year`
- Active calendar info in response

#### Test: Individual Approval
```bash
curl -X POST "http://localhost/thesis2/api/enrollees_approve.php" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollee_id": 1,
    "admin_id": 1
  }'
```
**Expected Response:**
- `ok: true`
- `student_id` generated
- Student created with semester/year tracking

#### Test: Bulk Approval
```bash
curl -X POST "http://localhost/thesis2/api/enrollees_bulk_approve.php" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollee_ids": [1, 2, 3],
    "admin_id": 1
  }'
```
**Expected Response:**
- `ok: true`
- `approved_count: 3`
- Errors array for any failed approvals

### 2.2 Course Enrollment Schedules

#### Test: Get Schedules
```bash
curl -X GET "http://localhost/thesis2/api/course_enrollment_schedules.php"
```
**Expected Response:**
- Schedules array with `enrollment_start_date`, `enrollment_end_date`, `max_slots`

#### Test: Create Schedule
```bash
curl -X POST "http://localhost/enrollment/api/course_enrollment_schedules.php" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "enrollment_start_date": "2025-08-01 08:00:00",
    "enrollment_end_date": "2025-08-15 17:00:00",
    "max_slots": 50
  }'
```

### 2.3 Advanced Settings

#### Test: Get Settings
```bash
curl -X GET "http://localhost/thesis2/api/enrollment_advanced_settings.php"
```
**Expected Response:**
- `auto_close_accounts` value
- `strict_enrollment_windows` flag
- `auto_progression` flag

#### Test: Update Settings
```bash
curl -X POST "http://localhost/thesis2/api/enrollment_advanced_settings.php" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_close_accounts": "3_months",
    "strict_enrollment_windows": true,
    "auto_progression": true
  }'
```

### 2.4 Student Details API

#### Test: Get Student with Curriculum
```bash
curl -X GET "http://localhost/thesis2/api/student_details.php?id=1"
```
**Expected Response:**
- Student object with `current_semester`, `current_academic_year`
- `curriculum` array for current year/semester
- Each subject has `subject_code`, `subject_name`, `units`, `prerequisites`

---

## Phase 3: Frontend Testing

### 3.1 Enrollees Page
1. Navigate to http://localhost/enrollment/app/enrollees
2. **Verify:**
   - Header shows dynamic semester (e.g., "1st Semester AY 2025-2026")
   - Enrollment status indicator (Open/Closed)
   - Bulk approve button visible
   - Checkboxes on pre-registered enrollees
   - Select All checkbox functional

3. **Test Bulk Approval:**
   - Select multiple enrollees
   - Click "Bulk Approve Selected"
   - Verify success notification
   - Check table updates

### 3.2 Students Page
1. Navigate to http://localhost/enrollment/app/student
2. **Verify:**
   - Students grouped by course
   - Each student shows "Year X • 1st/2nd Semester"
   - View button opens modal

3. **Test Student Details Modal:**
   - Click View on any student
   - Verify modal shows:
     - Student ID, Year, Semester, Academic Year
     - Student Profile section
     - Current Curriculum table with subjects for their year/semester
   - Modal closes properly

### 3.3 Settings Page
1. Navigate to http://localhost/enrollment/app/settings
2. **Verify:**
   - Enrollment Settings card visible
   - Click opens modal with course schedules
   - Course schedule list loads
   - Advanced Settings section shows toggles/dropdowns

---

## Phase 4: Automated Tasks Testing

### 4.1 Manual Task Execution
```bash
# Test automated tasks script
php /path/to/thesis2/automated_tasks.php
```
**Expected Output:**
- "Starting automated enrollment tasks..."
- Task completion messages
- Activity logs for auto-progression/account closure

### 4.2 Verify Activity Logs
```bash
mysql -u root enrollment -e "
  SELECT * FROM activity_logs 
  WHERE action IN ('auto_progressed', 'auto_closed_account')
  ORDER BY created_at DESC LIMIT 5;
"
```

### 4.3 Cron Job Setup (Linux/macOS)
```bash
# Edit crontab
crontab -e

# Add entry for daily execution at 2 AM
0 2 * * * /usr/bin/php /path/to/thesis2/automated_tasks.php >> /var/log/enrollment-tasks.log 2>&1
```

### 4.4 Cron Job Setup (Windows Task Scheduler)
1. Open Task Scheduler
2. Create new task:
   - **Name:** Enrollment Lifecycle Tasks
   - **Trigger:** Daily at 2:00 AM
   - **Action:** `C:\xampp\php\php.exe` with argument `F:\xampp\htdocs\thesis2\automated_tasks.php`

---

## Phase 5: End-to-End Enrollment Lifecycle Test

### 5.1 Pre-Registration Flow
1. Student pre-registers via `/pre_reg.php`
2. Check in database:
   ```sql
   SELECT * FROM enrollees WHERE status = 'pre-registered' LIMIT 1;
   ```

### 5.2 Admin Approval Flow
1. Admin accesses Enrollees page
2. Approve student (individual or bulk)
3. Verify:
   ```sql
   SELECT * FROM enrollees WHERE id = <enrollee_id>;
   SELECT * FROM students WHERE id = <created_student_id>;
   ```
   - Enrollee status = "approved"
   - Student record created with `current_semester`, `current_academic_year`, `year_level`
   - Activity log entry created

### 5.3 Semester Progression Flow
1. Update academic calendar to set `classes_end_date` to past date
2. Run automated tasks:
   ```bash
   php automated_tasks.php
   ```
3. Verify:
   - Students with completed semesters have `year_level` incremented
   - Activity logs show `auto_progressed` actions
   - Accounts marked `is_account_active = FALSE` if auto-close enabled

### 5.4 Curriculum Display Flow
1. View student details
2. Verify curriculum shows subjects for:
   - Current year level
   - Current semester
   - Current academic year

---

## Phase 6: Validation Checklist

- [ ] All PHP files pass syntax check (`php -l`)
- [ ] Database schema created successfully
- [ ] Migration script runs without errors
- [ ] Enrollees list returns active calendar data
- [ ] Individual approval creates student with semester tracking
- [ ] Bulk approval processes multiple enrollees
- [ ] Course schedules API CRUD operations work
- [ ] Advanced settings persist correctly
- [ ] Student detail modal displays curriculum
- [ ] Automated tasks script executes without errors
- [ ] Year level progression logic works correctly
- [ ] Auto-account closure triggers after classes end
- [ ] Activity logs record all major actions
- [ ] Enrollees page header shows dynamic semester
- [ ] Bulk approval UI functional with select all
- [ ] Settings page displays enrollment config

---

## Phase 7: Deployment Checklist

- [ ] Database backed up
- [ ] All API endpoints tested and working
- [ ] Frontend pages render correctly
- [ ] Cron job configured
- [ ] Log files writable
- [ ] File permissions correct
- [ ] Error reporting enabled for debugging
- [ ] README documentation up to date

---

## Troubleshooting

### Issue: Enrollment window validation fails
**Solution:** Check `enrollment_settings.strict_enrollment_windows` and course schedule dates

### Issue: Year progression not working
**Solution:** Verify `auto_progression = TRUE` in settings and curriculum exists for next year

### Issue: Student curriculum not showing
**Solution:** Check curriculum table for correct `course_id`, `academic_calendar_id`, `year_level`, `semester`

### Issue: Cron job not executing
**Solution:** Verify cron path to PHP executable and script permissions (755)

---

## Performance Optimization

- Index on `enrollees(status, course_id)`
- Index on `students(current_semester, current_academic_year)`
- Index on `course_enrollment_schedule(enrollment_start_date, enrollment_end_date)`
- Consider pagination for large datasets (100+ students per course)

---

## Security Notes

- All queries use prepared statements (PDO)
- Input validation on all API endpoints
- Error messages don't expose database structure
- Activity logs track all approval actions
- Consider adding rate limiting to approval endpoints in production

---

## Support & Next Steps

For issues or feature requests:
1. Check activity logs for error context
2. Review error details in API responses
3. Verify database consistency
4. Test with curl/Postman before frontend testing

**System is now ready for production deployment!**
