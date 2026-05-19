<?php
// Enrollees Management Page
?>

<div class="enrollment-container enrollees-page">
    <!-- Statistics Cards -->
    <div class="enrollment-stats">
        <div class="enrollment-stat-card">
            <div class="stat-number" id="totalEnrollees">0</div>
            <div class="stat-label">Total Enrollees</div>
        </div>
        <div class="enrollment-stat-card">
            <div class="stat-number" id="pendingEnrollees">0</div> 
            <div class="stat-label">Registered Queue</div>
        </div>
        <div class="enrollment-stat-card">
            <div class="stat-number" id="approvedEnrollees">0</div>
            <div class="stat-label">Approved</div>
        </div>
    </div>

    <!-- Filters Header -->
    <div class="enrollment-header">
        <div class="enrollment-header-left">
            <div class="semester-tabs">
                <button class="semester-tab active" data-semester="1">
                    1st Semester <span class="semester-count">(0)</span>
                </button>
                <button class="semester-tab" data-semester="2">
                    2nd Semester <span class="semester-count">(0)</span>
                </button>
            </div>
            <div class="enrollment-filter-container">
                <div class="filter-group">
                    <select class="filter-select" id="statusFilter" aria-label="Enrollment Type">
                        <option value="all" selected>All Enrollees</option>
                        <option value="pre-registered">Pre-registered</option>
                        <option value="registered">Registered</option>
                        <option value="enrolled">Enrolled</option>
                    </select>
                </div>
                <div class="filter-group">
                    <select class="filter-select" id="courseFilter" aria-label="Course">
                        <option value="" disabled selected hidden>Filter by Course</option>
                        <option value="all">All Courses</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="enrollment-header-right">
            <div class="semester-info" id="semesterInfo">
                <!-- Dynamic semester information will be populated here -->
            </div>
            <div class="filter-actions">
                <div class="search-container">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" class="search-input" id="searchInput" placeholder="Search enrollees...">
                </div>
                <button class="btn-primary" id="approveAllBtn" disabled>Approve All</button>
            </div>
        </div>
    </div>

    <!-- Enrollees Section -->
    <div class="students-section">
        <div class="students-header">
            <h2 class="students-title" id="sectionTitle">All Enrollees</h2>
        </div>

        <!-- Enrollees Table -->
        <div class="students-table-container">
            <table class="students-table">
                <thead>
                    <tr>
                        <th style="width:44px; min-width:44px; text-align:center;">
                            <input type="checkbox" id="selectAllCheckbox" class="select-checkbox">
                        </th>
                        <th id="idColumnHeader">ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Curriculum</th>
                        <th>Year</th>
                        <th>Window</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="enrolleesTableBody">
                    <!-- Data will be populated by JavaScript -->
                </tbody>
            </table>
        </div>

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