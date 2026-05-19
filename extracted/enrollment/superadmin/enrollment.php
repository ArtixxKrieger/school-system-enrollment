<div class="enrollment-container">
    <!-- Statistics Cards -->
    <div class="enrollment-stats">
        <div class="enrollment-stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Enrolled Students</div>
        </div>
        <div class="enrollment-stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Pending Applications</div>
        </div>
        <div class="enrollment-stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Total Capacity</div>
        </div>
    </div>

    <!-- Header Section -->
    <div class="enrollment-header">
        <div class="enrollment-header-left">
            <!-- Semester Tabs-->
            <div class="semester-tabs">
                <button class="semester-tab active" data-semester="1">
                    1st Semester <span class="semester-count">(0)</span>
                </button>
                <button class="semester-tab" data-semester="2">
                    2nd Semester <span class="semester-count">(0)</span>
                </button>
            </div>
        </div>
        
        <!-- Filter Dropdowns -->
        <div class="enrollment-filter-container">
            <div class="filter-group">
                <select class="filter-select" id="courseFilter" aria-label="Course filter">
                    <option value="ALL">All Courses</option>
                </select>
            </div>
            <div class="filter-group">
                <select class="filter-select" id="yearLevelFilter" aria-label="Year level filter">
                    <option value="ALL">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>
            <div class="filter-group">
                <select class="filter-select" id="semesterFilter" aria-label="Semester filter">
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Students Section -->
    <div class="students-section">
        <div class="students-header">
            <h2 class="students-title section-title">1st Year - 1st Semester Students</h2>
            <div class="students-actions">
                <button type="button" class="btn-import-student" id="openImportStudentsBtn" onclick="if (window.openImportStudentsModal) { window.openImportStudentsModal(); }">Import File</button>
            </div>
        </div>

        <!-- Students Table -->
        <div class="students-table-container">
            <table class="students-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Enrollment Date</th>
                    </tr>
                </thead>
                <tbody id="studentsTableBody">

                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af;">No enrolled students found</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
            <div class="pagination-info">
                <span id="paginationInfo">Showing 1 of 1</span>
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" id="prevBtn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Previous
                </button>
                <div class="pagination-pages" id="paginationPages"></div>
                <button class="pagination-btn" id="nextBtn">
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<div class="enrollment-modal-overlay" id="importStudentsModal" aria-hidden="true" hidden>
    <div class="enrollment-modal import-students-modal" role="dialog" aria-modal="true" aria-labelledby="importStudentsTitle">
        <div class="enrollment-modal-header import-modal-header-row">
            <h3 id="importStudentsTitle">Import Students</h3>
            <button type="button" class="modal-close-btn" id="closeImportStudentsBtn" aria-label="Close import modal" onclick="if (window.closeImportStudentsModal) { window.closeImportStudentsModal(); }">&times;</button>
        </div>
        <form id="importStudentsForm" enctype="multipart/form-data">
            <div class="enrollment-modal-body">
                <p class="import-helper-text">
                    Upload the exact attendance sheet format shown: NO., Name, Gender, Address, Contact Number, Gmail, FB Account, Guardian's Contact No., and Flag Group. Extra title rows above the table are okay and will be ignored automatically.
                </p>

                <div class="import-form-grid">
                    <div class="import-form-group">
                        <label for="importCourseId">Course</label>
                        <select id="importCourseId" name="course_id" class="filter-select" required>
                            <option value="">Select course</option>
                        </select>
                    </div>
                    <div class="import-form-group">
                        <label for="importYearLevel">Year Level</label>
                        <select id="importYearLevel" name="year_level" class="filter-select" required>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                    <div class="import-form-group">
                        <label for="importSemester">Semester</label>
                        <select id="importSemester" name="semester" class="filter-select" required>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                        </select>
                    </div>
                    <div class="import-form-group">
                        <label for="importEnrollmentDate">Enrollment Date</label>
                        <input type="date" id="importEnrollmentDate" name="enrollment_date" class="filter-select" required>
                    </div>
                    <div class="import-form-group">
                        <label for="importAcademicYear">Academic Year</label>
                        <input type="text" id="importAcademicYear" name="academic_year" class="filter-select" placeholder="2026-2027" required>
                    </div>
                    <div class="import-form-group">
                        <label for="importBatchNumber">Batch Number</label>
                        <input type="text" id="importBatchNumber" name="batch_number" class="filter-select" placeholder="2026" required>
                    </div>
                    <div class="import-form-group">
                        <label for="importDefaultPassword">Default Password</label>
                        <input type="text" id="importDefaultPassword" name="default_password" class="filter-select" value="student123">
                    </div>
                </div>

                <div class="import-form-group import-upload-group">
                    <label for="importStudentFile">Import file</label>
                    <input type="file" id="importStudentFile" name="import_file" required>
                    <small class="import-file-note">Any spreadsheet or text file can be uploaded. As long as the columns follow the same format, the importer will try to read it automatically.</small>
                </div>
            </div>
            <div class="enrollment-modal-footer import-modal-footer">
                <button type="button" class="btn-secondary" id="cancelImportStudentsBtn" onclick="if (window.closeImportStudentsModal) { window.closeImportStudentsModal(); }">Cancel</button>
                <button type="submit" class="btn-add-student" id="submitImportStudentsBtn">Import Students</button>
            </div>
        </form>
    </div>
</div>