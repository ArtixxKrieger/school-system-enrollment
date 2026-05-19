<?php
$basePath = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$basePath = rtrim($basePath, '/');
if ($basePath === '.' || $basePath === '/') {
    $basePath = '';
}

// Check if enrollment is open
$enrollmentClosed = false;
$closedReason = '';
try {
    $pdo = require __DIR__ . '/config/db.php';
    $now = new DateTime();

    // Check system_close_date
    $stmt = $pdo->query('SELECT strict_enrollment_windows, system_close_date FROM enrollment_settings WHERE id = 1');
    $settings = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;

    if ($settings) {
        $closeDate = $settings['system_close_date'] ?? null;
        if ($closeDate && $now > new DateTime($closeDate)) {
            $enrollmentClosed = true;
            $closedReason = 'The enrollment period has ended.';
        }

        // If strict windows enabled, check if at least one course window is currently open
        $strict = (int)($settings['strict_enrollment_windows'] ?? 0);
        if (!$enrollmentClosed && $strict) {
            $nowStr = $now->format('Y-m-d H:i:s');
            $windowStmt = $pdo->prepare(
                'SELECT COUNT(*) FROM course_enrollment_schedule WHERE enrollment_start_date <= ? AND enrollment_end_date >= ?'
            );
            $windowStmt->execute([$nowStr, $nowStr]);
            $openWindows = (int)$windowStmt->fetchColumn();
            if ($openWindows === 0) {
                $enrollmentClosed = true;
                $closedReason = 'Pre-registration is currently closed. No enrollment windows are open.';
            }
        }
    }
} catch (Throwable $e) {
    // If DB is unreachable, allow the form to show — the API will handle the error
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="<?php echo htmlspecialchars(($basePath !== '' ? $basePath : '') . '/', ENT_QUOTES, 'UTF-8'); ?>">
    <title>Pre Register</title>
</head>

<body>
    <div class="container">
        <div class="pre_reg-card">
            <div class="logo-container">
                <img src="superadmin/assets/img/logo.jpg" alt="Logo" class="logo">
            </div>
            <h1 class="pre_reg-title">Pre Register</h1>

            <?php if ($enrollmentClosed): ?>
            <div class="enrollment-closed-notice">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#991b1b" stroke-width="2" style="margin: 0 auto 16px; display: block;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h2 class="closed-title">Pre-Registration Closed</h2>
                <p class="closed-message"><?php echo htmlspecialchars($closedReason, ENT_QUOTES, 'UTF-8'); ?></p>
                <p class="closed-sub">Please contact the registrar's office for more information.</p>
                <a href="login" class="closed-login-link">Go to Login</a>
            </div>
            <?php else: ?>
            
            <form id="registerForm" class="pre_reg-form" method="post" action="api/pre_reg_register.php">
                <div class="form-group">
                    <input 
                        type="text" 
                        id="lastname" 
                        name="lastname" 
                        placeholder="Last Name" 
                        class="form-input"
                        required
                    >
                </div>
                <div class="form-group">
                    <input 
                        type="text" 
                        id="firstname" 
                        name="firstname" 
                        placeholder="First Name" 
                        class="form-input"
                        required
                    >
                </div>
                <div class="form-group">
                    <input 
                        type="text" 
                        id="middlename" 
                        name="middlename" 
                        placeholder="Middle Name" 
                        class="form-input"
                    >
                </div>
                <div class="form-group">
                    <input 
                        type="tel" 
                        id="phone" 
                        name="phone" 
                        placeholder="Phone Number" 
                        class="form-input"
                    >
                </div>
                <div class="form-group">
                    <input 
                        type="tel" 
                        id="guardian_contact" 
                        name="guardian_contact" 
                        placeholder="Guardian Contact No." 
                        class="form-input"
                    >
                </div>
                <div class="form-group">
                    <input 
                        type="text" 
                        id="fb_name" 
                        name="fb_name" 
                        placeholder="Facebook Name" 
                        class="form-input"
                    >
                </div>
                <div class="form-group">
                    <select
                        id="course"
                        name="course"
                        class="form-input"
                        required
                    >
                        <option value="" selected disabled>Select Course</option>
                        <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                        <option value="BSCRIM">BSCRIM - Bachelor of Science in Criminology</option>
                        <option value="BSED">BSED - Bachelor of Secondary Education</option>
                        <option value="BSBA">BSBA - Bachelor of Science in Business Administration</option>
                        <option value="THEO">THEO - Theology</option>
                    </select>
                </div>
                <div class="form-group">
                    <select
                        id="year_level"
                        name="year_level"
                        class="form-input"
                        required
                    >
                        <option value="1" selected>1st Year</option>
                    </select>
                </div>
                <div class="form-group full-width">
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        placeholder="Email" 
                        class="form-input"
                        required
                    >
                </div>
                <div class="form-group password-group full-width">
                    <div class="password-input-wrapper">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Password"
                            class="form-input"
                            autocomplete="new-password"
                            required
                        >
                        <button type="button" class="password-toggle" aria-label="Show password">
                            <span>Show</span>
                        </button>
                    </div>
                </div>
                <div class="form-group password-group full-width">
                    <div class="password-input-wrapper">
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            class="form-input"
                            autocomplete="new-password"
                            required
                        >
                        <button type="button" class="password-toggle" aria-label="Show confirm password">
                            <span>Show</span>
                        </button>
                    </div>
                </div>
                <div class="form-group full-width">
                    <textarea 
                        id="address" 
                        name="address" 
                        placeholder="Address" 
                        class="form-input"
                        rows="3"
                    ></textarea>
                </div>
                <div class="form-group">
                    <label for="birth_date" class="input-label">Birthday</label>
                    <input 
                        type="date" 
                        id="birth_date" 
                        name="birth_date" 
                        class="form-input"
                    >
                </div>
                <div class="form-group">
                    <label for="gender" class="input-label">Gender</label>
                    <select
                        id="gender"
                        name="gender"
                        class="form-input"
                    >
                        <option value="" selected disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div class="form-group full-width">
                    <button type="submit" class="register-button">Pre Register</button>
                </div>
                
            </form>
            <?php endif; ?>
        </div>
    </div>
    <style>
        * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #e5e7ec 0%, #e4e3e3 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: clamp(8px, 2vw, 16px);
}

