<?php
session_start();
$basePath = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$basePath = rtrim($basePath, '/');
if ($basePath === '.' || $basePath === '/') {
    $basePath = '';
}
$forceShowLogin = isset($_GET['registered']) || isset($_GET['force']);
if (isset($_SESSION['user']) && !$forceShowLogin) {
    header('Location: ' . $basePath . '/app/dashboard');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="<?php echo htmlspecialchars(($basePath !== '' ? $basePath : '') . '/', ENT_QUOTES, 'UTF-8'); ?>">
    <title>Log In</title>
</head>

<body>
    <div class="container">
        <div class="login-card">
            <div class="logo-container">
                <img src="superadmin/assets/img/logo.jpg" alt="Logo" class="logo">
            </div>
            <h1 class="login-title">Log In</h1>
            
            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <input 
                        type="text" 
                        id="email" 
                        name="email" 
                        placeholder="Email Address or Username" 
                        class="form-input"
                        autocomplete="username"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        placeholder="Password" 
                        class="form-input"
                        required
                    >
                </div>
                
                <div class="forgot-password-container">
                    <a href="#" id="forgotPasswordLink" class="forgot-password-link">Forgot Password?</a>
                </div>
                
                <button type="submit" id="loginSubmitBtn" class="login-button">Log In</button>
                
            </form>
            <div id="loginNotice" class="login-notice" style="display:none;" aria-live="polite"></div>
        </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="forgot-modal-overlay" id="forgotModalOverlay" aria-hidden="true">
        <div class="forgot-modal" role="dialog" aria-modal="true" aria-labelledby="forgotModalTitle">
            <div class="forgot-modal-header">
                <h2 id="forgotModalTitle">Forgot Password</h2>
                <button type="button" class="forgot-modal-close" id="forgotModalClose" aria-label="Close">
                    &times;
                </button>
            </div>

            <div class="forgot-modal-body">
                <div class="forgot-progress" id="forgotProgress" aria-label="Forgot password steps">
                    <div class="forgot-progress-step active" data-step="1">
                        <span class="forgot-progress-number">1</span>
                        <span class="forgot-progress-label">Email</span>
                    </div>
                    <div class="forgot-progress-step" data-step="2">
                        <span class="forgot-progress-number">2</span>
                        <span class="forgot-progress-label">Verify</span>
                    </div>
                    <div class="forgot-progress-step" data-step="3">
                        <span class="forgot-progress-number">3</span>
                        <span class="forgot-progress-label">Reset</span>
                    </div>
                </div>

                <!-- Step 1: Enter email and send authentication code -->
                <div id="forgotStep1" class="forgot-step">
                    <p class="forgot-message forgot-helper-box">Enter your account email to receive a secure authentication code.</p>
                    <div class="form-group">
                        <label for="forgotEmail">Email</label>
                        <input
                            type="email"
                            id="forgotEmail"
                            class="form-input"
                            placeholder="your@email.com"
                            autocomplete="email"
                            required
                        >
                    </div>
                    <div class="forgot-actions">
                        <button type="button" class="login-button forgot-send-btn" id="forgotSendBtn">Send Code</button>
                    </div>
                    <div id="forgotStep1Error" class="error-message" style="display:none;"></div>
                </div>

                <!-- Step 2: Enter authentication code -->
                <div id="forgotStep2" class="forgot-step forgot-hidden" aria-hidden="true">
                    <p id="forgotCodeHelp" class="forgot-message forgot-helper-box">Enter the 6-digit authentication code sent to your email.</p>
                    <div class="form-group">
                        <label for="forgotVerificationCode">Authentication Code</label>
                        <input
                            type="text"
                            id="forgotVerificationCode"
                            class="form-input forgot-code-input"
                            placeholder="Enter 6-digit code"
                            inputmode="numeric"
                            maxlength="6"
                            autocomplete="one-time-code"
                        >
                    </div>
                    <div class="forgot-actions">
                        <button type="button" class="login-button forgot-confirm-btn" id="forgotIdentityConfirmBtn">Verify Code</button>
                    </div>
                    <div id="forgotStep2Error" class="error-message" style="display:none;"></div>
                </div>

                <!-- Step 3: New password + confirm password -->
                <div id="forgotStep3" class="forgot-step forgot-hidden" aria-hidden="true">
                    <p class="forgot-message forgot-helper-box">Create a new password with at least 8 characters.</p>
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            class="form-input"
                            placeholder="Enter new password"
                            autocomplete="new-password"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            class="form-input"
                            placeholder="Confirm new password"
                            autocomplete="new-password"
                            required
                        >
                    </div>
                    <div class="forgot-actions">
                        <button type="button" class="login-button forgot-reset-btn" id="forgotResetConfirmBtn">Confirm</button>
                    </div>
                    <div id="forgotStep3Error" class="error-message" style="display:none;"></div>
                </div>
            </div>
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
    padding: 16px;
}

