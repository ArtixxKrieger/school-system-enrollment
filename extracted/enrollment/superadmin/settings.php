<div class="settings-container">
    <div class="settings-header settings-page-header">
        <div>
            <h2>Settings</h2>
            <p>Manage account tools, academic operations, records, and system maintenance from one place.</p>
        </div>
        <div class="settings-header-note">
            <strong>Admin Console</strong>
            <span>Prioritized access to enrollment, records, and backup tools.</span>
        </div>
    </div>

    <section class="settings-section settings-section-featured">
        <div class="settings-section-head">
            <h3>Academic Operations</h3>
            <p>The main operational tools used to manage enrollment flow and archived school data.</p>
        </div>
        <div class="settings-grid settings-grid-featured">
            <div class="settings-card settings-card-featured" onclick="window.location.href='<?php echo htmlspecialchars(($appBaseUrl ?? 'app') . '/enrollmentsettings', ENT_QUOTES, 'UTF-8'); ?>'">
                <div class="settings-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 4h.01"></path>
                        <path d="M16 20h.01"></path>
                        <path d="M8 8h.01"></path>
                        <path d="M8 12h.01"></path>
                        <path d="M8 16h.01"></path>
                        <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                    </svg>
                </div>
                <div class="settings-content">
                    <span class="settings-chip">Core Tool</span>
                    <h3>Enrollment Settings</h3>
                    <p>Configure enrollment rules, windows, and operational controls for the current school year.</p>
                </div>
                <div class="settings-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
            </div>

            <div class="settings-card settings-card-featured" onclick="window.location.href='<?php echo htmlspecialchars(($appBaseUrl ?? 'app') . '/records', ENT_QUOTES, 'UTF-8'); ?>'">
                <div class="settings-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        <path d="M8 7h8"></path>
                        <path d="M8 11h8"></path>
                        <path d="M8 15h5"></path>
                    </svg>
                </div>
                <div class="settings-content">
                    <span class="settings-chip">Core Tool</span>
                    <h3>Records</h3>
                    <p>Open graduated, inactive, archived, and offered-subject records for school-year review.</p>
                </div>
                <div class="settings-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
            </div>
        </div>
    </section>

    <section class="settings-section">
        <div class="settings-section-head">
            <h3>Account & Communication</h3>
            <p>Personal account access and notification tools used for daily administration.</p>
        </div>
        <div class="settings-grid settings-grid-standard">
            <div class="settings-card" onclick="window.location.href='<?php echo htmlspecialchars(($appBaseUrl ?? 'app') . '/profile', ENT_QUOTES, 'UTF-8'); ?>'">
                <div class="settings-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="settings-content">
                    <h3>Profile Management</h3>
                    <p>Update your personal information, security details, and account preferences.</p>
                </div>
                <div class="settings-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
            </div>

            <div class="settings-card" onclick="window.location.href='<?php echo htmlspecialchars(($appBaseUrl ?? 'app') . '/notification', ENT_QUOTES, 'UTF-8'); ?>'">
                <div class="settings-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                    </svg>
                </div>
                <div class="settings-content">
                    <h3>System Notifications</h3>
                    <p>Review notification reports and manage system-wide alert visibility.</p>
                </div>
                <div class="settings-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
            </div>
        </div>
    </section>
</div>




<script>
function renderCourseSchedules(schedules) {
    const container = document.getElementById('courseScheduleList');

    if (!schedules || schedules.length === 0) {
        container.innerHTML = '<p class="no-schedules">No course schedules configured yet.</p>';
        return;
    }

    container.innerHTML = schedules.map(schedule => `
        <div class="course-schedule-item" data-id="${schedule.id}">
            <div class="schedule-header">
                <h5>${schedule.course_name} (${schedule.course_code})</h5>
                <div class="schedule-actions">
                    <button class="btn-icon" onclick="editCourseSchedule(${schedule.id})" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteCourseSchedule(${schedule.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="schedule-details">
                <div class="schedule-row">
                    <span class="label">Enrollment Period:</span>
                    <span>${new Date(schedule.enrollment_start_date).toLocaleDateString()} - ${new Date(schedule.enrollment_end_date).toLocaleDateString()}</span>
                </div>
                <div class="schedule-row">
                    <span class="label">Max Slots:</span>
                    <span>${schedule.max_slots || 'Unlimited'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function addNewCourseSchedule() {
    // Open a form modal for adding new schedule
    openScheduleForm();
}

function editCourseSchedule(scheduleId) {
    // Open form modal with existing data
    openScheduleForm(scheduleId);
}

function deleteCourseSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this course schedule?')) return;

    fetch('api/course_enrollment_schedules.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheduleId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            loadEnrollmentSettings();
            alert('Course schedule deleted successfully!');
        } else {
            alert('Failed to delete course schedule: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error deleting schedule:', error);
        alert('Error deleting course schedule');
    });
}

function openScheduleForm(scheduleId = null) {
    // This would open a form modal - simplified for now
    const action = scheduleId ? 'edit' : 'add';
    const message = scheduleId ?
        'Edit course schedule functionality would open here' :
        'Add new course schedule functionality would open here';

    alert(message + '\n\nThis would open a form modal to ' + action + ' course enrollment schedules.');
}

function saveEnrollmentSettings() {
    const yearRules = [1, 2, 3, 4].map(year => ({
        year,
        enabled: document.getElementById(`year${year}Enable`).checked,
        max_units: Number(document.getElementById(`year${year}MaxUnits`).value) || 0,
        auto_approve: document.getElementById(`year${year}AutoApprove`).checked
    }));

    const settings = {
        auto_close_accounts: document.getElementById('autoCloseAccounts').value,
        strict_enrollment_windows: document.getElementById('strictEnrollmentWindows').checked,
        auto_progression: document.getElementById('autoProgression').checked,
        year_rules: yearRules
    };

    localStorage.setItem('yearEnrollmentRules', JSON.stringify(yearRules));

    fetch('api/enrollment_advanced_settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            alert('Enrollment settings saved successfully!');
            closeModal('enrollmentSettingsModal');
        } else {
            alert('Failed to save settings: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error saving settings:', error);
        alert('Error saving enrollment settings');
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}
</script>