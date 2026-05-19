document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ Enrollees JS Loaded');

    // Permission checks
    const canApproveEnrollees = window.UserCan && window.UserCan.approve('enrollees');

    // DOM Elements
    const statsElements = {
        total: document.getElementById('totalEnrollees'),
        pending: document.getElementById('pendingEnrollees'),
        approved: document.getElementById('approvedEnrollees')
    };

    const filters = {
        status: document.getElementById('statusFilter'),
        course: document.getElementById('courseFilter'),
        search: document.getElementById('searchInput')
    };

    const tableBody = document.getElementById('enrolleesTableBody');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const approveAllBtn = document.getElementById('approveAllBtn');
    const semesterTabs = document.querySelectorAll('.semester-tab');
    const pagination = {
        info: document.getElementById('paginationInfo'),
        prev: document.getElementById('prevBtn'),
        next: document.getElementById('nextBtn'),
        pages: document.getElementById('paginationPages')
    };

    let courseOptions = [];
    let currentPage = 1;
    let selectedSemester = 1;
    let currentFilters = {
        status: 'all',
        enrollment_type: '',
        course: '',
        search: ''
    };

    let strictWindows = false;
    let currentEnrollees = [];
    let curriculumIndex = {};

    // Load dynamic header with semester info
    function loadDynamicHeader(selectedSemester = 1) {
        const selectedCourse = currentFilters.course || 'all';
        fetch('api/enrollees_list.php?page=1&limit=1&semester=' + selectedSemester + '&course=' + encodeURIComponent(selectedCourse))
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    const calendar = data.calendar || data.active_semester;
                    if (!calendar) return;
                    const titleElement = document.getElementById('dynamicTitle');
                    const infoElement = document.getElementById('semesterInfo');
                    const semesterLabel = selectedSemester === 1 ? '1st Semester' : '2nd Semester';
                    const semesterMatches = calendar.semester === semesterLabel;

                    if (titleElement) {
                        titleElement.textContent = `${semesterLabel} AY ${calendar.academic_year} - Enrollees Management`;
                    }

                    if (infoElement) {
                        const today = new Date();
                        const selectedCourse = currentFilters.course || 'all';
                        const isAllCourses = selectedCourse === 'all';
                        const enrollmentOpen = calendar.start_date && calendar.end_date;
                        const strictWindows = calendar.strict_enrollment_windows === true || Number(calendar.strict_enrollment_windows) === 1;
                        const isWithinEnrollment = semesterMatches && enrollmentOpen &&
                            today >= new Date(calendar.start_date) &&
                            today <= new Date(calendar.end_date);
                        const openCoursesCount = Number(calendar.open_courses_count || 0);
                        const totalWindowCourses = Number(calendar.total_window_courses || 0);
                        const exactWindowLabel = calendar.window_source === 'course_schedule' && calendar.window_course_code
                            ? ` ${calendar.window_course_code}`
                            : '';
                        let isOpenStatus = true;
                        let statusText = 'Enrollment Open (Strict Window Off)';
                        const disabledCount = Number(calendar.auto_disabled_accounts || 0);

                        if (strictWindows) {
                            if (isAllCourses) {
                                isOpenStatus = openCoursesCount > 0;
                                if (totalWindowCourses === 0) {
                                    statusText = 'Enrollment Closed (No course windows set)';
                                } else {
                                    statusText = isOpenStatus
                                        ? `Enrollment Open (${openCoursesCount} course${openCoursesCount > 1 ? 's' : ''} open)`
                                        : 'Enrollment Closed (No open course window)';
                                }
                            } else {
                                isOpenStatus = isWithinEnrollment;
                                statusText = isWithinEnrollment ? 'Enrollment Open' : 'Enrollment Closed';
                            }
                        }

                        infoElement.innerHTML = `
                            <div class="semester-status">
                                <span class="status-indicator ${isOpenStatus ? 'active' : 'inactive'}"></span>
                                <span class="semester-text">
                                    ${statusText}${exactWindowLabel}
                                    ${enrollmentOpen ? ` (${new Date(calendar.start_date).toLocaleDateString()} - ${new Date(calendar.end_date).toLocaleDateString()})` : ''}
                                    ${disabledCount > 0 ? ` | ${disabledCount} account${disabledCount > 1 ? 's' : ''} auto-disabled` : ''}
                                </span>
                            </div>
                        `;
                    }
                }
            })
            .catch(error => console.error('Error loading calendar info:', error));
    }

    function escapeHtml(value) {
        const text = document.createTextNode(String(value || ''));
        const div = document.createElement('div');
        div.appendChild(text);
        return div.innerHTML;
    }

    function formatSemesterLabel(value) {
        const semester = Number(value);
        if (semester === 1) return '1st Sem';
        if (semester === 2) return '2nd Sem';
        return 'TBD';
    }

    function formatTextLabel(value) {
        const text = String(value || '').trim();
        if (!text) return '—';
        return text
            .replace(/_/g, ' ')
            .replace(/\b\w/g, function(char) { return char.toUpperCase(); });
    }

    function getCurriculumKey(courseCode, yearLevel, semester) {
        return [String(courseCode || '').toUpperCase(), Number(yearLevel || 0), Number(semester || 0)].join('::');
    }

    function loadCurriculumIndex() {
        fetch('api/curriculum_list.php', { credentials: 'same-origin' })
            .then(response => response.json())
            .then(data => {
                if (!data.ok || !Array.isArray(data.curriculum)) {
                    return;
                }

                curriculumIndex = {};
                data.curriculum.forEach(subject => {
                    const key = getCurriculumKey(subject.course_code, subject.year_level, subject.semester);
                    curriculumIndex[key] = (curriculumIndex[key] || 0) + 1;
                });

                if (currentEnrollees.length) {
                    renderTable(currentEnrollees);
                }
            })
            .catch(error => console.error('Error loading curriculum index:', error));
    }

    function renderCourseOptions() {
        const courseSelect = filters.course;
        if (!courseSelect) return;

        const previousValue = courseSelect.value;
        courseSelect.innerHTML = `
            <option value="" disabled ${!previousValue ? 'selected hidden' : 'hidden'}>Filter by Course</option>
            <option value="all">All Courses</option>
        `;

        courseOptions.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_code;
            option.textContent = course.course_code;
            courseSelect.appendChild(option);
        });

        if (currentFilters.course && [...courseSelect.options].some(o => o.value === currentFilters.course)) {
            courseSelect.value = currentFilters.course;
        } else if (!currentFilters.course) {
            courseSelect.value = '';
        }
    }

    function loadCourseOptions() {
        fetch('api/courses_list.php')
            .then(response => response.json())
            .then(data => {
                if (data.ok && Array.isArray(data.courses)) {
                    courseOptions = data.courses;
                    renderCourseOptions();
                }
            })
            .catch(error => console.error('Error loading courses:', error));
    }

    // Load statistics
    function loadStats() {
        fetch('api/enrollees_stats.php')
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    statsElements.total.textContent = data.stats.total;
                    statsElements.pending.textContent = data.stats.pending;
                    statsElements.approved.textContent = data.stats.approved;
                }
            })
            .catch(error => console.error('Error loading stats:', error));
    }

    // Load enrollees
    function loadEnrollees(page = 1) {
        const params = new URLSearchParams({
            page: page,
            status: currentFilters.status || 'all',
            course: currentFilters.course || 'all',
            search: currentFilters.search,
            semester: selectedSemester
        });

        if (currentFilters.enrollment_type) {
            params.set('enrollment_type', currentFilters.enrollment_type);
        }

        fetch(`api/enrollees_list.php?${params}`)
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    const semester = data.active_semester || {};
                    strictWindows = semester.strict_enrollment_windows === true || Number(semester.strict_enrollment_windows) === 1;
                    renderTable(data.enrollees);
                    renderPagination(data.pagination);
                }
            })
            .catch(error => console.error('Error loading enrollees:', error));
    }

    // Render table
    function renderTable(enrollees) {
        currentEnrollees = Array.isArray(enrollees) ? enrollees : [];

        if (!currentEnrollees.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 40px; color: #9ca3af;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px; display: block;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p style="margin: 0; font-size: 14px;">No enrollees found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = currentEnrollees.map(enrollee => {
            const rowDateValue = enrollee.display_date || enrollee.approved_date || enrollee.application_date || '';
            const rowDate = rowDateValue ? new Date(rowDateValue).toLocaleDateString() : '—';
            const fullName = [enrollee.last_name, enrollee.first_name, enrollee.middle_name]
                .filter(Boolean)
                .join(', ');
            const statusClass = `status-${String(enrollee.status || '').replace(/\s+/g, '-').toLowerCase()}`;
            const isReturning = enrollee.enrollee_type === 'returning' || enrollee.enrollment_type === 'returning';
            const linkedStudentId = enrollee.linked_student_id || enrollee.existing_student_id || '';
            const idDisplay = isReturning && linkedStudentId
                ? linkedStudentId
                : enrollee.pre_reg_number;
            const windowStatus = String(enrollee.enrollment_window_status || 'no_window');
            const windowLabel = windowStatus === 'open'
                ? 'Open'
                : windowStatus === 'closed'
                    ? 'Closed'
                    : windowStatus === 'upcoming'
                        ? 'Upcoming'
                        : 'No Window';
            const accountDisabled = Number(enrollee.account_disabled || 0) === 1;
            const showAccountFlag = accountDisabled && !isReturning;
            const windowOpen = windowStatus === 'open';
            const yearLevelDisplay = enrollee.target_year_level || enrollee.year_level || '—';
            const currentYearLevel = enrollee.current_year_level || yearLevelDisplay || '—';
            const targetYearLabel = yearLevelDisplay === '—' ? 'Year —' : `Y${yearLevelDisplay}`;
            const currentYearLabel = currentYearLevel === '—' ? 'Year —' : `Y${currentYearLevel}`;
            const semesterDisplay = formatSemesterLabel(enrollee.target_semester || selectedSemester);
            const currentSemesterDisplay = formatSemesterLabel(enrollee.current_student_semester || 0);
            const academicYearDisplay = enrollee.current_student_academic_year || enrollee.target_academic_year || '—';
            const studentStatusText = formatTextLabel(enrollee.current_student_status);
            const studentTypeText = formatTextLabel(enrollee.current_student_type);
            const financeText = formatTextLabel(enrollee.current_finance_status);
            const progressionText = formatTextLabel(enrollee.current_progression_status);
            const linkedPhone = enrollee.linked_phone || '';
            const enrolleeStatus = String(enrollee.status || '').toLowerCase();
            const statusMeta = [financeText, studentTypeText, progressionText]
                .filter(text => text && text !== '—')
                .join(' • ');
            const curriculumKey = getCurriculumKey(enrollee.course_code, yearLevelDisplay, enrollee.target_semester || selectedSemester);
            const curriculumCount = Number(curriculumIndex[curriculumKey] || 0);
            const canApproveThis = canApproveEnrollees && (windowOpen || !strictWindows);
            const curriculumHtml = `
                <div class="curriculum-cell">
                    <strong>${escapeHtml(targetYearLabel)} • ${escapeHtml(semesterDisplay)}</strong>
                    <span class="table-subtext">Current: ${escapeHtml(currentYearLabel)} • ${escapeHtml(currentSemesterDisplay)}</span>
                    <span class="curriculum-pill ${curriculumCount > 0 ? 'ready' : 'empty'}">
                        ${curriculumCount > 0 ? `${escapeHtml(curriculumCount)} subjects` : 'No setup yet'}
                    </span>
                </div>
            `;
            const isNewApplicantReady = !isReturning && enrolleeStatus === 'pre-registered';
            const isReturningWaiting = isReturning && (enrolleeStatus === 'pending' || enrolleeStatus === 'registered');
            const isReturningReady = isReturning && enrolleeStatus === 'enrolled';
            const canProcessEnrollee = canApproveThis && (isNewApplicantReady || isReturningReady);
            const actionHtml = !canApproveEnrollees
                ? '<span class="text-muted">—</span>'
                : canProcessEnrollee
                ? `<button class="btn-action approve" onclick="approveEnrollee(${enrollee.id})" title="${isReturning ? 'Re-enroll' : 'Approve'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        ${isReturning ? 'Re-enroll' : 'Approve'}
                    </button>`
                : isReturningWaiting
                ? '<span class="text-muted">Waiting for subject enrollment</span>'
                : (canApproveThis ? '<span class="text-muted">Processed</span>' : '<span class="text-muted window-blocked" title="Enrollment window not open for this year level">Window Closed</span>');

            return `
                <tr>
                    <td>
                        ${canProcessEnrollee ?
                            `<input type="checkbox" class="enrollee-checkbox" value="${enrollee.id}" data-course="${enrollee.course_id}">` :
                            ''
                        }
                    </td>
                    <td>
                        <strong>${escapeHtml(idDisplay)}</strong>
                        <div class="enrollee-id-sub">${escapeHtml(isReturning ? 'Linked student record' : 'Pre-registration record')}</div>
                    </td>
                    <td class="enrollee-name">
                        <div class="info-stack">
                            <strong>${escapeHtml(fullName)}</strong>
                            <div class="table-inline-meta">
                                <span class="enrollee-type-pill ${isReturning ? 'returning' : 'new'}">${escapeHtml(isReturning ? 'Returning' : 'New')}</span>
                                ${studentStatusText !== '—' ? `<span class="table-subtext">${escapeHtml(studentStatusText)}</span>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="info-stack">
                            <span>${escapeHtml(enrollee.email)}</span>
                            ${linkedPhone ? `<span class="table-subtext">${escapeHtml(linkedPhone)}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="info-stack">
                            <strong>${escapeHtml(enrollee.course_code || enrollee.course_name || '—')}</strong>
                            <span class="table-subtext">${escapeHtml(academicYearDisplay)}</span>
                        </div>
                    </td>
                    <td>${curriculumHtml}</td>
                    <td>
                        <div class="info-stack year-cell-stack">
                            <strong>${escapeHtml(targetYearLabel)}</strong>
                            <span class="table-subtext">${escapeHtml(isReturning ? `From ${currentYearLabel}` : 'New applicant')}</span>
                        </div>
                    </td>
                    <td><span class="window-chip window-${escapeHtml(windowStatus)}">${escapeHtml(windowLabel)}</span></td>
                    <td>
                        <span class="status-badge ${statusClass}">${escapeHtml(enrollee.status)}</span>
                        ${statusMeta ? `<div class="account-flag">${escapeHtml(statusMeta)}</div>` : ''}
                        ${showAccountFlag ? '<div class="account-flag">Account Disabled</div>' : ''}
                    </td>
                    <td>${escapeHtml(rowDate)}</td>
                    <td><div class="action-buttons">${actionHtml}</div></td>
                </tr>
            `;
        }).join('');

        updateSelectAllState();
    }

    function getSelectedEnrolleeIds() {
        return Array.from(document.querySelectorAll('.enrollee-checkbox:checked'))
            .map(cb => parseInt(cb.value, 10));
    }

    function updateApproveAllState() {
        const selectedCount = getSelectedEnrolleeIds().length;
        approveAllBtn.disabled = selectedCount === 0;
    }

    function updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.enrollee-checkbox');
        const checkedBoxes = document.querySelectorAll('.enrollee-checkbox:checked');
        selectAllCheckbox.checked = checkboxes.length > 0 && checkboxes.length === checkedBoxes.length;
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
        selectAllCheckbox.disabled = checkboxes.length === 0;
        updateApproveAllState();
    }

    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.enrollee-checkbox');
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        updateApproveAllState();
    }

    function syncSharedDataAfterApproval() {
        if (!window.SharedData || typeof window.SharedData.refreshStudents !== 'function') {
            return Promise.resolve();
        }

        return window.SharedData.refreshStudents()
            .then(() => {
                if (typeof window.SharedData.notifyListeners === 'function') {
                    window.SharedData.notifyListeners('enrolleeApproved', {});
                }
            })
            .catch((error) => {
                console.error('SharedData sync after approval failed:', error);
            });
    }

    function approveSelectedEnrollees() {
        const selectedIds = getSelectedEnrolleeIds();
        if (selectedIds.length === 0) return;
        if (!confirm(`Approve ${selectedIds.length} selected enrollee(s)?`)) return;

        approveAllBtn.disabled = true;
        const originalText = approveAllBtn.textContent;
        approveAllBtn.textContent = 'Approving...';

        fetch('api/enrollees_bulk_approve.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                enrollee_ids: selectedIds,
                admin_id: 1
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                showNotification(data.message || 'Selected enrollees approved', 'success');
                loadStats();
                loadEnrollees(currentPage);
                return syncSharedDataAfterApproval();
            } else {
                showNotification('Approve failed: ' + data.error, 'error');
            }
            return null;
        })
        .catch(error => {
            console.error('Error approving selected enrollees:', error);
            showNotification('Error approving selected enrollees', 'error');
        })
        .finally(() => {
            approveAllBtn.textContent = originalText;
            updateApproveAllState();
        });
    }

    // Render pagination
    function renderPagination(paginationData) {
        const page = Number(paginationData.page || 1);
        const total = Number(paginationData.total || 0);
        const limit = Number(paginationData.limit || 10);
        const pages = Math.max(1, Number(paginationData.pages || 1));
        const start = total === 0 ? 0 : ((page - 1) * limit) + 1;
        const end = Math.min(page * limit, total);

        currentPage = page;

        pagination.info.textContent = total === 0
            ? 'Showing 0 of 0'
            : `Showing ${start} to ${end} of ${total}`;
        pagination.prev.disabled = page <= 1;
        pagination.next.disabled = page >= pages;

        pagination.pages.innerHTML = '';

        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(pages, startPage + 4);
        startPage = Math.max(1, endPage - 4);

        for (let current = startPage; current <= endPage; current++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pagination-page' + (current === page ? ' active' : '');
            button.textContent = String(current);
            button.addEventListener('click', function () {
                loadEnrollees(current);
            });
            pagination.pages.appendChild(button);
        }
    }

    // Approve enrollee
    window.approveEnrollee = function(enrolleeId) {
        if (!confirm('Are you sure you want to approve this enrollee?')) return;

        fetch('api/enrollees_approve.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                enrollee_id: enrolleeId,
                admin_id: 1 // TODO: Get from session
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                const msg = data.is_returning
                    ? 'Student re-enrolled successfully! Student ID: ' + data.student_id
                    : 'Enrollee approved successfully! Student ID: ' + data.student_id;
                showNotification(msg, 'success');
                loadStats();
                loadEnrollees(currentPage);
                return syncSharedDataAfterApproval();
            } else {
                showNotification('Failed to approve enrollee: ' + data.error, 'error');
            }
            return null;
        })
        .catch(error => {
            console.error('Error approving enrollee:', error);
            showNotification('Error approving enrollee', 'error');
        });
    };

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `rm-notification rm-notification-${type}`;
        notification.textContent = message;

        if (!document.getElementById('rm-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'rm-notification-styles';
            style.textContent = `
                .rm-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 3000;
                    animation: slideIn 0.3s ease;
                }
                .rm-notification-success { background: #dcfce7; color: #166534; }
                .rm-notification-error { background: #fee2e2; color: #991b1b; }
                .rm-notification-info { background: #dbeafe; color: #1e40af; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .status-pre-registered { background: #fef3c7; color: #92400e; }
                .status-pending { background: #fef3c7; color: #92400e; }
                .status-registered { background: #e0f2fe; color: #0369a1; }
                .status-enrolled { background: #dbeafe; color: #1d4ed8; }
                .status-approved { background: #dcfce7; color: #166534; }
                .status-rejected { background: #fee2e2; color: #991b1b; }
                .text-muted { color: #9ca3af; font-style: italic; }
                .action-buttons { display: flex; gap: 8px; }
                .btn-action {
                    padding: 6px 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    background: white;
                    color: #374151;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }
                .btn-action:hover { background: #f9fafb; }
                .btn-action.approve { color: #059669; border-color: #059669; }
                .btn-action.approve:hover { background: #ecfdf5; }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Event listeners
    filters.status.addEventListener('change', function() {
        const val = this.value;
        const sectionTitle = document.getElementById('sectionTitle');
        const idHeader = document.getElementById('idColumnHeader');
        if (val === 'registered' || val === 'pending') {
            currentFilters.status = val === 'pending' ? 'pending' : 'registered';
            currentFilters.enrollment_type = 'returning';
            if (sectionTitle) sectionTitle.textContent = 'Registered Re-enrollees';
            if (idHeader) idHeader.textContent = 'Student ID';
            approveAllBtn.textContent = 'Re-enroll All';
        } else if (val === 'enrolled') {
            currentFilters.status = 'enrolled';
            currentFilters.enrollment_type = 'returning';
            if (sectionTitle) sectionTitle.textContent = 'Enrolled Re-enrollees';
            if (idHeader) idHeader.textContent = 'Student ID';
            approveAllBtn.textContent = 'Re-enroll All';
        } else if (val === 'pre-registered') {
            currentFilters.status = 'pre-registered';
            currentFilters.enrollment_type = 'new';
            if (sectionTitle) sectionTitle.textContent = 'Pre-registered Students';
            if (idHeader) idHeader.textContent = 'PRE Number';
            approveAllBtn.textContent = 'Approve All';
        } else {
            currentFilters.status = 'all';
            currentFilters.enrollment_type = '';
            if (sectionTitle) sectionTitle.textContent = 'All Enrollees';
            if (idHeader) idHeader.textContent = 'ID';
            approveAllBtn.textContent = 'Approve All';
        }
        loadEnrollees(1);
        loadDynamicHeader(selectedSemester);
    });

    filters.course.addEventListener('change', function() {
        currentFilters.course = this.value;
        loadEnrollees(1);
        loadDynamicHeader(selectedSemester);
    });

    filters.search.addEventListener('input', function() {
        currentFilters.search = this.value;
        loadEnrollees(1);
    });

    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    approveAllBtn.addEventListener('click', approveSelectedEnrollees);

    // Hide bulk approve controls when user lacks approve permission
    if (!canApproveEnrollees) {
        if (approveAllBtn) approveAllBtn.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.style.display = 'none';
    }

    tableBody.addEventListener('change', function(event) {
        if (event.target.classList.contains('enrollee-checkbox')) {
            updateSelectAllState();
        }
    });

    semesterTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            semesterTabs.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            selectedSemester = Number(this.getAttribute('data-semester')) || 1;
            loadDynamicHeader(selectedSemester);
            loadEnrollees(1);
        });
    });

    pagination.prev.addEventListener('click', function() {
        if (currentPage > 1) {
            loadEnrollees(currentPage - 1);
        }
    });

    pagination.next.addEventListener('click', function() {
        loadEnrollees(currentPage + 1);
    });

    // Initial load
    currentFilters.enrollment_type = '';
    loadCourseOptions();
    loadCurriculumIndex();
    loadDynamicHeader();
    loadStats();
    loadEnrollees();
});