.container {
    width: 100%;
    max-width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.login-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    padding: 24px;
    width: 100%;
    position: relative;
}

.logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    position: relative;
    top: -70px;
    margin-bottom: -50px;
}

.logo {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgb(255, 255, 255);
    padding: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.login-title {
    text-align: center;
    color: #333;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 24px;
}

.login-form {
    width: 100%;
}

.form-group {
    margin-bottom: 16px;
}

.form-input {
    width: 100%;
    padding: 12px;
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

.form-input::placeholder {
    color: #999;
}

.forgot-password-container {
    text-align: right;
    margin-bottom: 24px;
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

.login-button {
    width: 100%;
    padding: 12px 24px;
    background: #1b4400;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 16px;
}

.login-button:hover {
    background: #1f3a0f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(45, 80, 22, 0.3);
}

.login-button:active {
    transform: translateY(0);
}

.login-button:disabled {
    cursor: not-allowed;
    opacity: 0.8;
    transform: none;
    box-shadow: none;
}

.login-notice {
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
}

.login-notice-info {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
}

.login-notice-warning {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    color: #92400e;
}

.forgot-password-link.recommended {
    color: #b45309;
    font-weight: 700;
}

.error-message {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 8px;
    display: none;
}

/* Forgot Password modal */
.forgot-modal-overlay{
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.58);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 9999;
}
.forgot-modal-overlay[aria-hidden="true"]{
    display: none;
}
.forgot-modal{
    width: 100%;
    max-width: 460px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.28);
    overflow: hidden;
}
.forgot-modal-header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    background: linear-gradient(135deg, #f8fafc 0%, #eef7f0 100%);
    border-bottom: 1px solid #e5e7eb;
}
.forgot-modal-header h2{
    font-size: 19px;
    font-weight: 700;
    color: #17340a;
}
.forgot-modal-close{
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;
}
.forgot-modal-body{
    padding: 18px 22px 22px;
}
.forgot-progress {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
}
.forgot-progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 8px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    background: #f9fafb;
    color: #6b7280;
    transition: all 0.25s ease;
}
.forgot-progress-step.active {
    border-color: #1b4400;
    background: #eefbf0;
    color: #17340a;
    box-shadow: 0 0 0 3px rgba(27, 68, 0, 0.08);
}
.forgot-progress-number {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #e5e7eb;
    font-size: 13px;
    font-weight: 700;
}
.forgot-progress-step.active .forgot-progress-number {
    background: #1b4400;
    color: #fff;
}
.forgot-progress-label {
    font-size: 12px;
    font-weight: 600;
}
.forgot-hidden{ display:none; }
.forgot-step{
    padding: 4px 0 0;
}
.forgot-actions{ margin-top: 12px; }
.forgot-message{
    font-size: 14px;
    color: #334155;
    margin: 4px 0 12px;
    line-height: 1.5;
}
.forgot-helper-box {
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}
.forgot-step .form-group label{
    display:block;
    margin-bottom: 8px;
    color: #374151;
    font-weight: 600;
    font-size: 14px;
}
.forgot-code-input {
    text-align: center;
    letter-spacing: 4px;
    font-size: 18px;
    font-weight: 700;
}

.forgot-send-btn,
.forgot-confirm-btn,
.forgot-reset-btn{
    width: 100%;
    margin-bottom: 0;
}

.form-group.error .form-input {
    border-color: #e74c3c;
}

.form-group.error .error-message {
    display: block;
}

