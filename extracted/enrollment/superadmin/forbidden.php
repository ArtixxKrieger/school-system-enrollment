<div class="forbidden-page" style="padding: 36px; text-align: center;">
    <h1 style="font-size: 2rem; margin-bottom: 16px; color: #2d3748;">Access Denied</h1>
    <p style="font-size: 1rem; color: #4a5568; max-width: 640px; margin: 0 auto 24px;">
        You do not have permission to view the Role Management page. Only users with the <strong>superadmin</strong> role may access this section.
    </p>
    <button onclick="window.location.href='<?php echo htmlspecialchars(($appBaseUrl ?? 'app') . '/dashboard', ENT_QUOTES, 'UTF-8'); ?>'" style="padding: 12px 24px; background: #1b4400; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Return to Dashboard
    </button>
</div>
