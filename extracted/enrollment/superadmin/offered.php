<div class="curriculum-container">
    <div class="curriculum-section">
        <div class="curriculum-filters">
            <div class="filter-group">
                <label for="subjectCourseFilter">Course:</label>
                <select id="subjectCourseFilter" class="filter-select">
                    <option value="all">All Courses</option>
                    <option value="BSCRIM">BSCRIM</option>
                    <option value="BSED">BSED</option>
                    <option value="BSIT">BSIT</option>
                    <option value="THEO">THEO</option>
                    <option value="BSBA">BSBA</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="subjectYearLevelFilter">Year Level:</label>
                <select id="subjectYearLevelFilter" class="filter-select">
                    <option value="all">All Year Levels</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="subjectSemesterFilter">Semester:</label>
                <select id="subjectSemesterFilter" class="filter-select">
                    <option value="all">All Semesters</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                </select>
            </div>
            <div class="filter-actions">
                <button id="btnBatchPreviewCOR" class="btn-filter-action btn-preview" title="Preview the COR layout for matching students" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Preview COR</span>
                </button>
                <button id="btnBatchPrintCOR" class="btn-filter-action btn-print" title="Print COR for all matching students" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V2h12v7"></path>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    <span>Print COR</span>
                </button>
            </div>
        </div>

        <div class="curriculum-page-note" id="subjectsPageNote">
            View the subjects that are already offered based on the saved course, year level, and semester setup.
        </div>

        <div class="curriculum-table-container" style="display:none;">
            <table class="curriculum-table">
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Subject Code</th>
                        <th>Subject Description</th>
                        <th>Year Level</th>
                        <th>Semester</th>
                        <th>Units</th>
                        <th>Prerequisites</th>
                    </tr>
                </thead>
                <tbody id="subjectsTableBody">
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">Loading offered subjects...</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="curriculum-setup-section">
            <div id="subjectsSetupGrid" class="curriculum-setup-grid">
                <div class="curriculum-setup-empty">Loading offered subjects...</div>
            </div>
        </div>
    </div>

    <div id="batchPrintCorModal" class="modal">
        <div class="modal-content cor-batch-modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Batch Print Certificate of Registration</h2>
                <button type="button" class="modal-close-btn" id="batchPrintCorClose">&times;</button>
            </div>
            <div class="modal-body">
                <div id="batchPrintSummary" class="modal-setup-summary incomplete">
                    Select a course, year level, and semester to prepare the batch COR preview.
                </div>

                <div class="form-row cor-batch-form-row">
                    <div class="form-group">
                        <label for="corAcademicYearInput">Academic Year</label>
                        <input type="text" id="corAcademicYearInput" placeholder="e.g. 2025-2026">
                    </div>
                    <div class="form-group">
                        <label for="corTuitionFeeInput">Tuition Fee</label>
                        <input type="number" id="corTuitionFeeInput" min="0" step="0.01" value="0">
                    </div>
                    <div class="form-group">
                        <label for="corMiscFeeInput">Misc. Fee</label>
                        <input type="number" id="corMiscFeeInput" min="0" step="0.01" value="0">
                    </div>
                </div>

                <div class="curriculum-page-note">
                    Enter the date, time, and professor for each subject below. These details will be used for all matching students in the selected setup.
                </div>

                <div class="curriculum-table-container cor-schedule-editor">
                    <table class="curriculum-table cor-schedule-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Professor</th>
                            </tr>
                        </thead>
                        <tbody id="corScheduleTableBody">
                            <tr>
                                <td colspan="4" style="text-align:center; padding: 24px; color: #9ca3af;">Select a setup to load the schedule fields.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div id="corBatchStudentCount" class="curriculum-page-note">
                    The preview will show one A4 page per matching student with Student Copy and Registrar Copy.
                </div>

                <div id="corMatchingStudentsInfo" class="cor-matching-students-info">
                    <div class="curriculum-setup-empty">Student information will appear here after the preview is generated.</div>
                </div>

                <div id="corPrintPreview" class="cor-print-preview">
                    <div class="curriculum-setup-empty">Prepare the setup above to preview the COR batch print layout.</div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-modal-cancel" id="batchPrintCorCancel">Cancel</button>
                <button type="button" class="btn-modal-cancel" id="batchPrintPreviewBtn">Preview Layout</button>
                <button type="button" class="btn-modal-save" id="batchPrintCorPrintBtn">Print</button>
            </div>
        </div>
    </div>

    <div id="batchPrintCorOverlay" class="modal-overlay"></div>
</div>
