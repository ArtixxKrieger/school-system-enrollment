<div class="enrollment-settings-page enrollment-container">
    <div class="enrollment-header">
        <div>
            <h1>Enrollment Settings</h1>
            <p class="section-subtitle">Configure enrollment windows and override tools for the re-enrollment workflow.</p>
        </div>
    </div>

    <div class="settings-tabs" role="tablist" aria-label="Enrollment settings tabs">
        <button class="tab-button active" data-tab="dates" role="tab" aria-selected="true">Enrollment Dates</button>
        <button class="tab-button" data-tab="logs" role="tab" aria-selected="false">Activity Logs</button>
        <button class="tab-button" data-tab="override" role="tab" aria-selected="false">Transferee Add</button>
    </div>

    <div class="tab-panel active" id="tab-dates" role="tabpanel">
        <section class="panel-card">
            <div class="panel-header">
                <h2>Enrollment Windows Setup</h2>
                <p>Set enrollment start/end dates per course. The window applies to all year levels (1st–4th).</p>
            </div>

            <div class="panel-grid">
                <label class="override-field">
                    <span>System Closing Date & Time</span>
                    <input type="datetime-local" id="systemCloseDate" placeholder="No closing date set">
                    <small style="color:#64748b;">After this date and time, the entire enrollment system will be closed.</small>
                </label>
                <label class="toggle-field">
                    <input type="checkbox" id="strictEnrollmentWindows">
                    <span>Strict enrollment window validation</span>
                </label>
                <label class="toggle-field">
                    <input type="checkbox" id="autoProgression">
                    <span>Auto progression enabled</span>
                </label>
            </div>

            <div class="enrollment-date-table-wrap">
                <table class="enrollment-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Start Date & Time</th>
                            <th>End Date & Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="windowTableBody">
                        <tr>
                            <td colspan="4" class="empty-state">Loading enrollment windows...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel-actions">
                <button class="btn-primary" id="saveAllWindows">Save All Windows</button>
                <button class="btn-secondary" id="refreshWindows">Refresh</button>
                <button class="btn-primary" id="saveAdvancedSettings">Save Advanced Settings</button>
            </div>
        </section>
    </div>


    <div class="tab-panel" id="tab-logs" role="tabpanel">
        <section class="panel-card">
            <div class="panel-header">
                <h2>Activity Logs</h2>
                <p>Recent actions performed on enrollment settings in this session.</p>
            </div>

            <div class="log-list" id="progressionLogList">
                <div class="empty-state">No activity yet.</div>
            </div>

            <div class="log-pagination" id="logPagination" hidden>
                <div class="log-pagination-info" id="logPaginationInfo">Showing 0 of 0</div>
                <div class="log-pagination-controls">
                    <button type="button" class="btn-secondary" id="logPrevBtn">Previous</button>
                    <div class="log-pagination-pages" id="logPaginationPages"></div>
                    <button type="button" class="btn-secondary" id="logNextBtn">Next</button>
                </div>
            </div>
        </section>
    </div>

    <div class="tab-panel" id="tab-override" role="tabpanel">
        <section class="panel-card">
            <div class="panel-header">
                <h2>Add Transferee Student</h2>
                <p>Use this tool to add a transferee directly to the active student list. A new student ID is generated automatically.</p>
            </div>

            <div class="override-grid">
                <label class="override-field">
                    <span>First Name</span>
                    <input type="text" id="overrideFirstName" placeholder="Enter first name">
                </label>
                <label class="override-field">
                    <span>Middle Name</span>
                    <input type="text" id="overrideMiddleName" placeholder="Optional middle name">
                </label>
                <label class="override-field">
                    <span>Last Name</span>
                    <input type="text" id="overrideLastName" placeholder="Enter last name">
                </label>
                <label class="override-field">
                    <span>Email</span>
                    <input type="email" id="overrideEmail" placeholder="student@example.com">
                </label>
                <label class="override-field">
                    <span>Phone</span>
                    <input type="text" id="overridePhone" placeholder="Optional phone number">
                </label>
                <label class="override-field">
                    <span>Course</span>
                    <select id="overrideCourse"></select>
                </label>
                <label class="override-field">
                    <span>Year Level</span>
                    <select id="overrideYear">
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                </label>
                <label class="override-field">
                    <span>Semester</span>
                    <select id="overrideSemester">
                        <option value="1">1st Sem</option>
                        <option value="2">2nd Sem</option>
                    </select>
                </label>
                <label class="override-field full-width">
                    <span>Address</span>
                    <textarea id="overrideAddress" rows="3" placeholder="Optional address"></textarea>
                </label>
                <label class="override-field full-width">
                    <span>Transferee Note</span>
                    <textarea id="overrideReason" rows="4" placeholder="Reason or note for this transferee entry"></textarea>
                </label>
            </div>
            <div class="panel-actions">
                <button class="btn-primary" id="saveOverride">Add Transferee Student</button>
            </div>
        </section>
    </div>
</div>

<div id="toastContainer" class="toast-container"></div>
