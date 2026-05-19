<div class="curriculum-container">
    <!-- Curriculum Section -->
    <div class="curriculum-section">
        <!-- Filters -->
        <div class="curriculum-filters">
            <div class="filter-group">
                <label for="courseFilter">Course:</label>
                <select id="courseFilter" class="filter-select">
                    <option value="all">All Courses</option>
                    <option value="BSCRIM">BSCRIM</option>
                    <option value="BSED">BSED</option>
                    <option value="BSIT">BSIT</option>
                    <option value="THEO">THEO</option>
                    <option value="BSBA">BSBA</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="yearLevelFilter">Year Level:</label>
                <select id="yearLevelFilter" class="filter-select">
                    <option value="all">All Year Levels</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="semesterFilter">Semester:</label>
                <select id="semesterFilter" class="filter-select">
                    <option value="all">All Semesters</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                </select>
            </div>
            <!-- Action Buttons on Right Side -->
            <div class="filter-actions">
                <button id="btnAdd" class="btn-filter-action btn-add" title="Add Subject">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add
                </button>
                <button id="btnImport" class="btn-filter-action btn-import" title="Import Curriculum">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Import
                </button>
                <button id="btnEdit" class="btn-filter-action btn-edit" title="Edit Subject">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button id="btnDelete" class="btn-filter-action btn-delete" title="Delete Subject">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>

        <div class="curriculum-page-note" id="curriculumPageNote">
            Set up subjects by course, year level, and semester. Click a subject row to select it for editing or deletion.
        </div>

        <div id="curriculumImportPanel" class="curriculum-import-panel" hidden>
            <div class="curriculum-import-header">
                <h3>Import Curriculum</h3>
                <p>Upload a file with these columns: Subject Code, Subject Description, Units, and Prerequisites (optional).</p>
            </div>
            <form id="curriculumImportForm" enctype="multipart/form-data">
                <div class="curriculum-import-grid">
                    <div class="filter-group">
                        <label for="importCourseFilter">Course:</label>
                        <select id="importCourseFilter" name="course_code" class="filter-select" required>
                            <option value="">Select Course</option>
                            <option value="BSCRIM">BSCRIM</option>
                            <option value="BSED">BSED</option>
                            <option value="BSIT">BSIT</option>
                            <option value="THEO">THEO</option>
                            <option value="BSBA">BSBA</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="importYearLevelFilter">Year Level:</label>
                        <select id="importYearLevelFilter" name="year_level" class="filter-select" required>
                            <option value="">Select Year Level</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="importSemesterFilter">Semester:</label>
                        <select id="importSemesterFilter" name="semester" class="filter-select" required>
                            <option value="">Select Semester</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="importCurriculumFile">Import File:</label>
                        <input type="file" id="importCurriculumFile" name="import_file" class="curriculum-import-file" required>
                        <small class="curriculum-import-note">Spreadsheet and text-based uploads are supported as long as the column format matches.</small>
                    </div>
                </div>
                <div class="curriculum-import-actions">
                    <button type="button" id="btnCancelImport" class="btn-filter-action">Cancel</button>
                    <button type="submit" id="btnSubmitImport" class="btn-filter-action btn-import">Import Curriculum</button>
                </div>
            </form>
        </div>

        <!-- Hidden table for data management -->
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
                <tbody id="curriculumTableBody">
                    <!-- Data will be loaded dynamically -->
                </tbody>
            </table>
        </div>

        <div class="curriculum-setup-section">
            <div id="curriculumSetupGrid" class="curriculum-setup-grid">
                <div class="curriculum-setup-empty">No curriculum setup available yet.</div>
            </div>
        </div>
    </div>

    <!-- Add Subject Modal -->
    <div id="addSubjectModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Add Subject</h2>
                <button type="button" class="modal-close-btn" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-setup-filters">
                    <div class="filter-group">
                        <label for="modalCourseFilter">Course:</label>
                        <select id="modalCourseFilter" class="filter-select">
                            <option value="">Select Course</option>
                            <option value="BSCRIM">BSCRIM</option>
                            <option value="BSED">BSED</option>
                            <option value="BSIT">BSIT</option>
                            <option value="THEO">THEO</option>
                            <option value="BSBA">BSBA</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="modalYearLevelFilter">Year Level:</label>
                        <select id="modalYearLevelFilter" class="filter-select">
                            <option value="">Select Year Level</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="modalSemesterFilter">Semester:</label>
                        <select id="modalSemesterFilter" class="filter-select">
                            <option value="">Select Semester</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                        </select>
                    </div>
                </div>
                <div id="modalSetupSummary" class="modal-setup-summary">
                    Select the course, year level, and semester for the subjects below.
                </div>
                <div id="formRowsContainer" class="form-rows-container">
                    <!-- Form rows will be added here -->
                </div>
                <button type="button" class="btn-add-row" id="btnAddRow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Another Subject
                </button>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-modal-cancel" id="btnModalCancel">Cancel</button>
                <button type="button" class="btn-modal-save" id="btnModalSave">Save</button>
            </div>
        </div>
    </div>

    <!-- Modal Overlay -->
    <div id="modalOverlay" class="modal-overlay"></div>