.container {
    width: 100%;
    max-width: min(100vw - 16px, 980px);
    min-height: calc(100vh - clamp(16px, 4vw, 32px));
    display: flex;
    justify-content: center;
    align-items: center;
}

.pre_reg-card {
    background: white;
    border-radius: 14px;
    box-shadow: 0 12px 42px rgba(0, 0, 0, 0.14);
    padding: clamp(18px, 2.4vw, 32px) clamp(16px, 2.2vw, 28px);
    width: 100%;
    max-height: calc(100vh - clamp(16px, 4vw, 32px));
    overflow-y: auto;
    position: relative;
}

.logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    position: static;
    top: auto;
}

.logo {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgb(255, 255, 255);
    padding: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.pre_reg-title {
    text-align: center;
    color: #333;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 24px;
}

.pre_reg-form {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
}

.form-group {
    margin-bottom: 0;
}

.input-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    outline: none;
}

.form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

    .password-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .password-input-wrapper .form-input {
        padding-right: 72px;
    }

    .password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        font-size: 13px;
        padding: 6px 8px;
        border-radius: 6px;
    }

    .password-toggle:hover {
        background: rgba(100, 116, 139, 0.12);
    }

    .forgot-password-container {
        text-align: right;
        margin-bottom: 16px;
    }

    .forgot-password-link {
        color: #4a90e2;
        font-size: 14px;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    .forgot-password-link:hover {
        color: #357abd;
        text-decoration: underline;
    }

    .register-button {
        width: 100%;
        padding: 12px 24px;
        background: #2BAD1A;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 16px;
    }

    .register-button:hover {
        background: #22a117;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(34, 161, 23, 0.3);
    }

    .register-button:active {
        transform: translateY(0);
    }

.register-text {
    color: #666;
}

.register-link {
    color: #4a90e2;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.register-link:hover {
    color: #357abd;
    text-decoration: underline;
}

.error-message {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 8px;
    display: none;
}

.form-group.error .form-input {
    border-color: #e74c3c;
}

.enrollment-closed-notice {
    text-align: center;
    padding: 40px 20px;
}
.closed-title {
    color: #991b1b;
    font-size: 22px;
    margin-bottom: 12px;
}
.closed-message {
    color: #374151;
    font-size: 15px;
    margin-bottom: 8px;
}
.closed-sub {
    color: #6b7280;
    font-size: 13px;
    margin-bottom: 24px;
}
.closed-login-link {
    display: inline-block;
    padding: 10px 28px;
    background: #4a90d9;
    color: #fff;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: background .2s;
}
.closed-login-link:hover {
    background: #357abd;
}

.form-group.error .error-message {
    display: block;
}

@media (max-width: 640px) {
    .pre_reg-form {
        grid-template-columns: 1fr;
    }

    .container,
    .pre_reg-card {
        max-height: none;
    }
}

@media (max-width: 480px) {
    body {
        padding: 12px;
    }
    
    .pre_reg-card {
        padding: 20px;
    }
    
    .pre_reg-title {
        font-size: 20px;
        margin-bottom: 20px;
    }
    
    .logo {
        width: 100px;
        height: 100px;
    }
}
    </style>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('registerForm');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const passwordValue = String(passwordInput?.value || '').trim();
            const confirmPasswordValue = String(confirmPasswordInput?.value || '').trim();

            if (passwordValue === '' || confirmPasswordValue === '') {
                alert('Please enter both password fields.');
                return;
            }

            if (passwordValue !== confirmPasswordValue) {
                alert('Passwords do not match.');
                return;
            }

            const submitBtn = document.querySelector('.register-button');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registering...';
            }

            const formData = new FormData(form);
            const payload = {
                lastname: String(formData.get('lastname') || ''),
                firstname: String(formData.get('firstname') || ''),
                middlename: String(formData.get('middlename') || ''),
                phone: String(formData.get('phone') || ''),
                guardian_contact: String(formData.get('guardian_contact') || ''),
                fb_name: String(formData.get('fb_name') || ''),
                course: String(formData.get('course') || ''),
                year_level: String(formData.get('year_level') || ''),
                email: String(formData.get('email') || ''),
                address: String(formData.get('address') || ''),
                birth_date: String(formData.get('birth_date') || ''),
                gender: String(formData.get('gender') || ''),
                password: passwordValue,
                confirmPassword: confirmPasswordValue,
            };

            try {
                const res = await fetch(form.getAttribute('action'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data.ok) {
                    const message = [data.error, data.details].filter(Boolean).join('\n');
                    alert(message || 'Registration failed');
                    return;
                }

                window.location.href = 'login?registered=1';
            } catch (err) {
                alert('Network error. Try again.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Pre Register';
                }
            }
        });

        document.querySelectorAll('.password-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const target = this.previousElementSibling;
                if (!target || target.tagName !== 'INPUT') return;
                const isHidden = target.type === 'password';
                target.type = isHidden ? 'text' : 'password';
                this.querySelector('span').textContent = isHidden ? 'Hide' : 'Show';
            });
        });
    });
    </script>
</body>

</html>