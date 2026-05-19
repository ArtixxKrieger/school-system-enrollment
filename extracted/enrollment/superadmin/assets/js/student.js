document.addEventListener('DOMContentLoaded', function () {
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let currentStudents = [];
    let curriculumIndex = {};
    let availableCourses = [];
    let sortColumn = null;
    let sortDir = 'asc';

    const statsEls = {
        total: document.getElementById('totalStudents'),
        active: document.getElementById('activeStudents'),
        inactive: document.getElementById('inactiveStudents'),
        dropped: document.getElementById('droppedStudents'),
    };

    const filterCourse = document.getElementById('filterCourse');
    const filterYear = document.getElementById('filterYear');
    const filterSemester = document.getElementById('filterSemester');
    const filterFinance = document.getElementById('filterFinance');
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const dropFilterBtn = document.getElementById('dropFilterBtn');
    const exportStudentsBtn = document.getElementById('exportStudentsBtn');
    const studentEndSem1Btn = document.getElementById('studentEndSem1Btn');
    const studentEndSem2Btn = document.getElementById('studentEndSem2Btn');
    const tableBody = document.getElementById('studentTableBody');
    const studentPaginationInfo = document.getElementById('studentPaginationInfo');
    const studentPaginationPages = document.getElementById('studentPaginationPages');
    const studentPrevBtn = document.getElementById('studentPrevBtn');
    const studentNextBtn = document.getElementById('studentNextBtn');
    const studentViewModal = document.getElementById('studentDetailsModal');
    const studentViewForm = document.getElementById('studentViewForm');
    const studentViewId = document.getElementById('studentViewId');
    const studentFirstName = document.getElementById('studentFirstName');
    const studentMiddleName = document.getElementById('studentMiddleName');
    const studentLastName = document.getElementById('studentLastName');
    const studentEmail = document.getElementById('studentEmail');
    const studentPhone = document.getElementById('studentPhone');
    const studentGuardianContact = document.getElementById('studentGuardianContact');
    const studentFbName = document.getElementById('studentFbName');
    const studentAddress = document.getElementById('studentAddress');
    const studentBirthDate = document.getElementById('studentBirthDate');
    const studentGender = document.getElementById('studentGender');
    const studentCourseDisplay = document.getElementById('studentCourseDisplay');
    const studentYearLevelSelect = document.getElementById('studentYearLevelSelect');
    const studentCurrentSemesterSelect = document.getElementById('studentCurrentSemesterSelect');
    const studentAcademicYearInput = document.getElementById('studentAcademicYearInput');
    const studentStatus = document.getElementById('studentStatus');
    const studentFinanceStatus = document.getElementById('studentFinanceStatus');
    const studentFlagGroup = document.getElementById('studentFlagGroup');
    const studentViewPhotoButton = document.getElementById('viewStudentPhotoButton');
    const studentViewPhotoInput = document.getElementById('viewStudentPhotoInput');
    const studentViewPhotoPreview = document.getElementById('viewStudentPhotoPreview');
    const studentViewPhotoPlaceholder = document.getElementById('viewStudentPhotoPlaceholder');
    const toggleStudentEditBtn = document.getElementById('toggleStudentEditBtn');
    const saveStudentDetailsBtn = document.getElementById('saveStudentDetailsBtn');
    const studentNotificationContainer = document.getElementById('studentNotificationContainer');
    const irregularCurriculumSection = document.getElementById('irregularCurriculumSection');
    const irregularControls = document.getElementById('irregularControls');
    const openAdditionalCurriculumModalBtn = document.getElementById('openAdditionalCurriculumModalBtn');
    const additionalCurriculumModal = document.getElementById('additionalCurriculumModal');
    const closeAdditionalCurriculumModalBtn = document.getElementById('closeAdditionalCurriculumModalBtn');
    const additionalCurriculumYear = document.getElementById('additionalCurriculumYear');
    const additionalCurriculumSemester = document.getElementById('additionalCurriculumSemester');
    const availableCurriculumSelection = document.getElementById('availableCurriculumSelection');
    const assignAdditionalCurriculumBtn = document.getElementById('assignAdditionalCurriculumBtn');
    const saveAssignmentProgressBtn = document.getElementById('saveAssignmentProgressBtn');
    const studentAssignedCurriculumContent = document.getElementById('studentAssignedCurriculumContent');

    const studentCanEdit = window.UserCan && window.UserCan.edit('student');
    const studentCanDelete = window.UserCan && window.UserCan.del('student');
    const studentCanEditFlagGroup = window.UserCan && window.UserCan.edit('student');
    const studentCanManageIrregular = window.UserCan && window.UserCan.edit('student');
    const studentCanManageSemester = window.UserCan && window.UserCan.edit('settings');

    function escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    function formatEnrolledDate(raw) {
        if (!raw) return '—';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return escapeHtml(String(raw));
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatCurrency(value) {
        var amount = parseFloat(value);
        if (Number.isNaN(amount)) return '—';
        return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function statusBadgeClass(status) {
        switch (status) {
            case 'active':
                return 'status-active';
            case 'inactive':
                return 'status-inactive';
            case 'graduated':
                return 'status-graduated';
            case 'transferred':
                return 'status-dropped';
            case 'archived':
                return 'status-inactive';
            default:
                return 'status-inactive';
        }
    }

    function statusLabel(status) {
        if (status === 'transferred') return 'Dropped';
        if (status === 'archived') return 'Archived';
        if (!status) return '—';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    function fullName(s) {
        return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ').trim();
    }

    function courseLabel(s) {
        const code = s.course_code || '';
        const name = s.course_name || '';
        return code || name || '—';
    }

    function formatSemesterLabel(value) {
        const semester = Number(value);
        if (semester === 1) return '1st Semester';
        if (semester === 2) return '2nd Semester';
        return 'TBD';
    }

    function getCurriculumKey(courseCode, yearLevel, semester) {
        return [String(courseCode || '').toUpperCase(), Number(yearLevel || 0), Number(semester || 0)].join('::');
    }

    function loadCurriculumIndex() {
        fetch('api/curriculum_list.php', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok || !Array.isArray(data.curriculum)) return;
                curriculumIndex = {};
                data.curriculum.forEach(function (subject) {
                    var key = getCurriculumKey(subject.course_code, subject.year_level, subject.semester);
                    curriculumIndex[key] = (curriculumIndex[key] || 0) + 1;
                });
                renderTable(currentStudents);
            })
            .catch(function (err) {
                console.error('Error loading curriculum index:', err);
            });
    }

    function populateStudentCourseOptions(selectedId, fallbackLabel) {
        if (!studentCourseDisplay) return;

        const preferredValue = String(selectedId || studentCourseDisplay.value || '');
        studentCourseDisplay.innerHTML = '<option value="">Select course</option>';

        availableCourses.forEach(function (c) {
            const opt = document.createElement('option');
            opt.value = String(c.id);
            opt.textContent = c.course_code || c.course_name || 'Unknown';
            studentCourseDisplay.appendChild(opt);
        });

        if (preferredValue && [...studentCourseDisplay.options].some(function (o) { return o.value === preferredValue; })) {
            studentCourseDisplay.value = preferredValue;
        } else if (fallbackLabel) {
            const fallbackOption = document.createElement('option');
            fallbackOption.value = preferredValue;
            fallbackOption.textContent = fallbackLabel;
            studentCourseDisplay.appendChild(fallbackOption);
            studentCourseDisplay.value = preferredValue;
        }
    }

    function populateCourseOptions(courses) {
        availableCourses = Array.isArray(courses) ? courses : [];

        if (filterCourse) {
            const prev = filterCourse.value;
            filterCourse.innerHTML = '<option value="">Course</option>';
            availableCourses.forEach(function (c) {
                const opt = document.createElement('option');
                opt.value = String(c.id);
                opt.textContent = c.course_code || c.course_name || 'Unknown';
                filterCourse.appendChild(opt);
            });
            if (prev && [...filterCourse.options].some(function (o) { return o.value === prev; })) {
                filterCourse.value = prev;
            }
        }

        populateStudentCourseOptions(currentStudentData && currentStudentData.course_id, currentStudentData ? courseLabel(currentStudentData) : '');
    }

    function loadStats() {
        fetch('api/students_stats.php')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) return;
                if (statsEls.total) statsEls.total.textContent = data.stats.total;
                if (statsEls.active) statsEls.active.textContent = data.stats.active;
                if (statsEls.inactive) statsEls.inactive.textContent = data.stats.inactive;
                if (statsEls.dropped) statsEls.dropped.textContent = data.stats.dropped;
            })
            .catch(function (err) { console.error('Error loading stats:', err); });
    }

    function buildListUrl() {
        const params = new URLSearchParams();
        const q = (searchInput && searchInput.value) ? searchInput.value.trim() : '';
        if (q) params.set('search', q);
        if (filterCourse && filterCourse.value) params.set('course_id', filterCourse.value);
        if (filterYear && filterYear.value) params.set('year_level', filterYear.value);
        if (filterFinance && filterFinance.value) params.set('finance_status', filterFinance.value);
        if (filterType && filterType.value) params.set('type', filterType.value);
        if (filterStatus && filterStatus.value) params.set('status', filterStatus.value);
        const qs = params.toString();
        return qs ? `api/students_list.php?${qs}` : 'api/students_list.php';
    }

    async function exportStudentTemplate() {
        if (exportStudentsBtn) {
            exportStudentsBtn.disabled = true;
        }

        try {
            const listUrl = buildListUrl();
            const query = listUrl.indexOf('?') >= 0 ? listUrl.split('?')[1] : '';
            const exportUrl = query ? `api/students_export.php?${query}` : 'api/students_export.php';

            const response = await fetch(exportUrl, {
                method: 'GET',
                credentials: 'same-origin'
            });

            const contentType = String(response.headers.get('Content-Type') || '').toLowerCase();
            if (!response.ok || contentType.includes('application/json')) {
                const text = await response.text();
                let message = 'Student export failed';

                try {
                    const data = JSON.parse(text);
                    message = data.error || message;
                    if (data.details) {
                        message += ': ' + data.details;
                    }
                } catch (parseError) {
                    if (text.trim()) {
                        message = text.trim();
                    }
                }

                throw new Error(message);
            }

            const blob = await response.blob();
            const disposition = response.headers.get('Content-Disposition') || '';
            const match = /filename="?([^";]+)"?/i.exec(disposition);
            const filename = match && match[1]
                ? match[1]
                : `students_export_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xls`;

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showNotification('Student export downloaded successfully.', 'success');
        } catch (error) {
            console.error('Student export failed:', error);
            showNotification(error && error.message ? error.message : 'Student export failed.', 'error');
        } finally {
            if (exportStudentsBtn) {
                exportStudentsBtn.disabled = false;
            }
        }
    }

    function createPageButton(pageNumber, isActive) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'student-page-number' + (isActive ? ' active' : '');
        button.textContent = String(pageNumber);
        button.addEventListener('click', function () {
            currentPage = pageNumber;
            renderTable(currentStudents);
        });
        return button;
    }

    function renderPagination(totalRecords) {
        const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));

        if (studentPaginationPages) {
            studentPaginationPages.innerHTML = '';

            if (totalRecords > 0) {
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + 4);
                startPage = Math.max(1, endPage - 4);

                if (startPage > 1) {
                    studentPaginationPages.appendChild(createPageButton(1, currentPage === 1));
                    if (startPage > 2) {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'student-pagination-ellipsis';
                        ellipsis.textContent = '...';
                        studentPaginationPages.appendChild(ellipsis);
                    }
                }

                for (let page = startPage; page <= endPage; page++) {
                    studentPaginationPages.appendChild(createPageButton(page, currentPage === page));
                }

                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'student-pagination-ellipsis';
                        ellipsis.textContent = '...';
                        studentPaginationPages.appendChild(ellipsis);
                    }
                    studentPaginationPages.appendChild(createPageButton(totalPages, currentPage === totalPages));
                }
            }
        }

        if (studentPrevBtn) {
            studentPrevBtn.disabled = currentPage <= 1 || totalRecords === 0;
        }
        if (studentNextBtn) {
            studentNextBtn.disabled = currentPage >= totalPages || totalRecords === 0;
        }
    }

    function getSortValue(s, col) {
        switch (col) {
            case 'name':        return fullName(s).toLowerCase();
            case 'email':       return (s.email || '').toLowerCase();
            case 'course':      return courseLabel(s).toLowerCase();
            case 'curriculum':  return (Number(s.year_level || 0) * 10 + Number(s.current_semester || s.import_semester || 0));
            case 'year_level':  return Number(s.year_level || 0);
            case 'status':      return (s.status || '').toLowerCase();
            case 'finance':     return (s.finance_status || s.finance || '').toLowerCase();
            case 'type':        return (s.student_type || '').toLowerCase();
            case 'enrolled_date': return s.enrollment_date ? new Date(s.enrollment_date).getTime() : 0;
            default:            return '';
        }
    }

    function updateSortIndicators() {
        document.querySelectorAll('.sortable-th').forEach(function (th) {
            const col = th.getAttribute('data-sort');
            const indicator = th.querySelector('.sort-indicator');
            if (!indicator) return;
            if (col === sortColumn) {
                indicator.textContent = sortDir === 'asc' ? ' ▲' : ' ▼';
                th.classList.add('sort-active');
            } else {
                indicator.textContent = '';
                th.classList.remove('sort-active');
            }
        });
    }

    function renderTable(students) {
        if (!tableBody) return;

        currentStudents = Array.isArray(students) ? students : [];

        if (sortColumn) {
            currentStudents = currentStudents.slice().sort(function (a, b) {
                const av = getSortValue(a, sortColumn);
                const bv = getSortValue(b, sortColumn);
                if (av < bv) return sortDir === 'asc' ? -1 : 1;
                if (av > bv) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        updateSortIndicators();
        const totalRecords = currentStudents.length;
        const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRecords);
        const pageStudents = currentStudents.slice(startIndex, endIndex);

        if (studentPaginationInfo) {
            studentPaginationInfo.textContent = totalRecords === 0
                ? 'Showing 0 of 0'
                : `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords}`;
        }

        renderPagination(totalRecords);

        if (pageStudents.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="10" class="student-table-empty">No enrolled students found. Students waiting for re-enrollment are now in Enrollees.</td></tr>';
            return;
        }

        tableBody.innerHTML = pageStudents.map(function (s) {
            const name = escapeHtml(fullName(s));
            const email = escapeHtml(s.email || '');
            const course = escapeHtml(courseLabel(s));
            const yl = s.year_level ? `Year ${s.year_level}` : '—';
            const semesterValue = Number(s.current_semester || s.import_semester || 0);
            const curriculumKey = getCurriculumKey(s.course_code, s.year_level, semesterValue);
            const curriculumCount = Number(curriculumIndex[curriculumKey] || 0);
            const curriculumLabel = `${s.year_level ? `Y${s.year_level}` : 'Year —'} • ${formatSemesterLabel(semesterValue)}`;
            const st = s.status || '';
            const badge = statusBadgeClass(st);
            const stLabel = escapeHtml(statusLabel(st));
            const financeStatus = String(s.finance_status || s.finance || '').toLowerCase();
            const financeLabel = financeStatus ? escapeHtml(financeStatus.replace('_', ' ')) : '—';
            const financeClass = financeStatus === 'promisory'
                ? 'finance-promisory'
                : financeStatus === 'down_payment'
                    ? 'finance-down-payment'
                    : financeStatus === 'fully_paid'
                        ? 'finance-fully-paid'
                        : '';
            const typeLabel = escapeHtml(s.student_type || '—');
            const enrolled = formatEnrolledDate(s.enrollment_date);
            const canDrop = studentCanEdit && (st === 'active' || st === 'inactive');
            const canManageDropped = studentCanEdit && st === 'transferred';

            return (
                '<tr>' +
                `<td class="td-name">${name}</td>` +
                `<td class="td-email">${email}</td>` +
                `<td>${course}</td>` +
                `<td><div class="curriculum-cell"><strong>${escapeHtml(curriculumLabel)}</strong><span class="curriculum-badge ${curriculumCount > 0 ? 'is-ready' : 'is-empty'}">${curriculumCount > 0 ? `${escapeHtml(curriculumCount)} subjects` : 'No setup yet'}</span></div></td>` +
                `<td>${escapeHtml(yl)}</td>` +
                `<td><span class="status-badge ${badge}">${stLabel}</span></td>` +
                `<td>${financeLabel === '—' ? financeLabel : `<span class="finance-badge ${financeClass}">${financeLabel}</span>`}</td>` +
                `<td><span class="type-pill">${typeLabel}</span></td>` +
                `<td>${enrolled}</td>` +
                '<td><div class="action-buttons">' +
                `<button type="button" class="action-btn view-btn" data-action="view" data-id="${s.id}" title="View">` +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
                '</button>' +
                (canDrop
                    ? `<button type="button" class="action-btn drop-btn" data-action="drop" data-id="${s.id}" title="Mark as dropped">` +
                      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>' +
                      '</button>'
                    : '') +
                (canManageDropped
                    ? `<button type="button" class="action-btn retrieve-btn" data-action="retrieve" data-id="${s.id}" title="Retrieve student">` +
                      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 3 12 9 6"></polyline><path d="M3 12h18"></path></svg>' +
                      '</button>' +
                      `<button type="button" class="action-btn archive-btn" data-action="archive" data-id="${s.id}" title="Archive student">` +
                      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>' +
                      '</button>'
                    : '') +
                '</div></td>' +
                '</tr>'
            );
        }).join('');
    }

    function setSemesterButtonsBusy(isBusy, semester) {
        if (studentEndSem1Btn) {
            studentEndSem1Btn.disabled = isBusy;
            studentEndSem1Btn.textContent = isBusy && semester === 1 ? 'Processing...' : 'End 1st Sem';
        }
        if (studentEndSem2Btn) {
            studentEndSem2Btn.disabled = isBusy;
            studentEndSem2Btn.textContent = isBusy && semester === 2 ? 'Processing...' : 'End 2nd Sem';
        }
    }

    function triggerSemesterEnd(semester) {
        if (!studentCanManageSemester) {
            showNotification('You do not have permission to end the semester.', 'error');
            return;
        }

        const message = semester === 1
            ? 'End 1st semester and send active students to Enrollees as pending re-enrollees?'
            : 'End 2nd semester and send active students to Enrollees as pending re-enrollees?';

        if (!confirm(message)) return;

        setSemesterButtonsBusy(true, semester);

        fetch('api/student_year_progression.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'trigger_semester_end', semester: semester })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    showNotification((data.error || 'Semester end failed') + (data.details ? ': ' + data.details : ''), 'error');
                    return;
                }
                showNotification(data.message || 'Semester processed successfully.', 'success');
                loadStats();
                loadStudents(true);
            })
            .catch(function (err) {
                console.error('Semester end failed:', err);
                showNotification('Network error while ending semester.', 'error');
            })
            .finally(function () {
                setSemesterButtonsBusy(false, semester);
            });
    }

    function loadStudents(resetPage) {
        if (resetPage) {
            currentPage = 1;
        }

        fetch(buildListUrl())
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    if (tableBody) {
                        tableBody.innerHTML =
                            '<tr><td colspan="10" class="student-table-empty">Unable to load students</td></tr>';
                    }
                    return;
                }
                populateCourseOptions(data.courses || []);
                var students = data.students || [];
                var hasFinanceField = students.some(function (s) {
                    return s.finance_status != null || s.finance != null;
                });
                if (filterFinance && filterFinance.value && hasFinanceField) {
                    var selectedFinance = filterFinance.value.toLowerCase();
                    students = students.filter(function (s) {
                        var financeValue = String(s.finance_status || s.finance || '').toLowerCase();
                        return financeValue === selectedFinance;
                    });
                }
                if (filterType && filterType.value) {
                    var selectedType = filterType.value.toLowerCase();
                    students = students.filter(function (s) {
                        return String(s.student_type || '').toLowerCase() === selectedType;
                    });
                }
                if (filterSemester && filterSemester.value) {
                    students = students.filter(function (s) {
                        return String(s.current_semester || s.import_semester || '') === String(filterSemester.value);
                    });
                }
                renderTable(students);
            })
            .catch(function (err) {
                console.error('Error loading students:', err);
                if (tableBody) {
                    tableBody.innerHTML =
                        '<tr><td colspan="9" class="student-table-empty">Unable to load students</td></tr>';
                }
            });
    }

    function dropStudent(id) {
        if (!confirm('Mark this student as dropped? They will be listed under Dropped status.')) return;
        fetch('api/student_update_status.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: 'transferred' }),
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    console.error('Student drop failed', data);
                    showNotification((data.error || 'Update failed') + (data.details ? ': ' + data.details : ''), 'error');
                    return;
                }
                showNotification('Student marked as dropped', 'success');
                loadStats();
                loadStudents();
            })
            .catch(function () { showNotification('Network error', 'error'); });
    }

    function retrieveStudent(id) {
        if (!confirm('Retrieve this student from dropped status? They will be restored as active.')) return;
        fetch('api/student_update_status.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: 'active' }),
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    console.error('Student retrieve failed', data);
                    showNotification((data.error || 'Retrieve failed') + (data.details ? ': ' + data.details : ''), 'error');
                    return;
                }
                showNotification('Student retrieved successfully', 'success');
                loadStats();
                loadStudents();
            })
            .catch(function () { showNotification('Network error', 'error'); });
    }

    function archiveStudent(id) {
        if (!confirm('Archive this dropped student? This will keep the record but remove it from the active student list.')) return;
        fetch('api/student_archive.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id }),
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    console.error('Student archive failed', data);
                    showNotification((data.error || 'Archive failed') + (data.details ? ': ' + data.details : ''), 'error');
                    return;
                }
                showNotification('Student archived successfully', 'success');
                loadStats();
                loadStudents();
            })
            .catch(function () { showNotification('Network error', 'error'); });
    }

    document.querySelectorAll('.sortable-th').forEach(function (th) {
        th.addEventListener('click', function () {
            const col = th.getAttribute('data-sort');
            if (sortColumn === col) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = col;
                sortDir = 'asc';
            }
            currentPage = 1;
            renderTable(currentStudents);
        });
    });

    if (tableBody) {
        tableBody.addEventListener('click', function (e) {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = parseInt(btn.dataset.id, 10);
            const action = btn.dataset.action;
            if (Number.isNaN(id)) return;
            e.preventDefault();
            e.stopPropagation();
            if (action === 'view') {
                window.viewStudent(id);
            } else if (action === 'drop') {
                dropStudent(id);
            } else if (action === 'retrieve') {
                retrieveStudent(id);
            } else if (action === 'archive') {
                archiveStudent(id);
            }
        });
    }

    if (toggleStudentEditBtn) {
        toggleStudentEditBtn.addEventListener('click', function () {
            const isEditing = toggleStudentEditBtn.dataset.editing === 'true';
            setStudentEditMode(!isEditing);
        });
    }
    if (saveStudentDetailsBtn) {
        saveStudentDetailsBtn.addEventListener('click', saveStudentDetails);
    }
    if (studentViewForm) {
        studentViewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveStudentDetails();
        });
    }
    if (studentViewPhotoButton) {
        studentViewPhotoButton.addEventListener('click', function () {
            if (studentViewPhotoInput) studentViewPhotoInput.click();
        });
    }
    if (studentViewPhotoInput) {
        studentViewPhotoInput.addEventListener('change', handleStudentPhotoChange);
    }
    [studentCourseDisplay, studentYearLevelSelect, studentCurrentSemesterSelect].forEach(function (el) {
        if (!el) return;
        el.addEventListener('change', syncStudentMetaPreview);
    });
    if (studentAcademicYearInput) {
        studentAcademicYearInput.addEventListener('input', syncStudentMetaPreview);
    }
    if (studentViewModal) {
        studentViewModal.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                window.closeStudentModal(e);
            }
        });
    }

    if (openAdditionalCurriculumModalBtn) {
        openAdditionalCurriculumModalBtn.addEventListener('click', openAdditionalCurriculumModal);
    }

    if (closeAdditionalCurriculumModalBtn) {
        closeAdditionalCurriculumModalBtn.addEventListener('click', window.closeAdditionalCurriculumModal);
    }

    if (assignAdditionalCurriculumBtn) {
        assignAdditionalCurriculumBtn.addEventListener('click', assignAdditionalCurriculum);
    }

    [additionalCurriculumYear, additionalCurriculumSemester].forEach(function (el) {
        if (!el) return;
        el.addEventListener('change', loadAvailableCurriculumOptions);
    });

    if (saveAssignmentProgressBtn) {
        saveAssignmentProgressBtn.addEventListener('click', saveAssignmentProgress);
    }

    window.viewStudent = function (studentId) {
        fetch(`api/student_details.php?id=${studentId}`)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.ok) {
                    showStudentModal(data.student);
                } else {
                    console.error('Failed to load student details:', data.error);
                }
            })
            .catch(function (err) { console.error('Error fetching student details:', err); });
    };

    let studentPhotoData = null;
    let currentStudentData = null;

    function syncStudentMetaPreview() {
        var yearText = studentYearLevelSelect && studentYearLevelSelect.value
            ? `Year ${studentYearLevelSelect.value}`
            : (currentStudentData && currentStudentData.year_level ? `Year ${currentStudentData.year_level}` : 'N/A');
        var semesterValue = studentCurrentSemesterSelect && studentCurrentSemesterSelect.value
            ? studentCurrentSemesterSelect.value
            : (currentStudentData ? (currentStudentData.current_semester || currentStudentData.import_semester || 0) : 0);
        var academicYearText = studentAcademicYearInput && studentAcademicYearInput.value.trim()
            ? studentAcademicYearInput.value.trim()
            : (currentStudentData && currentStudentData.current_academic_year ? currentStudentData.current_academic_year : 'N/A');
        var courseText = 'N/A';

        if (studentCourseDisplay && studentCourseDisplay.selectedOptions && studentCourseDisplay.selectedOptions[0]) {
            courseText = studentCourseDisplay.selectedOptions[0].textContent || 'N/A';
        } else if (currentStudentData) {
            courseText = courseLabel(currentStudentData) || 'N/A';
        }

        var courseEl = document.getElementById('studentModalCourse');
        var yearEl = document.getElementById('studentModalYear');
        var semEl = document.getElementById('studentModalSemester');
        var ayEl = document.getElementById('studentModalAcademicYear');

        if (courseEl) courseEl.textContent = courseText;
        if (yearEl) yearEl.textContent = yearText;
        if (semEl) semEl.textContent = formatSemesterLabel(semesterValue);
        if (ayEl) ayEl.textContent = academicYearText;
    }

    function setStudentEditMode(editing) {
        var inputs = [studentFirstName, studentMiddleName, studentLastName, studentEmail, studentPhone, studentGuardianContact, studentFbName, studentAddress, studentBirthDate, studentGender, studentCourseDisplay, studentYearLevelSelect, studentCurrentSemesterSelect, studentAcademicYearInput, studentStatus, studentFinanceStatus, studentFlagGroup];
        inputs.forEach(function (input) {
            if (!input) return;
            input.disabled = !editing;
        });
        if (studentFlagGroup) {
            studentFlagGroup.disabled = !editing || !studentCanEditFlagGroup;
        }
        if (studentViewPhotoButton) studentViewPhotoButton.disabled = !editing;
        if (saveStudentDetailsBtn) {
            saveStudentDetailsBtn.disabled = !editing;
            saveStudentDetailsBtn.style.display = editing ? 'inline-flex' : 'none';
        }
        if (toggleStudentEditBtn) {
            toggleStudentEditBtn.dataset.editing = editing ? 'true' : 'false';
            toggleStudentEditBtn.textContent = editing ? 'Cancel' : 'Edit';
        }
        if (!editing) {
            if (studentViewPhotoInput) studentViewPhotoInput.value = '';
            if (currentStudentData) {
                populateStudentViewForm(currentStudentData);
            }
        }
    }

    function populateStudentViewForm(student) {
        if (!student) return;
        currentStudentData = student;
        if (studentViewId) studentViewId.value = String(student.id || '');
        if (studentFirstName) studentFirstName.value = student.first_name || '';
        if (studentMiddleName) studentMiddleName.value = student.middle_name || '';
        if (studentLastName) studentLastName.value = student.last_name || '';
        if (studentEmail) studentEmail.value = student.email || '';
        if (studentPhone) studentPhone.value = student.phone || '';
        if (studentGuardianContact) studentGuardianContact.value = student.guardian_contact || '';
        if (studentFbName) studentFbName.value = student.fb_name || '';
        if (studentAddress) studentAddress.value = student.address || '';
        if (studentBirthDate) studentBirthDate.value = student.birth_date || '';
        if (studentGender) studentGender.value = student.gender || '';
        populateStudentCourseOptions(student.course_id, courseLabel(student) || '—');
        if (studentYearLevelSelect) studentYearLevelSelect.value = String(student.year_level || '1');
        if (studentCurrentSemesterSelect) studentCurrentSemesterSelect.value = String(student.current_semester || student.import_semester || '1');
        if (studentAcademicYearInput) studentAcademicYearInput.value = student.current_academic_year || '';
        if (studentStatus) studentStatus.value = student.status || 'active';
        if (studentFinanceStatus) studentFinanceStatus.value = student.finance_status || student.finance || 'fully_paid';
        if (studentFlagGroup) studentFlagGroup.value = student.flag_group || '';
        studentPhotoData = student.profile_photo || student.photo || null;
        setStudentPhotoPreview(studentPhotoData);
        syncStudentMetaPreview();
        loadAvailableCurriculumOptions();
    }

    function renderAssignedCurriculum(assignments) {
        if (!studentAssignedCurriculumContent) return;

        if (!assignments || assignments.length === 0) {
            studentAssignedCurriculumContent.innerHTML = '<p class="modal-text-muted">No additional curriculum assigned.</p>';
            return;
        }

        studentAssignedCurriculumContent.innerHTML =
            '<div class="curriculum-table-container">' +
            '<table class="student-table">' +
            '<thead><tr><th>Done</th><th>Code</th><th>Subject</th><th>Year/Sem</th><th>Status</th></tr></thead>' +
            '<tbody>' +
            assignments.map(function (subject) {
                const isCompleted = Number(subject.is_completed || 0) === 1;
                return (
                    '<tr>' +
                    '<td><input type="checkbox" class="assignment-complete-checkbox" data-assignment-id="' + escapeHtml(subject.id) + '" ' + (isCompleted ? 'checked' : '') + ' ' + (studentCanManageIrregular ? '' : 'disabled') + '></td>' +
                    '<td>' + escapeHtml(subject.subject_code) + '</td>' +
                    '<td>' + escapeHtml(subject.subject_name) + '</td>' +
                    '<td>Y' + escapeHtml(subject.year_level) + ' / S' + escapeHtml(subject.semester) + '</td>' +
                    '<td><span class="assignment-status-pill ' + (isCompleted ? 'completed' : 'pending') + '">' + (isCompleted ? 'Completed' : 'Pending') + '</span></td>' +
                    '</tr>'
                );
            }).join('') +
            '</tbody></table></div>';
    }

    function refreshStudentTypeInForm(student) {
        if (!student) return;
        var hasPendingAdditional = Array.isArray(student.assigned_curriculum)
            && student.assigned_curriculum.some(function (item) { return Number(item.is_completed || 0) !== 1; });
        student.student_type = hasPendingAdditional ? 'irregular' : 'regular';
    }

    function renderAvailableCurriculumSelection(subjects) {
        if (!availableCurriculumSelection) return;

        if (!subjects || subjects.length === 0) {
            availableCurriculumSelection.innerHTML = '<p class="modal-text-muted">No available subjects for the selected setup. Already assigned or already enrolled subjects are hidden.</p>';
            return;
        }

        availableCurriculumSelection.innerHTML =
            '<div class="curriculum-table-container">' +
            '<table class="student-table">' +
            '<thead><tr><th>Select</th><th>Code</th><th>Subject</th><th>Year/Sem</th><th>Units</th></tr></thead>' +
            '<tbody>' +
            subjects.map(function (subject) {
                return (
                    '<tr>' +
                    '<td><input type="checkbox" class="available-curriculum-checkbox" value="' + escapeHtml(subject.id) + '"></td>' +
                    '<td>' + escapeHtml(subject.subject_code) + '</td>' +
                    '<td>' + escapeHtml(subject.subject_name) + '</td>' +
                    '<td>Y' + escapeHtml(subject.year_level) + ' / S' + escapeHtml(subject.semester) + '</td>' +
                    '<td>' + escapeHtml(subject.units || '0') + '</td>' +
                    '</tr>'
                );
            }).join('') +
            '</tbody></table></div>';
    }

    function openAdditionalCurriculumModal() {
        if (!additionalCurriculumModal) return;
        additionalCurriculumModal.style.display = 'flex';
        loadAvailableCurriculumOptions();
    }

    window.closeAdditionalCurriculumModal = function (event) {
        if (event) event.stopPropagation();
        if (additionalCurriculumModal) {
            additionalCurriculumModal.style.display = 'none';
        }
    };

    function loadAvailableCurriculumOptions() {
        if (!availableCurriculumSelection) return;

        if (!currentStudentData || !currentStudentData.id) {
            availableCurriculumSelection.innerHTML = '<p class="modal-text-muted">Open a student record first.</p>';
            return;
        }

        var yearLevel = Number(additionalCurriculumYear ? additionalCurriculumYear.value : 1);
        var semester = Number(additionalCurriculumSemester ? additionalCurriculumSemester.value : 0);

        availableCurriculumSelection.innerHTML = '<p class="modal-text-muted">Loading available subjects...</p>';

        fetch('api/student_curriculum_assignments.php?student_id=' + encodeURIComponent(currentStudentData.id) + '&year_level=' + encodeURIComponent(yearLevel) + '&semester=' + encodeURIComponent(semester), {
            credentials: 'same-origin'
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    availableCurriculumSelection.innerHTML = '<p class="modal-text-muted">Unable to load available curriculum subjects.</p>';
                    return;
                }
                renderAvailableCurriculumSelection(data.available_subjects || []);
            })
            .catch(function (err) {
                console.error('Available curriculum load error:', err);
                availableCurriculumSelection.innerHTML = '<p class="modal-text-muted">Unable to load available curriculum subjects.</p>';
            });
    }

    function assignAdditionalCurriculum() {
        if (!studentCanManageIrregular || !currentStudentData || !currentStudentData.id) return;

        var selectedSubjectIds = Array.from(document.querySelectorAll('.available-curriculum-checkbox:checked'))
            .map(function (cb) { return Number(cb.value || 0); })
            .filter(function (id) { return id > 0; });

        if (!selectedSubjectIds.length) {
            showNotification('Select the subject(s) the student needs to take.', 'info');
            return;
        }

        var payload = {
            action: 'assign',
            student_id: Number(currentStudentData.id),
            year_level: Number(additionalCurriculumYear ? additionalCurriculumYear.value : 1),
            semester: Number(additionalCurriculumSemester ? additionalCurriculumSemester.value : 0),
            curriculum_ids: selectedSubjectIds
        };

        if (assignAdditionalCurriculumBtn) {
            assignAdditionalCurriculumBtn.disabled = true;
            assignAdditionalCurriculumBtn.textContent = 'Assigning...';
        }

        fetch('api/student_curriculum_assignments.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    showNotification(data.error || 'Failed to assign selected subjects', 'error');
                    return;
                }

                currentStudentData.assigned_curriculum = data.assignments || [];
                refreshStudentTypeInForm(currentStudentData);
                renderAssignedCurriculum(currentStudentData.assigned_curriculum);
                loadAvailableCurriculumOptions();
                closeAdditionalCurriculumModal();
                showNotification(data.message || 'Selected subjects assigned', 'success');
                loadStudents();
            })
            .catch(function (err) {
                console.error('Assign additional curriculum error:', err);
                showNotification('Failed to assign selected subjects', 'error');
            })
            .finally(function () {
                if (assignAdditionalCurriculumBtn) {
                    assignAdditionalCurriculumBtn.disabled = false;
                    assignAdditionalCurriculumBtn.textContent = 'Assign Selected Subjects';
                }
            });
    }

    function saveAssignmentProgress() {
        if (!studentCanManageIrregular || !currentStudentData || !currentStudentData.id) return;

        var checkboxes = Array.from(document.querySelectorAll('.assignment-complete-checkbox'));
        if (!checkboxes.length) {
            showNotification('No assigned curriculum to update.', 'info');
            return;
        }

        var updates = checkboxes.map(function (cb) {
            return {
                id: Number(cb.getAttribute('data-assignment-id') || 0),
                is_completed: cb.checked
            };
        }).filter(function (u) { return u.id > 0; });

        if (saveAssignmentProgressBtn) {
            saveAssignmentProgressBtn.disabled = true;
            saveAssignmentProgressBtn.textContent = 'Saving...';
        }

        fetch('api/student_curriculum_assignments.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_progress',
                student_id: Number(currentStudentData.id),
                updates: updates
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    showNotification(data.error || 'Failed to update assignment progress', 'error');
                    return;
                }

                currentStudentData.assigned_curriculum = data.assignments || [];
                refreshStudentTypeInForm(currentStudentData);
                renderAssignedCurriculum(currentStudentData.assigned_curriculum);
                showNotification(data.message || 'Assignment progress updated', 'success');
                loadStudents();
            })
            .catch(function (err) {
                console.error('Save assignment progress error:', err);
                showNotification('Failed to update assignment progress', 'error');
            })
            .finally(function () {
                if (saveAssignmentProgressBtn) {
                    saveAssignmentProgressBtn.disabled = false;
                    saveAssignmentProgressBtn.textContent = 'Save Completion Progress';
                }
            });
    }

    function setStudentPhotoPreview(photoData) {
        if (!studentViewPhotoPreview || !studentViewPhotoPlaceholder) return;
        if (photoData) {
            studentViewPhotoPreview.src = photoData;
            studentViewPhotoPreview.style.display = 'block';
            studentViewPhotoPlaceholder.style.display = 'none';
        } else {
            studentViewPhotoPreview.removeAttribute('src');
            studentViewPhotoPreview.style.display = 'none';
            studentViewPhotoPlaceholder.style.display = 'flex';
        }
    }

    function syncCurrentUserFromStudentDetails(details) {
        if (typeof window === 'undefined' || !window.AppUser) return;
        const studentFullName = [details.first_name, details.middle_name, details.last_name].filter(Boolean).join(' ').trim();
        const photoValue = details.profile_photo || details.photo || null;
        const updatedUser = {
            ...window.AppUser,
            first_name: details.first_name || window.AppUser.first_name || null,
            middle_name: details.middle_name || window.AppUser.middle_name || null,
            last_name: details.last_name || window.AppUser.last_name || null,
            fullName: studentFullName || window.AppUser.fullName || window.AppUser.name || null,
            name: studentFullName || window.AppUser.name || window.AppUser.fullName || null,
            email: details.email || window.AppUser.email,
            phone: details.phone || window.AppUser.phone || null,
            address: details.address || window.AppUser.address || null,
            birth_date: details.birth_date || window.AppUser.birth_date || null,
            gender: details.gender || window.AppUser.gender || null,
            photo: photoValue,
            profile_photo: photoValue,
        };
        window.AppUser = updatedUser;
        if (window.SharedData) {
            window.SharedData.currentUser = {
                ...window.SharedData.currentUser,
                ...updatedUser,
            };
            window.SharedData.currentUser.email = updatedUser.email;
            window.SharedData.currentUser.fullName = updatedUser.fullName;
            window.SharedData.currentUser.photo = updatedUser.photo;
            window.SharedData.currentUser.profile_photo = updatedUser.profile_photo;
            window.SharedData.currentUserName = String(updatedUser.fullName || updatedUser.name || '').trim();
            window.SharedData.currentUserId = updatedUser.userId || updatedUser.id || updatedUser.studentId || null;
        }
        try {
            window.dispatchEvent(new CustomEvent('appUserUpdated', { detail: window.AppUser }));
        } catch (error) {
            console.warn('Failed to dispatch appUserUpdated event', error);
        }
    }

    function handleStudentPhotoChange(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showNotification('Please choose a valid image file.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            studentPhotoData = reader.result;
            setStudentPhotoPreview(studentPhotoData);
        };
        reader.readAsDataURL(file);
    }

    function saveStudentDetails() {
        if (!studentViewId) return;
        var id = parseInt(studentViewId.value, 10);
        if (!id) return;

        var payload = {
            id: id,
            first_name: studentFirstName ? studentFirstName.value.trim() : '',
            middle_name: studentMiddleName ? studentMiddleName.value.trim() : '',
            last_name: studentLastName ? studentLastName.value.trim() : '',
            email: studentEmail ? studentEmail.value.trim() : '',
            phone: studentPhone ? studentPhone.value.trim() : '',
            guardian_contact: studentGuardianContact ? studentGuardianContact.value.trim() : '',
            fb_name: studentFbName ? studentFbName.value.trim() : '',
            address: studentAddress ? studentAddress.value.trim() : '',
            birth_date: studentBirthDate ? studentBirthDate.value : '',
            gender: studentGender ? studentGender.value : '',
            course_id: studentCourseDisplay ? Number(studentCourseDisplay.value || 0) : 0,
            year_level: studentYearLevelSelect ? Number(studentYearLevelSelect.value || 0) : 0,
            current_semester: studentCurrentSemesterSelect ? Number(studentCurrentSemesterSelect.value || 0) : 0,
            current_academic_year: studentAcademicYearInput ? studentAcademicYearInput.value.trim() : '',
            status: studentStatus ? studentStatus.value : 'active',
            finance_status: studentFinanceStatus ? studentFinanceStatus.value : 'fully_paid',
            flag_group: studentFlagGroup ? studentFlagGroup.value : '',
            profile_photo: studentPhotoData || null
        };

        if (saveStudentDetailsBtn) {
            saveStudentDetailsBtn.disabled = true;
            saveStudentDetailsBtn.textContent = 'Saving...';
        }

        fetch('api/student_update.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) {
                    console.error('Student update failed', data);
                    showNotification((data.error || 'Failed to save student changes') + (data.details ? ': ' + data.details : ''), 'error');
                    return;
                }
                showNotification('Student updated successfully', 'success');
                if (currentStudentData && window.AppUser && String(window.AppUser.email || '').trim().toLowerCase() === String(currentStudentData.email || '').trim().toLowerCase()) {
                    syncCurrentUserFromStudentDetails({
                        first_name: payload.first_name,
                        middle_name: payload.middle_name,
                        last_name: payload.last_name,
                        email: payload.email,
                        phone: payload.phone,
                        address: payload.address,
                        birth_date: payload.birth_date,
                        gender: payload.gender,
                        profile_photo: payload.profile_photo,
                    });
                }
                setStudentEditMode(false);
                window.closeStudentModal();
                loadStats();
                loadStudents();
            })
            .catch(function (err) {
                console.error('Error saving student edits:', err);
                showNotification('Failed to save student edits', 'error');
            })
            .finally(function () {
                if (saveStudentDetailsBtn) {
                    saveStudentDetailsBtn.disabled = false;
                    saveStudentDetailsBtn.textContent = 'Save changes';
                }
            });
    }

    function showNotification(message, type = 'info') {
        if (!studentNotificationContainer) {
            alert(message);
            return;
        }

        if (!document.getElementById('student-notification-styles')) {
            var style = document.createElement('style');
            style.id = 'student-notification-styles';
            style.textContent = `
                #studentNotificationContainer {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    pointer-events: none;
                }
                .rm-notification {
                    min-width: 220px;
                    max-width: 320px;
                    padding: 0.9rem 1rem;
                    border-radius: 0.75rem;
                    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: opacity 0.25s ease, transform 0.25s ease;
                    pointer-events: auto;
                    font-size: 0.95rem;
                    line-height: 1.4;
                }
                .rm-notification.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .rm-notification-success { background: #dcfce7; color: #166534; }
                .rm-notification-error { background: #fee2e2; color: #991b1b; }
                .rm-notification-info { background: #dbeafe; color: #1e3a8a; }
            `;
            document.head.appendChild(style);
        }

        var notification = document.createElement('div');
        notification.className = `rm-notification rm-notification-${type}`;
        notification.textContent = message;
        studentNotificationContainer.appendChild(notification);

        window.requestAnimationFrame(function () {
            notification.classList.add('visible');
        });

        setTimeout(function () {
            notification.classList.remove('visible');
            setTimeout(function () {
                notification.remove();
            }, 300);
        }, 3200);
    }

    function showStudentModal(student) {
        if (!studentViewModal) return;

        const studentName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').trim();

        document.querySelectorAll('#studentModalTitle').forEach(function (el) {
            el.textContent = studentName;
        });
        document.querySelectorAll('#studentModalId').forEach(function (el) {
            el.textContent = student.student_id || 'N/A';
        });

        currentStudentData = student;
        populateStudentViewForm(student);
        setStudentEditMode(false);

        if (toggleStudentEditBtn) {
            toggleStudentEditBtn.style.display = studentCanEdit ? 'inline-flex' : 'none';
        }

        const curriculumContent = document.getElementById('studentCurriculumContent');
        if (curriculumContent) {
            if (!student.curriculum || student.curriculum.length === 0) {
                curriculumContent.innerHTML =
                    '<p class="modal-text-muted">No enrolled subjects found for this student yet.</p>';
            } else {
                curriculumContent.innerHTML =
                    '<div class="curriculum-table-container">' +
                    '<table class="student-table">' +
                    '<thead><tr><th>Code</th><th>Subject</th><th>Units</th><th>Prerequisites</th></tr></thead>' +
                    '<tbody>' +
                    student.curriculum.map(function (subject) {
                        return (
                            '<tr>' +
                            `<td>${escapeHtml(subject.subject_code)}</td>` +
                            `<td>${escapeHtml(subject.subject_name)}</td>` +
                            `<td>${escapeHtml(subject.units)}</td>` +
                            `<td>${escapeHtml(subject.prerequisites || 'None')}</td>` +
                            '</tr>'
                        );
                    }).join('') +
                    '</tbody></table></div>';
            }
        }

        if (irregularCurriculumSection) {
            irregularCurriculumSection.style.display = 'block';
        }

        if (irregularControls) {
            irregularControls.style.display = studentCanManageIrregular ? 'block' : 'none';
        }

        currentStudentData.assigned_curriculum = Array.isArray(student.assigned_curriculum) ? student.assigned_curriculum : [];
        renderAssignedCurriculum(currentStudentData.assigned_curriculum);
        refreshStudentTypeInForm(currentStudentData);

        studentViewModal.style.zIndex = '1000';
        studentViewModal.style.display = 'flex';
    }

    window.closeStudentModal = function (event) {
        if (event) event.stopPropagation();
        if (studentViewModal) {
            studentViewModal.style.display = 'none';
        }
        setStudentEditMode(false);
    };

    function syncDropButtonState() {
        if (!dropFilterBtn || !filterStatus) return;
        dropFilterBtn.classList.toggle('is-active', filterStatus.value === 'transferred');
    }

    [filterCourse, filterYear, filterSemester, filterFinance, filterType, filterStatus].forEach(function (el) {
        if (!el) return;
        el.addEventListener('change', function () {
            syncDropButtonState();
            loadStudents(true);
        });
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            loadStudents(true);
        });
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadStudents(true);
            }
        });
    }

    if (studentPrevBtn) {
        studentPrevBtn.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                renderTable(currentStudents);
            }
        });
    }

    if (studentNextBtn) {
        studentNextBtn.addEventListener('click', function () {
            const totalPages = Math.max(1, Math.ceil(currentStudents.length / ITEMS_PER_PAGE));
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentStudents);
            }
        });
    }

    if (dropFilterBtn && filterStatus) {
        dropFilterBtn.addEventListener('click', function () {
            if (filterStatus.value === 'transferred') {
                filterStatus.value = '';
            } else {
                filterStatus.value = 'transferred';
            }
            syncDropButtonState();
            loadStudents(true);
        });
    }

    if (studentEndSem1Btn) {
        if (!studentCanManageSemester) {
            studentEndSem1Btn.style.display = 'none';
        } else {
            studentEndSem1Btn.addEventListener('click', function () {
                triggerSemesterEnd(1);
            });
        }
    }

    if (studentEndSem2Btn) {
        if (!studentCanManageSemester) {
            studentEndSem2Btn.style.display = 'none';
        } else {
            studentEndSem2Btn.addEventListener('click', function () {
                triggerSemesterEnd(2);
            });
        }
    }

    if (exportStudentsBtn) {
        exportStudentsBtn.addEventListener('click', exportStudentTemplate);
    }

    syncDropButtonState();
    loadStats();
    loadCurriculumIndex();
    loadStudents(true);

    const autoViewId = Number(new URLSearchParams(window.location.search).get('view') || 0);
    if (autoViewId > 0 && typeof window.viewStudent === 'function') {
        window.viewStudent(autoViewId);
        if (window.history && typeof window.history.replaceState === 'function') {
            window.history.replaceState({}, document.title, window.location.pathname + (window.location.hash || ''));
        }
    }
});
