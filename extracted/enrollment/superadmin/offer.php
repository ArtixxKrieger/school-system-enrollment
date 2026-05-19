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
                <label class="bulk-select-toggle" for="selectAllSubjects">
                    <input type="checkbox" id="selectAllSubjects" class="subject-select-all">
                    <span>Select All</span>
                </label>
                <button id="btnSubjectOffer" class="btn-filter-action btn-offer" title="Offer Selected Subjects" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 8-6-16-3 8H2"></path>
                    </svg>
                    <span id="btnSubjectOfferLabel">Offer Selected</span>
                </button>
            </div>
        </div>

        <div class="curriculum-page-note" id="subjectsPageNote">
            Select the subjects to offer, then choose the course, year level, and semester in the setup modal.
        </div>

        <div class="curriculum-table-container" style="display:none;">
            <table class="curriculum-table">
                <thead>
                    <tr>
                        <th class="subject-select-col"></th>
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
                        <td colspan="8" style="text-align: center; padding: 40px; color: #9ca3af;">Loading subjects...</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="curriculum-setup-section">
            <div id="subjectsSetupGrid" class="curriculum-setup-grid">
                <div class="curriculum-setup-empty">Loading subjects...</div>
            </div>
        </div>
    </div>

    <div id="offerSubjectsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Offer Selected Subjects</h2>
                <button type="button" class="modal-close-btn" id="offerModalClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-setup-filters">
                    <div class="filter-group">
                        <label for="offerModalCourse">Course:</label>
                        <select id="offerModalCourse" class="filter-select">
                            <option value="">Select Course</option>
                            <option value="BSCRIM">BSCRIM</option>
                            <option value="BSED">BSED</option>
                            <option value="BSIT">BSIT</option>
                            <option value="THEO">THEO</option>
                            <option value="BSBA">BSBA</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="offerModalYearLevel">Year Level:</label>
                        <select id="offerModalYearLevel" class="filter-select">
                            <option value="">Select Year Level</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="offerModalSemester">Semester:</label>
                        <select id="offerModalSemester" class="filter-select">
                            <option value="">Select Semester</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                        </select>
                    </div>
                </div>

                <div id="offerModalSummary" class="modal-setup-summary incomplete">
                    Choose the course, year level, and semester for the selected subjects.
                </div>

                <div class="curriculum-page-note" style="margin-top: 14px;">
                    The selected subjects will appear in the Offered page after saving this setup.
                </div>

                <div>
                    <h3 style="font-size: 15px; margin-bottom: 10px; color: #1f2937;">Selected Subjects</h3>
                    <ul id="offerSelectedSubjectsList" style="margin: 0; padding-left: 18px; color: #374151;">
                        <li>No subjects selected yet.</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-modal-cancel" id="offerModalCancel">Cancel</button>
                <button type="button" class="btn-modal-save" id="offerModalSave">Save Offer</button>
            </div>
        </div>
    </div>

    <div id="offerModalOverlay" class="modal-overlay"></div>
</div>
