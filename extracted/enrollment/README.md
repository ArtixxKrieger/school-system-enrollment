# Enrollment Lifecycle System

A comprehensive enrollment management system with semester progression, admin approval, curriculum dependency, and advanced settings.

## Features

- **Semester-based Enrollment**: Dynamic enrollment periods based on academic calendar
- **Admin Approval System**: Individual and bulk approval of enrollees with validation
- **Student Progression**: Automatic year level advancement at semester end
- **Curriculum Integration**: Course-specific enrollment schedules and capacity limits
- **Advanced Settings**: Configurable auto-account closure and enrollment windows
- **Automated Tasks**: Cron job for semester transitions and account management

## Database Setup

1. Create the database:
```sql
CREATE DATABASE enrollment;
```

2. Run the initial schema:
```bash
mysql -u root enrollment < database_schema.sql
```

3. Run the migration for new features:
```bash
mysql -u root enrollment < database_migration.sql
```

## Portable Setup Checklist

When moving this project to another laptop, make sure all of the following are done:

1. Install XAMPP and start Apache and MySQL.
2. Copy the project folder into htdocs using the same folder name or update the browser URL accordingly.
3. Import both SQL files so the required tables, sample courses, and settings exist.
4. Use PHP 7.4+ in XAMPP for best compatibility.
5. If pre-registration fails, check that the enrollment database exists and the courses table has data.

## API Endpoints

### Enrollment Management
- `GET /api/enrollees_list.php` - List enrollees with filtering
- `POST /api/enrollees_approve.php` - Approve individual enrollee
- `POST /api/enrollees_bulk_approve.php` - Bulk approve enrollees
- `GET/POST/DELETE /api/course_enrollment_schedules.php` - Manage course schedules
- `GET/POST /api/enrollment_advanced_settings.php` - Advanced settings

### Statistics
- `GET /api/enrollees_stats.php` - Enrollment statistics

## Automated Tasks

Set up a daily cron job to run automated tasks:

```bash
# Run daily at 5 AM
0 5 * * * /usr/bin/php /path/to/thesis2/automated_tasks.php
```

For Windows Task Scheduler:
1. Create a new task
2. Set trigger to daily at 5:00 AM
3. Set action to run: `php.exe`
4. Add argument: `f:\xampp\htdocs\thesis2\automated_tasks.php`

### What the automated tasks do:

1. **Auto-close Accounts**: Close student accounts based on settings (never/1/3/6 months after semester end)
2. **Auto-progress Students**: Advance students to next year level when they complete semesters
3. **Cleanup Logs**: Remove activity logs older than 3 months

## Configuration

### Enrollment Settings (via Settings page)

- **Auto-close accounts**: When to automatically deactivate student accounts after semester end
- **Strict enrollment windows**: Whether to enforce exact enrollment date restrictions
- **Auto-progression**: Enable automatic year level advancement

### Course Enrollment Schedules

Configure enrollment windows and capacity for each course:
- Start/End dates for enrollment
- Maximum slots per course
- Per academic year/semester

## User Roles

- **Super Admin**: Full access to all features
- **Admin**: Broad administrative access
- **Staff**: Limited enrollment and editing access
- **Professor**: Schedule and student view access
- **Student**: Read-only access for curriculum and dashboard

## Sample Accounts

The database seed includes these sample accounts:

- `superadmin` / `superadmin123` — Super Admin
- `admin` / `admin123` — Administrator
- `staff1` / `staff123` — Staff User
- `professor1` / `professor123` — Professor User
- `student1` / `student123` — Student User

## File Structure

```
thesis2/
├── api/                    # API endpoints
├── superadmin/            # Admin pages
│   ├── assets/
│   │   ├── css/          # Stylesheets
│   │   └── js/           # JavaScript files
│   └── includes/         # Shared components
├── config/                # Database configuration
├── database_schema.sql    # Initial database schema
├── database_migration.sql # Migration for new features
└── automated_tasks.php    # Cron job script
```

## Development Notes

- Uses PDO for database operations
- RESTful API design
- Transaction-based operations for data integrity
- Comprehensive error handling and logging
- Responsive UI with modern CSS

## Testing

1. Test individual enrollee approval
2. Test bulk approval functionality
3. Test enrollment schedule validation
4. Test automated tasks script
5. Verify student progression logic

## Security Considerations

- Input validation on all API endpoints
- SQL injection prevention with prepared statements
- XSS protection with proper output escaping
- CSRF protection (implement as needed)
- Secure password handling (for future auth features)