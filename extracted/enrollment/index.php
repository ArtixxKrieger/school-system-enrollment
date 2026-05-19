<?php
session_start();
require_once __DIR__ . '/config/auth.php';

$basePath = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$basePath = rtrim($basePath, '/');
if ($basePath === '.' || $basePath === '/') {
    $basePath = '';
}
$loginUrl = $basePath . '/login';

if (isset($_GET['logout'])) {
    session_unset();
    session_destroy();
    header('Location: ' . $loginUrl);
    exit;
}

require_login();

$currentUserPermissions = $_SESSION['user']['permissions'] ?? [];
$canViewModule = static fn(string $module): bool => has_permission($module, 'view');

$currentUserRole = strtolower($_SESSION['user']['role'] ?? 'staff');
$currentUserName = trim($_SESSION['user']['fullName'] ?? $_SESSION['user']['userId'] ?? 'User');

$role = strtolower(isset($_GET['role']) ? $_GET['role'] : 'superadmin');

// Route user role to user SPA entry
if ($role === 'user') {
    include 'user/user_index.html';
    exit;
}

$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
if ($page === 'subjects') {
    $page = 'offer';
}
$pageTitle = 'Dashboard';

$pageModule = resolve_page_module($page);
$alwaysAllowedPages = ['dashboard', 'profile', 'security'];
if ($pageModule !== null && !in_array($page, $alwaysAllowedPages, true) && !$canViewModule($pageModule)) {
    $page = 'forbidden';
    $pageTitle = 'Forbidden';
}

switch($page) {
    case 'enrollment':
        $pageTitle = 'Enrolled';
        break;
    case 'enrollees':
        $pageTitle = 'Enrollees';
        break;
    case 'course':
        $pageTitle = 'Courses';
        break;
    case 'curriculum':
        $pageTitle = 'Curriculum';
        break;
    case 'offer':
        $pageTitle = 'Offer';
        break;
    case 'offered':
        $pageTitle = 'Offered';
        break;
    case 'schedule':
        $pageTitle = 'Schedule';
        break;
    case 'curriculum-1st':
        $pageTitle = '1st Year Subjects';
        break;
    case 'curriculum-2nd':
        $pageTitle = '2nd Year Subjects';
        break;
    case 'curriculum-3rd':
        $pageTitle = '3rd Year Subjects';
        break;
    case 'curriculum-4th':
        $pageTitle = '4th Year Subjects';
        break;
    case 'student':
        $pageTitle = 'Students';
        break;
    case 'professor':
        $pageTitle = 'Professor';
        break;
    case 'administrator':
        $pageTitle = 'Administrator';
        break;
    case 'settings':
        $pageTitle = 'Settings';
        break;
    case 'records':
        $pageTitle = 'Records';
        break;
    case 'enrollmentsettings':
        $pageTitle = 'Enrollment Settings';
        break;
    case 'notification':
        $pageTitle = 'Notification Settings';
        break;
    case 'profile':
        $pageTitle = 'Profile Management';
        break;
    case 'security':
        $pageTitle = 'Security';
        break;
    case 'management':
        $pageTitle = 'Role Management';
        break;
}

