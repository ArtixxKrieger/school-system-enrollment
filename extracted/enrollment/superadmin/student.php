<?php
// Students management — list, filters, and stats (layout matches system dashboard)
?>

<div class="student-container">
    <div class="stats-grid student-stats-grid">
        <div class="stat-card">
            <div class="stat-icon student-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Total Students</h3>
                <p class="stat-number" id="totalStudents">0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon student-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Active Students</h3>
                <p class="stat-number" id="activeStudents">0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon student-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Inactive Students</h3>
                <p class="stat-number" id="inactiveStudents">0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon student-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    <path d="M8 7h8"></path>
                    <path d="M8 11h6"></path>
                </svg>
            </div>
            <div class="stat-content">
                <h3>Dropped Students</h3>
                <p class="stat-number" id="droppedStudents">0</p>
            </div>
        </div>
    </div>

    <div class="filters-section">
        <div class="filters-row">
            <div class="filter-group">
                <label for="filterCourse" class="sr-only">Course</label>
                <select id="filterCourse" class="filter-select">
                    <option value="">Course</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterYear" class="sr-only">Year Level</label>
                <select id="filterYear" class="filter-select">
                    <option value="">Year Level</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterSemester" class="sr-only">Semester</label>
                <select id="filterSemester" class="filter-select">
                    <option value="">Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterFinance" class="sr-only">Finance</label>
                <select id="filterFinance" class="filter-select">
                    <option value="">Finance</option>
                    <option value="promisory">Promisory</option>
                    <option value="fully_paid">Fully Paid</option>
                    <option value="down_payment">Down Payment</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterType" class="sr-only">Type</label>
                <select id="filterType" class="filter-select">
                    <option value="">Type</option>
                    <option value="regular">Regular</option>
                    <option value="irregular">Irregular</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="filterStatus" class="sr-only">Status</label>
                <select id="filterStatus" class="filter-select">
                    <option value="">Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                </select>
            </div>
            <div class="filter-group filter-group-search">
                <label for="searchInput" class="sr-only">Search</label>
                <div class="search-inline">
                    <input type="search" id="searchInput" class="search-input-field" placeholder="Search students..." autocomplete="off">
                    <button type="button" class="search-btn" id="searchBtn" aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="student-list-section">
        <div class="student-list-header">
            <h2>Student List</h2>
            <div class="student-list-actions">
                <div class="student-semester-controls">
                    <button type="button" class="semester-end-btn semester-end-btn-first" id="studentEndSem1Btn" title="Send 1st semester students to the re-enrollment queue">
                        <span>End 1st Sem</span>
                    </button>
                    <button type="button" class="semester-end-btn semester-end-btn-second" id="studentEndSem2Btn" title="Send 2nd semester students to the re-enrollment queue">
                        <span>End 2nd Sem</span>
                    </button>
                </div>
                <button type="button" class="export-excel-btn" id="exportStudentsBtn" title="Export student data">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Export</span>
                </button>
            </div>
        </div>
        <div class="student-table-container">
            <table class="student-table">
                <thead>
                    <tr>
                        <th class="sortable-th" data-sort="name">Name <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="email">Email <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="course">Course <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="curriculum">Curriculum <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="year_level">Year Level <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="status">Status <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="finance">Finance <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="type">Type <span class="sort-indicator"></span></th>
                        <th class="sortable-th" data-sort="enrolled_date">Enrolled Date <span class="sort-indicator"></span></th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="studentTableBody">
                </tbody>
            </table>
        </div>

        <div class="student-pagination-container">
            <div class="student-pagination-info">
                <span id="studentPaginationInfo">Showing 0 of 0</span>
            </div>
            <div class="student-pagination-controls">
                <button class="student-pagination-btn" id="studentPrevBtn" disabled>Previous</button>
                <div class="student-pagination-pages" id="studentPaginationPages"></div>
                <button class="student-pagination-btn" id="studentNextBtn" disabled>Next</button>
            </div>
        </div>
    </div>
