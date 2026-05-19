<div class="records-container">

    <div class="records-stats-grid">
        <div class="records-stat-card">
            <div class="records-stat-label">Graduated</div>
            <div class="records-stat-number" id="recordsGraduatedCount">0</div>
        </div>
        <div class="records-stat-card">
            <div class="records-stat-label">Inactive / Drop</div>
            <div class="records-stat-number" id="recordsInactiveCount">0</div>
        </div>
        <div class="records-stat-card">
            <div class="records-stat-label">Archive Candidates</div>
            <div class="records-stat-number" id="recordsArchiveCandidatesCount">0</div>
        </div>
        <div class="records-stat-card">
            <div class="records-stat-label">Archived</div>
            <div class="records-stat-number" id="recordsArchivedCount">0</div>
        </div>
        <div class="records-stat-card">
            <div class="records-stat-label">Active Offered Subjects</div>
            <div class="records-stat-number" id="recordsOfferedActiveCount">0</div>
        </div>
    </div>

    <div class="records-toolbar">
        <div class="records-search-wrap">
            <input type="search" id="recordsSearchInput" class="records-search-input" placeholder="Search name, email, or student ID">
            <button type="button" class="records-btn records-btn-secondary" id="recordsSearchBtn">Search</button>
        </div>
        <div class="records-action-wrap">
            <button type="button" class="records-btn records-btn-secondary" id="recordsRefreshBtn">Refresh</button>
            <?php if (has_permission('student', 'edit') || has_permission('settings', 'edit')): ?>
            <button type="button" class="records-btn records-btn-primary" id="recordsArchiveBtn">Archive Graduates 3+ Years</button>
            <?php endif; ?>
        </div>
    </div>

    <div id="recordsFlashMessage" class="records-flash" style="display:none;"></div>

    <div class="records-tabs" role="tablist" aria-label="Records sections">
        <button type="button" class="records-tab active" data-target="graduated">Graduated Students</button>
        <button type="button" class="records-tab" data-target="inactive">Inactive / Drop</button>
        <button type="button" class="records-tab" data-target="archived">Archived Graduates</button>
        <button type="button" class="records-tab" data-target="offered">Offered Subjects</button>
    </div>

    <div class="records-panel active" data-panel="graduated">
        <div class="records-table-wrap">
            <table class="records-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Graduated Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="recordsGraduatedBody">
                    <tr><td colspan="7" class="records-empty-row">Loading records...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="records-panel" data-panel="inactive">
        <div class="records-table-wrap">
            <table class="records-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Updated Record</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="recordsInactiveBody">
                    <tr><td colspan="7" class="records-empty-row">Loading records...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="records-panel" data-panel="archived">
        <div class="records-table-wrap">
            <table class="records-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Year</th>
                        <th>Graduated Date</th>
                        <th>Archived Date</th>
                        <th>Reason</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="recordsArchivedBody">
                    <tr><td colspan="8" class="records-empty-row">Loading records...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

    <!-- Offered Subjects Archive Panel -->
    <div class="records-panel" data-panel="offered">
        <div class="records-page-note" id="offeredPageNote">
            Archive offered subjects by academic year to clear the schedule for a new year. Archived offerings can be restored at any time.
        </div>

        <div class="records-toolbar" style="margin-bottom:16px;">
            <div class="records-action-wrap" style="gap:10px; align-items:center; flex-wrap:wrap;">
                <label for="offeredArchiveYearInput" style="font-size:13px; font-weight:600; color:inherit;">Academic Year:</label>
                <input type="text" id="offeredArchiveYearInput" class="records-search-input" placeholder="e.g. 2024-2025" style="max-width:160px;" pattern="\d{4}-\d{4}">
                <?php if (has_permission('subjects', 'edit') || has_permission('settings', 'edit')): ?>
                <button type="button" class="records-btn records-btn-primary" id="offeredArchiveYearBtn">Archive This Year</button>
                <button type="button" class="records-btn records-btn-secondary" id="offeredArchiveAllBtn">Archive All Active</button>
                <?php endif; ?>
                <button type="button" class="records-btn records-btn-secondary" id="offeredRefreshBtn">Refresh</button>
            </div>
        </div>

        <div id="offeredFlashMessage" class="records-flash" style="display:none;"></div>

        <h4 style="font-size:15px; font-weight:600; margin:0 0 10px; color:inherit;">Currently Active Offerings</h4>
        <div class="records-table-wrap" style="margin-bottom:24px;">
            <table class="records-table">
                <thead>
                    <tr>
                        <th>Academic Year</th>
                        <th>Subjects Offered</th>
                        <th>Courses Covered</th>
                        <th>Last Updated</th>
                        <?php if (has_permission('subjects', 'edit') || has_permission('settings', 'edit')): ?>
                        <th>Action</th>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody id="offeredActiveBody">
                    <tr><td colspan="5" class="records-empty-row">Loading...</td></tr>
                </tbody>
            </table>
        </div>

        <h4 style="font-size:15px; font-weight:600; margin:0 0 10px; color:inherit;">Archived Offerings</h4>
        <div class="records-table-wrap">
            <table class="records-table">
                <thead>
                    <tr>
                        <th>Academic Year</th>
                        <th>Subjects Archived</th>
                        <th>Courses Covered</th>
                        <th>Archived Date</th>
                        <?php if (has_permission('subjects', 'edit') || has_permission('settings', 'edit')): ?>
                        <th>Action</th>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody id="offeredArchivedBody">
                    <tr><td colspan="5" class="records-empty-row">No archived offerings yet.</td></tr>
                </tbody>
            </table>
        </div>
    </div>

