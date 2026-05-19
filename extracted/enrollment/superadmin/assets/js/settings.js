// Replace Actual Database
document.addEventListener('DOMContentLoaded', function() {
    const settingsReadOnly = !(window.UserCan && window.UserCan.edit('settings'));

    function applySettingsPageRestrictions() {
        if (!settingsReadOnly) return;
        document.querySelectorAll('.settings-card').forEach(function (card) {
            const titleEl = card.querySelector('.settings-content h3');
            if (!titleEl) return;
            const titleText = titleEl.textContent.trim();
            if (titleText !== 'Profile Management' && titleText !== 'Log Out') {
                card.style.display = 'none';
            }
        });

        document.querySelectorAll('.settings-section').forEach(function (section) {
            const visibleCard = Array.from(section.querySelectorAll('.settings-card')).some(function (card) {
                return card.style.display !== 'none';
            });
            section.style.display = visibleCard ? '' : 'none';
        });
    }

    applySettingsPageRestrictions();

    // Initialize settings from localStorage
    loadSettings();

    // Handle file upload for backup restore
    const backupFileInput = document.getElementById('backupFile');
    if (backupFileInput) {
        backupFileInput.addEventListener('change', handleBackupFileUpload);
    }
});

// Load saved settings from localStorage
function loadSettings() {
    const savedSettings = {
        academicYear: localStorage.getItem('academicYear') || '2024-2025',
        semester: localStorage.getItem('semester') || '1st Semester',
        dateFormat: localStorage.getItem('dateFormat') || 'MM/DD/YYYY',
        emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
        enrollmentAlerts: localStorage.getItem('enrollmentAlerts') !== 'false',
        systemAnnouncements: localStorage.getItem('systemAnnouncements') !== 'false'
    };

    // Apply saved settings to form elements
    applySettings(savedSettings);
}

// Apply settings to form elements
function applySettings(settings) {
    // System preferences
    const academicYearSelect = document.querySelector('#systemPreferencesModal select:nth-of-type(1)');
    const semesterSelect = document.querySelector('#systemPreferencesModal select:nth-of-type(2)');
    const dateFormatSelect = document.querySelector('#systemPreferencesModal select:nth-of-type(3)');

    if (academicYearSelect) academicYearSelect.value = settings.academicYear;
    if (semesterSelect) semesterSelect.value = settings.semester;
    if (dateFormatSelect) dateFormatSelect.value = settings.dateFormat;

    // Notification settings
    const notificationToggles = document.querySelectorAll('#notificationModal .toggle-input');
    if (notificationToggles.length >= 4) {
        notificationToggles[0].checked = settings.emailNotifications;
        notificationToggles[1].checked = settings.enrollmentAlerts;
        notificationToggles[2].checked = settings.systemAnnouncements;
    }
}

// Save system preferences
function saveSystemPreferences() {
    const academicYear = document.querySelector('#systemPreferencesModal select:nth-of-type(1)').value;
    const semester = document.querySelector('#systemPreferencesModal select:nth-of-type(2)').value;
    const dateFormat = document.querySelector('#systemPreferencesModal select:nth-of-type(4)').value;

    // Save to localStorage
    localStorage.setItem('academicYear', academicYear);
    localStorage.setItem('semester', semester);
    localStorage.setItem('dateFormat', dateFormat);

    // Show success message
    showNotification('System preferences saved successfully!', 'success');
    closeModal('systemPreferencesModal');
}

// Save notification settings
function saveNotificationSettings() {
    const notificationToggles = document.querySelectorAll('#notificationModal .toggle-input');
    
    if (notificationToggles.length >= 4) {
        localStorage.setItem('emailNotifications', notificationToggles[0].checked);
        localStorage.setItem('enrollmentAlerts', notificationToggles[1].checked);
        localStorage.setItem('systemAnnouncements', notificationToggles[2].checked);
    }

    // Show success message
    showNotification('Notification settings saved successfully!', 'success');
    closeModal('notificationModal');
}

// Create backup for the full database
async function createBackup() {
    showNotification('Preparing full system backup...', 'info');

    try {
        const response = await fetch('api/backup.php?action=export');
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Server error while exporting backup');
        }

        const blob = await response.blob();
        const filename = getFilenameFromContentDisposition(response.headers.get('Content-Disposition'))
            || `enrollment_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.zip`;

        downloadBlob(blob, filename);
        addBackupToList(filename);
        showNotification('Full system backup downloaded successfully.', 'success');
    } catch (error) {
        console.error('Backup export failed:', error);
        showNotification('Full system backup export failed.', 'error');
    }
}

// Handle backup file upload
function handleBackupFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
        showNotification('Invalid file format. Please upload a .zip backup file.', 'error');
        event.target.value = '';
        return;
    }

    if (!confirm(`Are you sure you want to restore from ${file.name}? This will overwrite current database data.`)) {
        event.target.value = '';
        return;
    }

    showNotification('Importing backup. This may take a minute...', 'info');
    importBackup(file);
}

async function importBackup(file) {
    const formData = new FormData();
    formData.append('backupFile', file);

    try {
        const response = await fetch('api/backup.php?action=import', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error(result.error || 'Restore failed');
        }

        showNotification('Backup restored successfully. Reloading page...', 'success');
        setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
        console.error('Backup restore failed:', error);
        showNotification('Backup restore failed.', 'error');
    } finally {
        const backupFileInput = document.getElementById('backupFile');
        if (backupFileInput) {
            backupFileInput.value = '';
        }
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function getFilenameFromContentDisposition(header) {
    if (!header) return null;
    const match = /filename="?([^";]+)"?/i.exec(header);
    return match ? match[1] : null;
}

// Add backup to recent list
function addBackupToList(filename) {
    const backupList = document.querySelector('.backup-list');
    if (!backupList) return;

    const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    const backupItem = document.createElement('div');
    backupItem.className = 'backup-item';
    backupItem.innerHTML = `
        <span>${filename}</span>
        <span class="backup-date">${date}</span>
    `;

    backupList.insertBefore(backupItem, backupList.firstChild);

    // Keep only last 5 backups in the list
    while (backupList.children.length > 5) {
        backupList.removeChild(backupList.lastChild);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${getNotificationIcon(type)}
            </svg>
            <span>${message}</span>
        </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .notification-success { border-left: 4px solid #10b981; }
            .notification-error { border-left: 4px solid #ef4444; }
            .notification-info { border-left: 4px solid #3b82f6; }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
        case 'error':
            return '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
        case 'info':
        default:
            return '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';
    }
}