</div>

<div id="studentNotificationContainer" class="notification-container" aria-live="polite" aria-atomic="true"></div>

<!-- Student Detail Modal -->
<div id="studentDetailsModal" class="modal-overlay" style="display: none;" onclick="closeStudentModal(event)">
    <div class="modal-container" onclick="event.stopPropagation()">
        <div class="modal-header">
            <h3>Student Details</h3>
            <div style="display:flex; align-items:center; gap:0.75rem;">
                <button type="button" class="btn-secondary" id="toggleStudentEditBtn">Edit</button>
            </div>
        </div>
        <div class="modal-body">
            <div class="student-modal-layout">
                <aside class="student-modal-sidebar">
                    <div class="student-modal-profile-card">
                        <div class="student-photo-upload">
                            <img id="viewStudentPhotoPreview" alt="Student photo preview" class="student-photo-preview" />
                            <div id="viewStudentPhotoPlaceholder" class="student-photo-placeholder">No Photo</div>
                            <button type="button" class="btn-secondary" id="viewStudentPhotoButton" disabled>Update Profile</button>
                            <input type="file" id="viewStudentPhotoInput" accept="image/*" hidden>
                        </div>
                        <h3 id="studentModalTitle" class="student-modal-name">Student Details</h3>
                        <p class="student-modal-subtitle">Student Profile</p>
                    </div>

                    <div class="student-modal-meta-grid">
                        <div class="student-detail-item">
                            <span class="detail-label">Student ID</span>
                            <strong id="studentModalId">N/A</strong>
                        </div>
                        <div class="student-detail-item">
                            <span class="detail-label">Course</span>
                            <strong id="studentModalCourse">N/A</strong>
                        </div>
                        <div class="student-detail-item">
                            <span class="detail-label">Current Year</span>
                            <strong id="studentModalYear">N/A</strong>
                        </div>
                        <div class="student-detail-item">
                            <span class="detail-label">Current Semester</span>
                            <strong id="studentModalSemester">N/A</strong>
                        </div>
                        <div class="student-detail-item">
                            <span class="detail-label">Academic Year</span>
                            <strong id="studentModalAcademicYear">N/A</strong>
                        </div>
                    </div>
                </aside>

                <div class="student-modal-main">
                    <form id="studentViewForm">
                        <input type="hidden" id="studentViewId" value="">
                        <div class="modal-section">
                            <h4>Profile & Contact</h4>
                            <p class="modal-text-muted">Course, year level, semester, and academic year can now be edited below.</p>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentFirstName">First Name</label>
                                    <input type="text" id="studentFirstName" class="form-control" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="studentMiddleName">Middle Name</label>
                                    <input type="text" id="studentMiddleName" class="form-control" disabled>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentLastName">Last Name</label>
                                    <input type="text" id="studentLastName" class="form-control" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="studentEmail">Email</label>
                                    <input type="email" id="studentEmail" class="form-control" disabled>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentPhone">Phone</label>
                                    <input type="text" id="studentPhone" class="form-control" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="studentBirthDate">Birth Date</label>
                                    <input type="date" id="studentBirthDate" class="form-control" disabled>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentGuardianContact">Guardian Contact Number</label>
                                    <input type="text" id="studentGuardianContact" class="form-control" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="studentFbName">FB Name</label>
                                    <input type="text" id="studentFbName" class="form-control" disabled>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="studentAddress">Address</label>
                                    <textarea id="studentAddress" class="form-control" rows="3" disabled></textarea>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentGender">Gender</label>
                                    <select id="studentGender" class="form-control" disabled>
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="studentCourseDisplay">Course</label>
                                    <select id="studentCourseDisplay" class="form-control" disabled>
                                        <option value="">Select course</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentYearLevelSelect">Year Level</label>
                                    <select id="studentYearLevelSelect" class="form-control" disabled>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="studentCurrentSemesterSelect">Current Semester</label>
                                    <select id="studentCurrentSemesterSelect" class="form-control" disabled>
                                        <option value="1">1st Semester</option>
                                        <option value="2">2nd Semester</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="studentAcademicYearInput">Academic Year</label>
                                    <input type="text" id="studentAcademicYearInput" class="form-control" placeholder="e.g. 2025-2026" disabled>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="studentStatus">Status</label>
                                    <select id="studentStatus" class="form-control" disabled>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                        <option value="transferred">Dropped</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="studentFinanceStatus">Finance Status</label>
                                    <select id="studentFinanceStatus" class="form-control" disabled>
                                        <option value="fully_paid">Fully Paid</option>
                                        <option value="down_payment">Down Payment</option>
                                        <option value="promisory">Promisory</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="studentFlagGroup">Flag Group</label>
                                    <select id="studentFlagGroup" class="form-control" disabled>
                                        <option value="">Select flag group</option>
                                        <option value="faithfulness">Faithfulness</option>
                                        <option value="kindness">Kindness</option>
                                        <option value="peace">Peace</option>
                                        <option value="love">Love</option>
                                        <option value="self_control">Self Control</option>
                                        <option value="joy">Joy</option>
                                        <option value="greatfulness">Greatfulness</option>
                                        <option value="gentleness">Gentleness</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>

                    <div class="modal-section">
                        <h4>Enrolled Subjects</h4>
                        <div id="studentCurriculumContent">
                            <p class="modal-text-muted">Loading enrolled subjects for this student...</p>
                        </div>
                    </div>

                    <div class="modal-section" id="irregularCurriculumSection">
                        <h4>Additional Curriculum Setup (Irregular)</h4>
                        <div class="irregular-controls" id="irregularControls">
                            <p class="modal-text-muted">Open the subject selector to choose only the curriculum subjects this student still needs to take.</p>
                            <div class="modal-inline-actions">
                                <button type="button" class="btn-secondary" id="openAdditionalCurriculumModalBtn">Select Additional Subjects</button>
                                <button type="button" class="btn-primary" id="saveAssignmentProgressBtn">Save Completion Progress</button>
                            </div>
                        </div>
                        <div id="studentAssignedCurriculumContent">
                            <p class="modal-text-muted">No additional curriculum assigned.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeStudentModal(event)">Close</button>
            <button type="button" class="btn-primary" id="saveStudentDetailsBtn" style="display:none;" disabled>Save changes</button>
        </div>
    </div>