@media (max-width: 480px) {
    body {
        padding: 12px;
    }
    
    .login-card {
        padding: 20px;
    }
    
    .login-title {
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
    console.log('Enrollment System Login Page Ready!');

    const params = new URLSearchParams(window.location.search);
    if (params.has('registered')) {
        alert('Pre-registration successful. Please log in on this page.');
        if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
    
    const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('loginSubmitBtn');
        const loginNotice = document.getElementById('loginNotice');
        let loginCooldownTimer = null;
        let loginLockedUntil = 0;

        function showNotice(message, type = 'info') {
            if (!loginNotice) return;
            loginNotice.textContent = message;
            loginNotice.className = `login-notice login-notice-${type}`;
            loginNotice.style.display = 'block';
        }

        function clearNotice() {
            if (!loginNotice) return;
            loginNotice.style.display = 'none';
            loginNotice.textContent = '';
            loginNotice.className = 'login-notice';
        }

        const authReason = params.get('reason');
        if (authReason === 'session-replaced' || authReason === 'session-expired' || authReason === 'account-inactive') {
            let authMessage = 'This account was signed in on another browser. Please log in again if needed.';

            if (authReason === 'session-expired') {
                authMessage = 'Your session expired. Please log in again to continue.';
            } else if (authReason === 'account-inactive') {
                authMessage = 'This account is inactive and can no longer access the system.';
            }

            showNotice(authMessage, 'warning');
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        }

        function setForgotRecommendation(enabled) {
            const link = document.getElementById('forgotPasswordLink');
            if (!link) return;
            link.classList.toggle('recommended', enabled);
            link.textContent = enabled ? 'Forgot Password? Recommended' : 'Forgot Password?';
        }

        function resetLoginButton() {
            if (!loginButton) return;
            loginButton.textContent = 'Log In';
            loginButton.disabled = false;
            loginButton.style.background = '#1b4400';
            emailInput.disabled = false;
            passwordInput.disabled = false;
        }

        function startLoginCooldown(seconds, message, recommendForgot = false) {
            const waitSeconds = Math.max(0, Number(seconds) || 0);
            setForgotRecommendation(recommendForgot);
            showNotice(message, recommendForgot ? 'warning' : 'info');

            if (!waitSeconds) {
                resetLoginButton();
                return;
            }

            loginLockedUntil = Date.now() + (waitSeconds * 1000);
            if (loginCooldownTimer) {
                clearInterval(loginCooldownTimer);
            }

            const tick = () => {
                const remaining = Math.max(0, Math.ceil((loginLockedUntil - Date.now()) / 1000));

                if (remaining <= 0) {
                    clearInterval(loginCooldownTimer);
                    loginCooldownTimer = null;
                    loginLockedUntil = 0;
                    resetLoginButton();
                    if (!recommendForgot) {
                        clearNotice();
                    }
                    return;
                }

                if (loginButton) {
                    loginButton.textContent = `Try Again (${remaining}s)`;
                    loginButton.disabled = true;
                    loginButton.style.background = '#6b7280';
                }
                emailInput.disabled = true;
                passwordInput.disabled = true;
            };

            tick();
            loginCooldownTimer = setInterval(tick, 250);
        }
        
        // Form submission handler (DB-backed)
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (Date.now() < loginLockedUntil) {
                const remaining = Math.max(1, Math.ceil((loginLockedUntil - Date.now()) / 1000));
                showNotice(`Please wait ${remaining} seconds before trying again.`, 'warning');
                return;
            }
            
            // Clear previous errors
            clearErrors();
            clearNotice();
            setForgotRecommendation(false);
            
            // Validate form
            let isValid = true;
            
            // Validate email or username
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Email or username is required');
                isValid = false;
            }
            
            // Validate Password
            if (passwordInput.value === '') {
                showError(passwordInput, 'Password is required');
                isValid = false;
            }
            
            if (!isValid) return;

            // Show loading state
            loginButton.textContent = 'Logging in...';
            loginButton.disabled = true;
            loginButton.style.background = '#4a90e2';

            try {
                const res = await fetch('api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data.ok) {
                    const msg = data.error || 'Invalid credentials';
                    showError(passwordInput, msg);

                    if (data.lockout_seconds) {
                        startLoginCooldown(data.lockout_seconds, msg, !!data.recommend_forgot_password);
                    } else {
                        resetLoginButton();
                        if (data.recommend_forgot_password) {
                            setForgotRecommendation(true);
                            showNotice('Forgot Password is recommended after repeated failed attempts.', 'warning');
                        }
                    }
                    return;
                }

                // Redirect to dashboard after successful login
                clearNotice();
                setForgotRecommendation(false);
                loginButton.textContent = '✓ Login Successful!';
                loginButton.style.background = '#27ae60';
                setTimeout(() => {
                    window.location.href = 'app/dashboard';
                }, 700);
            } catch (err) {
                showError(passwordInput, 'Network error. Try again.');
                resetLoginButton();
            }
        });
    
    // Real-time validation on blur
    emailInput.addEventListener('blur', function() {
        if (this.value.trim() === '') {
            showError(this, 'Email or username is required');
        } else {
            clearError(this);
        }
    });
    
    passwordInput.addEventListener('blur', function() {
        if (this.value === '') {
            showError(this, 'Password is required');
        } else {
            clearError(this);
        }
    });
    
    // Clear error on input
    emailInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            clearError(this);
        }
    });
    
    passwordInput.addEventListener('input', function() {
        if (this.value !== '') {
            clearError(this);
        }
    });
    
    // Helper functions
    function showError(input, message) {
        const formGroup = input.parentElement;
        formGroup.classList.add('error');
        
        // Remove existing error message if any
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }
    
    function clearError(input) {
        const formGroup = input.parentElement;
        formGroup.classList.remove('error');
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    function clearErrors() {
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    // ============================
    // Forgot Password Flow
    // ============================
    const forgotModalOverlay = document.getElementById('forgotModalOverlay');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotModalClose = document.getElementById('forgotModalClose');

    const forgotEmailInput = document.getElementById('forgotEmail');
    const forgotSendBtn = document.getElementById('forgotSendBtn');
    const forgotStep1Error = document.getElementById('forgotStep1Error');

    const forgotIdentityConfirmBtn = document.getElementById('forgotIdentityConfirmBtn');
    const forgotCodeInput = document.getElementById('forgotVerificationCode');
    const forgotCodeHelp = document.getElementById('forgotCodeHelp');
    const forgotStep2Error = document.getElementById('forgotStep2Error');
    const forgotStep3Error = document.getElementById('forgotStep3Error');

    const forgotStep1 = document.getElementById('forgotStep1');
    const forgotStep2 = document.getElementById('forgotStep2');
    const forgotStep3 = document.getElementById('forgotStep3');
    const forgotProgressSteps = document.querySelectorAll('.forgot-progress-step');

    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const forgotResetConfirmBtn = document.getElementById('forgotResetConfirmBtn');
    let forgotResetEmail = '';

    function setForgotStep(step) {
        const map = { 1: forgotStep1, 2: forgotStep2, 3: forgotStep3 };
        Object.keys(map).forEach(k => {
            const el = map[k];
            if (!el) return;
            const isActive = parseInt(k, 10) === step;
            if (isActive) {
                el.classList.remove('forgot-hidden');
                el.setAttribute('aria-hidden', 'false');
            } else {
                el.classList.add('forgot-hidden');
                el.setAttribute('aria-hidden', 'true');
            }
        });

        forgotProgressSteps.forEach(stepItem => {
            const isActive = Number(stepItem.getAttribute('data-step')) === step;
            stepItem.classList.toggle('active', isActive);
        });

        if (step === 1 && forgotEmailInput) forgotEmailInput.focus();
        if (step === 2 && forgotCodeInput) forgotCodeInput.focus();
        if (step === 3 && newPasswordInput) newPasswordInput.focus();

        if (forgotStep1Error) forgotStep1Error.style.display = 'none';
        if (forgotStep2Error) forgotStep2Error.style.display = 'none';
        if (forgotStep3Error) forgotStep3Error.style.display = 'none';
    }

    function openForgotModal() {
        if (!forgotModalOverlay) return;
        forgotModalOverlay.setAttribute('aria-hidden', 'false');
        forgotResetEmail = '';
        if (forgotEmailInput) forgotEmailInput.value = '';
        if (forgotCodeInput) forgotCodeInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
        if (forgotCodeHelp) {
            forgotCodeHelp.textContent = 'Enter the 6-digit authentication code sent to your email.';
        }
        setForgotStep(1);
    }

    function closeForgotModal() {
        if (!forgotModalOverlay) return;
        forgotModalOverlay.setAttribute('aria-hidden', 'true');
    }

    forgotPasswordLink?.addEventListener('click', function(e) {
        e.preventDefault();
        openForgotModal();
    });

    forgotModalClose?.addEventListener('click', function() {
        closeForgotModal();
    });

    forgotModalOverlay?.addEventListener('click', function(e) {
        if (e.target === forgotModalOverlay) closeForgotModal();
    });

    forgotSendBtn?.addEventListener('click', async function() {
        const email = (forgotEmailInput?.value || '').trim();
        if (!email || !email.includes('@')) {
            if (forgotStep1Error) {
                forgotStep1Error.textContent = 'Please enter a valid email.';
                forgotStep1Error.style.display = 'block';
            }
            return;
        }

        forgotSendBtn.disabled = true;
        forgotSendBtn.textContent = 'Sending...';

        try {
            const response = await fetch('api/send_verification_code.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    purpose: 'forgot_password'
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Unable to send the authentication code.');
            }

            forgotResetEmail = email;
            if (forgotCodeHelp) {
                let helpText = data.message || 'Enter the 6-digit authentication code sent to your email.';
                if (data.masked_email && !data.superadmin_notified) {
                    helpText = `A code was sent to ${data.masked_email}. Enter it below to continue.`;
                }
                if (data.dev_code) {
                    helpText += ` Development code: ${data.dev_code}`;
                }
                forgotCodeHelp.textContent = helpText;
            }
            if (forgotCodeInput) {
                forgotCodeInput.value = '';
            }
            setForgotStep(2);
        } catch (error) {
            if (forgotStep1Error) {
                forgotStep1Error.textContent = error.message || 'Unable to send the authentication code.';
                forgotStep1Error.style.display = 'block';
            }
        } finally {
            forgotSendBtn.disabled = false;
            forgotSendBtn.textContent = 'Send Code';
        }
    });

    forgotIdentityConfirmBtn?.addEventListener('click', async function() {
        const code = (forgotCodeInput?.value || '').trim();

        if (!forgotResetEmail) {
            if (forgotStep2Error) {
                forgotStep2Error.textContent = 'Please request a new authentication code first.';
                forgotStep2Error.style.display = 'block';
            }
            setForgotStep(1);
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            if (forgotStep2Error) {
                forgotStep2Error.textContent = 'Please enter the 6-digit authentication code.';
                forgotStep2Error.style.display = 'block';
            }
            return;
        }

        forgotIdentityConfirmBtn.disabled = true;
        forgotIdentityConfirmBtn.textContent = 'Verifying...';

        try {
            const response = await fetch('api/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_reset_code',
                    email: forgotResetEmail,
                    reset_code: code
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Invalid or expired authentication code.');
            }

            setForgotStep(3);
        } catch (error) {
            if (forgotStep2Error) {
                forgotStep2Error.textContent = error.message || 'Invalid or expired authentication code.';
                forgotStep2Error.style.display = 'block';
            }
        } finally {
            forgotIdentityConfirmBtn.disabled = false;
            forgotIdentityConfirmBtn.textContent = 'Verify Code';
        }
    });

    forgotResetConfirmBtn?.addEventListener('click', async function() {
        const newPassword = (newPasswordInput?.value || '').trim();
        const confirmPassword = (confirmNewPasswordInput?.value || '').trim();
        const code = (forgotCodeInput?.value || '').trim();

        if (!newPassword) {
            if (forgotStep3Error) {
                forgotStep3Error.textContent = 'Please enter a new password.';
                forgotStep3Error.style.display = 'block';
            }
            return;
        }

        if (newPassword.length < 8) {
            if (forgotStep3Error) {
                forgotStep3Error.textContent = 'Password must be at least 8 characters.';
                forgotStep3Error.style.display = 'block';
            }
            return;
        }

        if (newPassword !== confirmPassword) {
            if (forgotStep3Error) {
                forgotStep3Error.textContent = 'Passwords do not match.';
                forgotStep3Error.style.display = 'block';
            }
            return;
        }

        forgotResetConfirmBtn.disabled = true;
        forgotResetConfirmBtn.textContent = 'Updating...';

        try {
            const response = await fetch('api/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'forgot_reset',
                    email: forgotResetEmail,
                    reset_code: code,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Unable to change the password.');
            }

            alert(data.message || 'Password changed successfully. You can now log in.');
            closeForgotModal();
        } catch (error) {
            if (forgotStep3Error) {
                forgotStep3Error.textContent = error.message || 'Unable to change the password.';
                forgotStep3Error.style.display = 'block';
            }
        } finally {
            forgotResetConfirmBtn.disabled = false;
            forgotResetConfirmBtn.textContent = 'Confirm';
        }
    });
});
</script>
</body>

</html>