<div class="settings-container">
    <div class="settings-header">
        <h2>System Notifications</h2>
        <p>Send reports to the system and deliver them to the admin team for review.</p>
    </div>

    <div class="notification-grid">
        <section class="notification-panel">
            <div class="panel-header">
                <h3>Report to System</h3>
                <p>Submit a shared report so other admins can check and resolve the problem.</p>
            </div>

            <div class="notification-form">
                <label class="form-label">
                    Report Title
                    <input type="text" id="reportTitle" placeholder="Enter a concise report title" />
                </label>

                <label class="form-label">
                    Category
                    <select id="reportCategory">
                        <option value="issue">System Issue</option>
                        <option value="alert">Enrollment Alert</option>
                        <option value="suggestion">Improvement Suggestion</option>
                        <option value="audit">Audit Notice</option>
                    </select>
                </label>

                <label class="form-label">
                    Details
                    <textarea id="reportDetails" rows="6" placeholder="Describe what happened or what needs attention..."></textarea>
                </label>

                <div class="notification-actions">
                    <button class="btn-secondary" id="clearReport">Clear</button>
                    <button class="btn-primary" id="submitReport">Submit Report</button>
                </div>
            </div>
        </section>

        <section class="notification-panel">
            <div class="panel-header">
                <h3>Security Alerts</h3>
                <p>Automatic notices for failed logins and password recovery delivery issues.</p>
            </div>

            <div class="report-list" id="systemAlertList">
                <div class="no-reports">No security alerts recorded.</div>
            </div>
            <div class="pagination-controls" id="systemAlertPagination"></div>
        </section>

        <section class="notification-panel">
            <div class="panel-header">
                <h3>Recent Notification Reports</h3>
                <p>View the latest shared reports submitted for admin review.</p>
            </div>

            <div class="report-list" id="reportList">
                <div class="no-reports">No reports have been submitted yet.</div>
            </div>
            <div class="pagination-controls" id="reportPagination"></div>
        </section>
    </div>
</div>
