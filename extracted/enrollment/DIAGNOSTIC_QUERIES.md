# DIAGNOSTIC QUERIES - Check Student Progression Status

Run these queries in your MySQL to see the actual database values:

## 1. Check Students Table (Current Status)
```sql
SELECT 
    student_id,
    CONCAT(first_name, ' ', last_name) as name,
    year_level,
    current_semester,
    status,
    progression_status,
    course_id
FROM students 
WHERE status = 'active'
ORDER BY student_id DESC 
LIMIT 10;
```

## 2. Check Enrollees Table (Re-enrollment Queue)
```sql
SELECT 
    e.id,
    e.existing_student_id,
    CONCAT(e.first_name, ' ', e.last_name) as name,
    e.year_level as enrollee_year_level,
    e.status as enrollee_status,
    e.enrollment_type,
    s.year_level as student_year_level,
    s.current_semester as student_semester
FROM enrollees e
LEFT JOIN students s ON s.student_id = e.existing_student_id
WHERE e.enrollment_type = 'returning'
ORDER BY e.id DESC 
LIMIT 10;
```

## 3. Check What API Returns
After ending 1st semester for a Year 1 student, check the API:

Open in browser:
```
http://localhost/enrollment/api/enrollees_list.php?status=registered
```

Look for the student and check these fields:
- `target_year_level` (should be 1)
- `target_semester` (should be 2)
- `current_year_level` (should be 1)
- `current_student_semester` (should be 2)

## Expected Values After Ending 1st Semester

For a Year 1, Semester 1 student:

**BEFORE ending semester:**
- students table: year_level=1, current_semester=1, progression_status='enrolled'

**AFTER ending semester:**
- students table: year_level=1, current_semester=2, progression_status='pending_progression'
- enrollees table: year_level=1, existing_student_id=<student_id>, status='pending'
- Enrollees page should show: **Year 1** (Target: Y1 • 2nd Sem)
- Students page should NOT show this student (filtered out)

**AFTER approving re-enrollment:**
- students table: year_level=1, current_semester=2, progression_status='enrolled'
- Students page should show: **Year 1, Semester 2**

---

# What You're Probably Seeing

Can you tell me which of these you see?

**Option A - Enrollees Page Issue:**
- You ended 1st semester for Year 1 student
- Enrollees page shows "Year 2" instead of "Year 1"

**Option B - Students Page Issue:**
- After re-enrollment, Students page shows wrong year

**Option C - Both pages wrong**

Please run the SQL queries above and share what you see, or describe exactly what the admin page is displaying.
