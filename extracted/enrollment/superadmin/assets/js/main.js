// Handle stale or replaced sessions for all protected-page fetch calls.
(function () {
    if (window.__authAwareFetchInstalled || typeof window.fetch !== 'function') {
        return;
    }

    window.__authAwareFetchInstalled = true;

    const originalFetch = window.fetch.bind(window);

    function buildLoginUrl(reason) {
        const appBaseUrl = String(window.AppBaseUrl || 'app');
        const loginBase = appBaseUrl.replace(/\/app\/?$/, '/login');
        const separator = loginBase.indexOf('?') === -1 ? '?' : '&';
        return loginBase + separator + 'reason=' + encodeURIComponent(reason);
    }

    function showAuthExpiredOverlay(message) {
        const existing = document.getElementById('authExpiredOverlay');
        if (existing) {
            const messageNode = existing.querySelector('[data-auth-expired-message]');
            if (messageNode) {
                messageNode.textContent = message;
            }
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'authExpiredOverlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '24px';
        overlay.style.background = 'rgba(11, 18, 12, 0.56)';
        overlay.innerHTML =
            '<div style="max-width:460px;width:100%;background:#ffffff;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,0.24);padding:28px 24px;text-align:center;font-family:inherit;">' +
                '<div style="width:52px;height:52px;margin:0 auto 16px;border-radius:999px;background:#e7f7eb;color:#1a4d2e;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;">!</div>' +
                '<h3 style="margin:0 0 10px;color:#111827;font-size:22px;line-height:1.2;">Session Ended</h3>' +
                '<p data-auth-expired-message style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">' + message + '</p>' +
                '<p style="margin:14px 0 0;color:#1a4d2e;font-size:13px;font-weight:600;">Redirecting to login...</p>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    function handleProtectedAuthFailure(message, reason) {
        if (window.__authRedirectInProgress) {
            return;
        }

        window.__authRedirectInProgress = true;
        showAuthExpiredOverlay(message);
        window.setTimeout(function () {
            window.location.href = buildLoginUrl(reason);
        }, 1100);
    }

    window.fetch = function (input, init) {
        return originalFetch(input, init).then(function (response) {
            if (response.ok || (response.status !== 401 && response.status !== 403)) {
                return response;
            }

            return response.clone().json().then(function (data) {
                const errorMessage = data && typeof data.error === 'string' ? data.error : '';

                if (errorMessage === 'Your account was signed in on another browser.') {
                    handleProtectedAuthFailure('This account was signed in on another browser. Please log in again to continue.', 'session-replaced');
                } else if (errorMessage === 'Authentication required') {
                    handleProtectedAuthFailure('Your session has expired. Please log in again to continue.', 'session-expired');
                } else if (errorMessage === 'Account is inactive and cannot be accessed') {
                    handleProtectedAuthFailure('This account is no longer active. Please contact the administrator if you need access again.', 'account-inactive');
                }

                return response;
            }).catch(function () {
                return response;
            });
        });
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    function isMobileNav() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function setSidebarOpen(open) {
        if (!sidebar) return;
        sidebar.classList.toggle('mobile-visible', open);
        if (backdrop) {
            backdrop.hidden = !open;
            backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
        document.body.classList.toggle('sidebar-open-mobile', open);
    }

    function closeMobileSidebar() {
        if (isMobileNav()) setSidebarOpen(false);
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            if (!isMobileNav()) return;
            setSidebarOpen(!sidebar.classList.contains('mobile-visible'));
        });
    }

    if (backdrop && sidebar) {
        backdrop.addEventListener('click', closeMobileSidebar);
    }

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (link) {
        link.addEventListener('click', closeMobileSidebar);
    });

    window.addEventListener('resize', function () {
        if (!isMobileNav()) {
            sidebar?.classList.remove('mobile-visible');
            if (backdrop) {
                backdrop.hidden = true;
                backdrop.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('sidebar-open-mobile');
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobileSidebar();
    });
});

// Dark mode
(function () {
    const btn = document.getElementById('darkModeToggle');
    if (localStorage.getItem('darkMode') === '1') document.body.classList.add('dark-mode');
    if (btn) {
        btn.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? '1' : '0');
        });
    }
})();

// Sidebar collapse
(function () {
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    if (!collapseBtn || !sidebar) return;

    if (localStorage.getItem('sidebarCollapsed') === '1') {
        sidebar.classList.add('collapsed');
    }

    collapseBtn.addEventListener('click', function () {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
    });
})();

// Sidebar accordion groups
(function () {
    document.querySelectorAll('.nav-toggle').forEach(function (btn) {
        var group = btn.getAttribute('data-group');

        // Restore open state from localStorage (server-rendered open state takes precedence)
        if (group && !btn.classList.contains('open')) {
            if (localStorage.getItem('navGroup_' + group) === 'open') {
                btn.classList.add('open');
                var submenu = btn.nextElementSibling;
                if (submenu && submenu.classList.contains('nav-submenu')) {
                    submenu.classList.add('open');
                }
            }
        }

        // Mark the toggle as having an active child (for visual cue)
        var submenu = btn.nextElementSibling;
        if (submenu && submenu.querySelector('.nav-item.active')) {
            btn.classList.add('has-active-child');
        }

        btn.addEventListener('click', function () {
            var isOpen = btn.classList.toggle('open');
            var sub = btn.nextElementSibling;
            if (sub && sub.classList.contains('nav-submenu')) {
                sub.classList.toggle('open', isOpen);
            }
            if (group) {
                localStorage.setItem('navGroup_' + group, isOpen ? 'open' : 'closed');
            }
        });
    });
})();