</div>

<div id="additionalCurriculumModal" class="modal-overlay" style="display: none;" onclick="closeAdditionalCurriculumModal(event)">
    <div class="modal-container" style="max-width: 980px;" onclick="event.stopPropagation()">
        <div class="modal-header">
            <h3>Select Additional Subjects</h3>
            <button type="button" class="btn-secondary" id="closeAdditionalCurriculumModalBtn">Close</button>
        </div>
        <div class="modal-body">
            <p class="modal-text-muted">Choose the year level and semester, then select only the subjects the student needs to take.</p>
            <div class="form-row">
                <div class="form-group">
                    <label for="additionalCurriculumYear">Additional Year Level</label>
                    <select id="additionalCurriculumYear" class="form-control">
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="additionalCurriculumSemester">Semester</label>
                    <select id="additionalCurriculumSemester" class="form-control">
                        <option value="0">Both Semesters</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                    </select>
                </div>
            </div>
            <div class="available-curriculum-selection" id="availableCurriculumSelection">
                <p class="modal-text-muted">Select a year level and semester to load curriculum subjects.</p>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeAdditionalCurriculumModal(event)">Cancel</button>
            <button type="button" class="btn-primary" id="assignAdditionalCurriculumBtn">Assign Selected Subjects</button>
        </div>
    </div>
</div>