$appBasePath = $basePath;
$appBaseUrl = $appBasePath . '/app';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="<?php echo htmlspecialchars(($appBasePath !== '' ? $appBasePath : '') . '/', ENT_QUOTES, 'UTF-8'); ?>">
    <title><?php echo $pageTitle; ?> - Kurios Enrollment System</title>
    <link rel="stylesheet" href="superadmin/assets/css/style.css">
    <link rel="stylesheet" href="superadmin/assets/css/layout.css">
    <script>
        window.AppUser = <?php echo json_encode($_SESSION['user'] ?? null, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.AppBaseUrl = <?php echo json_encode($appBaseUrl, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
        window.ApiBaseUrl = <?php echo json_encode($appBasePath . '/api', JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
    </script>
    <?php if ($page == 'enrollment' || $page == 'enrollees'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/enrollment.css">
    <?php endif; ?>
    <?php if ($page == 'enrollmentsettings'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/enrollmentsettings.css">
    <?php endif; ?>
    <?php if ($page == 'enrollees'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/enrollees.css">
    <?php endif; ?>
    <?php if ($page == 'course'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/course.css">
    <?php endif; ?>
    <?php if ($page == 'curriculum' || $page == 'offer' || $page == 'offered' || strpos($page, 'curriculum-') === 0): ?>
    <link rel="stylesheet" href="superadmin/assets/css/curriculum.css">
    <?php endif; ?>
    <?php if ($page == 'schedule'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/curriculum.css">
    <link rel="stylesheet" href="superadmin/assets/css/schedule.css">
    <?php endif; ?>
    <?php if ($page == 'student'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/student.css">
    <?php endif; ?>
    <?php if ($page == 'settings' || $page == 'notification'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/settings.css">
    <?php endif; ?>
    <?php if ($page == 'records'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/records.css">
    <?php endif; ?>
    <?php if ($page == 'profile'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/profile.css">
    <?php endif; ?>
    <?php if ($page == 'management'): ?>
    <link rel="stylesheet" href="superadmin/assets/css/rolemanagement.css">
    <?php endif; ?>
</head>
<body data-page="<?php echo htmlspecialchars($page, ENT_QUOTES, 'UTF-8'); ?>">
    <div class="app-container">
        <?php include 'superadmin/includes/sidebar.php'; ?>
        <div class="sidebar-backdrop" id="sidebarBackdrop" aria-hidden="true" hidden></div>

        <div class="main-content">
            <?php include 'superadmin/includes/header.php'; ?>

            <div class="content-area">
                <?php
                switch ($page) {
                    case 'management':
                        $pageFile = 'superadmin/rolemanagement.php';
                        break;
                    case 'curriculum':
                    case 'curriculum-1st':
                    case 'curriculum-2nd':
                    case 'curriculum-3rd':
                    case 'curriculum-4th':
                        $pageFile = 'superadmin/curriculum.php';
                        break;
                    default:
                        $pageFile = "superadmin/{$page}.php";
                        break;
                }

                if (file_exists($pageFile)) {
                    include $pageFile;
                } else {
                    include 'superadmin/dashboard.php';
                }
                ?>
            </div>
        </div>
    </div>

    <script src="superadmin/assets/js/shared-data.js?v=<?php echo time(); ?>"></script>
    <script src="superadmin/assets/js/main.js"></script>
    <?php if ($page == 'enrollment'): ?>
    <script src="superadmin/assets/js/enrollment.js"></script>
    <?php endif; ?>
    <?php if ($page == 'enrollmentsettings'): ?>
    <script src="superadmin/assets/js/enrollmentsettings.js"></script>
    <?php endif; ?>
    <?php if ($page == 'enrollees'): ?>
    <script src="superadmin/assets/js/enrollees.js"></script>
    <?php endif; ?>
    <?php if ($page == 'course'): ?>
    <script src="superadmin/assets/js/course.js"></script>
    <?php endif; ?>
    <?php if ($page == 'curriculum' || strpos($page, 'curriculum-') === 0): ?>
    <script src="superadmin/assets/js/curriculum.js"></script>
    <?php endif; ?>
    <?php if ($page == 'offer' || $page == 'offered'): ?>
    <script src="superadmin/assets/js/subjects.js?v=<?php echo time(); ?>"></script>
    <?php endif; ?>
    <?php if ($page == 'student'): ?>
    <script src="superadmin/assets/js/student.js"></script>
    <?php endif; ?>
    <?php if ($page == 'records'): ?>
    <script src="superadmin/assets/js/records.js"></script>
    <?php endif; ?>
    <?php if ($page == 'management'): ?>
    <script src="superadmin/assets/js/rolemanagement.js"></script>
    <?php endif; ?>
    <?php if ($page == 'dashboard'): ?>
    <script src="superadmin/assets/js/dashboard.js?v=<?php echo time(); ?>"></script>
    <?php endif; ?>
    <?php if ($page == 'profile'): ?>
    <script src="superadmin/assets/js/profile.js"></script>
    <?php endif; ?>
    <?php if ($page == 'settings'): ?>
    <script src="superadmin/assets/js/settings.js"></script>
    <?php endif; ?>
    <?php if ($page == 'notification'): ?>
    <script src="superadmin/assets/js/notification.js"></script>
    <?php endif; ?>
</body>
</html>