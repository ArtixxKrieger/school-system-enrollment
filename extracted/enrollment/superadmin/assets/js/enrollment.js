document.addEventListener('DOMContentLoaded', function () {
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    /** @type {object[]} */
    let filteredStudents = [];

    const tableBody = document.getElementById('studentsTableBody');
    const courseFilter = document.getElementById('courseFilter');
    const yearLevelFilter = document.getElementById('yearLevelFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const semesterTabs = document.querySelectorAll('.semester-tab');
    const sectionTitle = document.querySelector('.section-title');

    const importModal = document.getElementById('importStudentsModal');
    const importForm = document.getElementById('importStudentsForm');
    const importCourseId = document.getElementById('importCourseId');
    const importYearLevel = document.getElementById('importYearLevel');
    const importSemester = document.getElementById('importSemester');
    const importEnrollmentDate = document.getElementById('importEnrollmentDate');
    const importAcademicYear = document.getElementById('importAcademicYear');
    const importBatchNumber = document.getElementById('importBatchNumber');
    const importDefaultPassword = document.getElementById('importDefaultPassword');
    const openImportStudentsBtn = document.getElementById('openImportStudentsBtn');
    const closeImportStudentsBtn = document.getElementById('closeImportStudentsBtn');
    const cancelImportStudentsBtn = document.getElementById('cancelImportStudentsBtn');
    const submitImportStudentsBtn = document.getElementById('submitImportStudentsBtn');

    // Permission checks
    const canCreateEnrollment = window.UserCan && window.UserCan.create('enrollment');
    if (!canCreateEnrollment && openImportStudentsBtn) {
        openImportStudentsBtn.style.display = 'none';
    }

    function getApiUrl(path) {
        const base = String(window.ApiBaseUrl || 'api').replace(/\/$/, '');
        return base + '/' + String(path || '').replace(/^\//, '');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function defaultEnrollmentDate() {
        return new Date().toISOString().slice(0, 10);
    }

    function inferAcademicYearFromDate(dateString) {
        const parsed = dateString ? new Date(dateString + 'T00:00:00') : new Date();
        const year = parsed.getFullYear();
        const month = parsed.getMonth() + 1;
        return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }

    function inferBatchNumber(academicYearValue, yearLevelValue) {
        const match = String(academicYearValue || '').match(/(\d{4})/);
        const startYear = match ? parseInt(match[1], 10) : new Date().getFullYear();
        const yearLevel = Math.max(1, parseInt(yearLevelValue, 10) || 1);
        return String(startYear - (yearLevel - 1));
    }

    function closeStudentViewModal() {
        const modal = document.getElementById('studentViewModal');
        if (modal) {
            modal.remove();
        }
    }

    function openStudentViewModal(student) {
        closeStudentViewModal();

        const guardianContact = student.guardian_contact || student.guardian || 'N/A';
        const fbName = student.fb_name || student.facebook_name || 'N/A';
        const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');
        const enrollmentDate = student.enrollment_date || student.enrollmentDate || 'N/A';
        const birthDate = student.birth_date || 'N/A';
        const curriculum = Array.isArray(student.curriculum) ? student.curriculum : [];

        const modal = document.createElement('div');
        modal.id = 'studentViewModal';
        modal.className = 'enrollment-modal-overlay';
        modal.innerHTML =
            '<div class="enrollment-modal" role="dialog" aria-modal="true" aria-labelledby="studentViewTitle">' +
            '<div class="enrollment-modal-header">' +
            '<h3 id="studentViewTitle">Student Information</h3>' +
            '</div>' +
            '<div class="enrollment-modal-body">' +
            '<div class="student-view-grid">' +
            '<div class="student-view-item"><label>Student ID</label><span>' + escapeHtml(student.student_id || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Status</label><span>' + escapeHtml(student.status || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Full Name</label><span>' + escapeHtml(fullName || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Email</label><span>' + escapeHtml(student.email || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Course</label><span>' + escapeHtml(student.course_name || student.course_code || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Year / Semester</label><span>' + escapeHtml((student.year_level || 'N/A') + ' / ' + (student.current_semester || 'N/A')) + '</span></div>' +
            '<div class="student-view-item"><label>Batch ID</label><span>' + escapeHtml(student.batch_number || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Phone</label><span>' + escapeHtml(student.phone || 'N/A') + '</span></div>' +
            '<div class="student-view-item"><label>Guardian Contact No.</label><span>' + escapeHtml(guardianContact) + '</span></div>' +
            '<div class="student-view-item"><label>FB Name</label><span>' + escapeHtml(fbName) + '</span></div>' +
            '<div class="student-view-item"><label>Birth Date</label><span>' + escapeHtml(birthDate) + '</span></div>' +
            '<div class="student-view-item full"><label>Address</label><span>' + escapeHtml(student.address || 'N/A') + '</span></div>' +
            '<div class="student-view-item full"><label>Enrollment Date</label><span>' + escapeHtml(enrollmentDate) + '</span></div>' +
            '</div>' +
            '<div class="student-view-curriculum">' +
            '<h4>Current Curriculum Subjects</h4>' +
            (curriculum.length
                ? '<ul>' + curriculum.map(function (subject) {
                    const code = escapeHtml(subject.subject_code || '');
                    const name = escapeHtml(subject.subject_name || '');
                    const units = escapeHtml(subject.units || '');
                    return '<li><strong>' + code + '</strong> - ' + name + ' (' + units + ' units)</li>';
                }).join('') + '</ul>'
                : '<p class="student-view-empty">No curriculum subjects found for current year and semester.</p>') +
            '</div>' +
            '</div>' +
            '<div class="enrollment-modal-footer">' +
            '<button type="button" class="btn-secondary" id="closeStudentViewModal">Close</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(modal);

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeStudentViewModal();
            }
        });

        const closeBtn = document.getElementById('closeStudentViewModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeStudentViewModal);
        }
    }

    function populateCourseSelect(selectElement, includeAllOption) {
        if (!selectElement || !window.SharedData || !Array.isArray(window.SharedData.courseCatalog)) return;

        const previousValue = selectElement.value;
        selectElement.innerHTML = includeAllOption
            ? '<option value="ALL">All Courses</option>'
            : '<option value="">Select course</option>';

        window.SharedData.courseCatalog.forEach(function (course) {
            const option = document.createElement('option');
            option.value = includeAllOption ? course.course_code : String(course.id);
            option.textContent = `${course.course_code} - ${course.course_name}`;
            selectElement.appendChild(option);
        });

        if (previousValue && Array.from(selectElement.options).some(function (option) { return option.value === previousValue; })) {
            selectElement.value = previousValue;
        }
    }

    function populateCourseFilter() {
        populateCourseSelect(courseFilter, true);
        populateCourseSelect(importCourseId, false);
    }

    function setActiveSemester(semester) {
        const normalizedSemester = String(parseInt(semester, 10) || 1);
        semesterTabs.forEach(function (tab) {
            tab.classList.toggle('active', tab.getAttribute('data-semester') === normalizedSemester);
        });
        if (semesterFilter) {
            semesterFilter.value = normalizedSemester;
        }
        if (importSemester) {
            importSemester.value = normalizedSemester;
        }
    }

    function getActiveSemester() {
        if (semesterFilter && (semesterFilter.value === '1' || semesterFilter.value === '2')) {
            return parseInt(semesterFilter.value, 10);
        }
        const activeTab = document.querySelector('.semester-tab.active');
        return activeTab ? parseInt(activeTab.getAttribute('data-semester'), 10) || 1 : 1;
    }

    function baseStudentPool() {
        if (!window.SharedData || !Array.isArray(window.SharedData.students)) return [];
        return window.SharedData.students.filter(function (student) {
            return student.dbStatus === 'active' || student.status === 'enrolled';
        });
    }

    function applyFiltersToList(list) {
        const courseVal = courseFilter ? courseFilter.value : 'ALL';
        const yearVal = yearLevelFilter ? yearLevelFilter.value : 'ALL';
        const semester = getActiveSemester();

        return list.filter(function (student) {
            if ((parseInt(student.current_semester, 10) || 1) !== semester) return false;
            if (courseVal !== 'ALL' && student.course !== courseVal) return false;
            if (yearVal !== 'ALL' && String(student.year_level) !== String(yearVal)) return false;
            return true;
        });
    }

    function updateSemesterTabCounts() {
        const pool = baseStudentPool();
        semesterTabs.forEach(function (tab) {
            const semester = parseInt(tab.getAttribute('data-semester'), 10) || 1;
            const count = pool.filter(function (student) {
                return (parseInt(student.current_semester, 10) || 1) === semester;
            }).length;
            const span = tab.querySelector('.semester-count');
            if (span) {
                span.textContent = `(${count})`;
            }
        });
    }

    function updateSectionTitle() {
        if (!sectionTitle) return;
        const semester = getActiveSemester();
        const yearVal = yearLevelFilter ? yearLevelFilter.value : 'ALL';
        const courseVal = courseFilter ? courseFilter.value : 'ALL';
        const yearText = yearVal === 'ALL'
            ? 'All Years'
            : ({ 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }[yearVal] || ('Year ' + yearVal));
        const semesterText = semester === 1 ? '1st Semester' : '2nd Semester';
        const courseText = courseVal !== 'ALL' ? ` — ${courseVal}` : '';
        sectionTitle.textContent = `${yearText} — ${semesterText}${courseText}`;
    }

    function updateEnrollmentStats() {
        if (!window.SharedData) return;
        const stats = window.SharedData.statistics || {};
        const statNumbers = document.querySelectorAll('.enrollment-stats .stat-number');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = stats.totalEnrolled != null ? stats.totalEnrolled : 0;
            statNumbers[1].textContent = stats.pendingEnrollments != null ? stats.pendingEnrollments : 0;
            statNumbers[2].textContent = stats.totalCapacity != null ? stats.totalCapacity : 0;
        }
    }

    function renderPageNumbers(totalPages) {
        const paginationPages = document.getElementById('paginationPages');
        if (!paginationPages) return;

        paginationPages.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= Math.min(3, totalPages); i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'page-number' + (i === currentPage ? ' active' : '');
            pageButton.textContent = String(i);
            pageButton.addEventListener('click', function () {
                currentPage = i;
                renderTablePage();
            });
            paginationPages.appendChild(pageButton);
        }

        if (totalPages > 4) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0 8px';
            ellipsis.style.color = '#6b7280';
            paginationPages.appendChild(ellipsis);
        }

        if (totalPages > 3) {
            const lastPageButton = document.createElement('button');
            lastPageButton.className = 'page-number' + (totalPages === currentPage ? ' active' : '');
            lastPageButton.textContent = String(totalPages);
            lastPageButton.addEventListener('click', function () {
                currentPage = totalPages;
                renderTablePage();
            });
            paginationPages.appendChild(lastPageButton);
        }
    }

    function renderTablePage() {
        if (!tableBody) return;

        const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const rows = filteredStudents.slice(start, start + ITEMS_PER_PAGE);

        if (rows.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af;">No enrolled students found</td></tr>';
        } else {
            tableBody.innerHTML = rows.map(function (student) {
                const courseLabel = escapeHtml(student.course || student.course_code || student.course_name || '—');
                return (
                    `<tr data-numeric-id="${student.numericId || ''}">` +
                    `<td data-label="Student ID">${escapeHtml(student.id)}</td>` +
                    `<td data-label="Name">${escapeHtml(student.name)}</td>` +
                    `<td data-label="Course">${courseLabel}</td>` +
                    `<td data-label="Status"><span class="status-badge enrolled">Enrolled</span></td>` +
                    `<td data-label="Enrollment Date">${escapeHtml(student.enrollmentDate || '—')}</td>` +
                    '</tr>'
                );
            }).join('');
        }

        const total = filteredStudents.length;
        const end = Math.min(start + ITEMS_PER_PAGE, total);
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = total === 0 ? 'Showing 0 of 0' : `Showing ${start + 1} to ${end} of ${total}`;
        }

        renderPageNumbers(Math.ceil(total / ITEMS_PER_PAGE) || 1);

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.disabled = currentPage <= 1 || total === 0;
        if (nextBtn) nextBtn.disabled = currentPage >= (Math.ceil(total / ITEMS_PER_PAGE) || 1) || total === 0;
    }

    function refreshFromSharedData() {
        populateCourseFilter();
        filteredStudents = applyFiltersToList(baseStudentPool());
        updateSemesterTabCounts();
        updateEnrollmentStats();
        updateSectionTitle();
        currentPage = 1;
        renderTablePage();
    }

    function openImportModal() {
        if (!importModal) return;
        populateCourseFilter();

        const selectedCourseCode = courseFilter ? courseFilter.value : 'ALL';
        if (selectedCourseCode !== 'ALL' && importCourseId && window.SharedData && Array.isArray(window.SharedData.courseCatalog)) {
            const matchedCourse = window.SharedData.courseCatalog.find(function (course) {
                return course.course_code === selectedCourseCode;
            });
            if (matchedCourse) {
                importCourseId.value = String(matchedCourse.id);
            }
        }

        if (importYearLevel && yearLevelFilter && yearLevelFilter.value !== 'ALL') {
            importYearLevel.value = yearLevelFilter.value;
        }

        setActiveSemester(getActiveSemester());

        if (importEnrollmentDate && !importEnrollmentDate.value) {
            importEnrollmentDate.value = defaultEnrollmentDate();
        }
        if (importAcademicYear && !importAcademicYear.value) {
            importAcademicYear.value = inferAcademicYearFromDate(importEnrollmentDate ? importEnrollmentDate.value : defaultEnrollmentDate());
        }
        if (importBatchNumber && !importBatchNumber.value) {
            importBatchNumber.value = inferBatchNumber(
                importAcademicYear ? importAcademicYear.value : '',
                importYearLevel ? importYearLevel.value : 1
            );
        }
        if (importDefaultPassword && !importDefaultPassword.value) {
            importDefaultPassword.value = 'student123';
        }

        importModal.hidden = false;
        importModal.style.display = 'flex';
        importModal.setAttribute('aria-hidden', 'false');
    }

    function closeImportModal() {
        if (!importModal) return;
        importModal.hidden = true;
        importModal.style.display = 'none';
        importModal.setAttribute('aria-hidden', 'true');
    }

    function syncImportBatchNumber() {
        if (importBatchNumber) {
            importBatchNumber.value = inferBatchNumber(
                importAcademicYear ? importAcademicYear.value : '',
                importYearLevel ? importYearLevel.value : 1
            );
        }
    }

    function syncImportAcademicYear() {
        if (importEnrollmentDate && importAcademicYear) {
            importAcademicYear.value = inferAcademicYearFromDate(importEnrollmentDate.value || defaultEnrollmentDate());
        }
        syncImportBatchNumber();
    }

    async function submitImport(event) {
        event.preventDefault();
        if (!importForm) return;

        const fileInput = document.getElementById('importStudentFile');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Please choose a file to import.');
            return;
        }

        const formData = new FormData(importForm);
        const originalLabel = submitImportStudentsBtn ? submitImportStudentsBtn.textContent : 'Import Students';
        if (submitImportStudentsBtn) {
            submitImportStudentsBtn.disabled = true;
            submitImportStudentsBtn.textContent = 'Importing...';
        }

        try {
            const response = await fetch(getApiUrl('students_import.php'), {
                method: 'POST',
                body: formData,
            });
            const data = await response.json().catch(function () { return {}; });

            if (!response.ok || !data.ok) {
                alert(data.error || data.details || 'Import failed.');
                return;
            }

            if (window.SharedData && typeof window.SharedData.refreshStudents === 'function') {
                await window.SharedData.refreshStudents();
            }

            refreshFromSharedData();
            closeImportModal();

            let message = data.message || 'Students imported successfully.';
            message += `\nInserted: ${data.inserted || 0}`;
            message += `\nUpdated: ${data.updated || 0}`;
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                message += `\nIssues: ${data.errors.length}`;
                message += `\n${data.errors.slice(0, 5).join('\n')}`;
            }
            alert(message);
            importForm.reset();
            if (importEnrollmentDate) {
                importEnrollmentDate.value = defaultEnrollmentDate();
            }
            syncImportAcademicYear();
        } catch (error) {
            alert((error && error.message) || 'Import failed.');
        } finally {
            if (submitImportStudentsBtn) {
                submitImportStudentsBtn.disabled = false;
                submitImportStudentsBtn.textContent = originalLabel;
            }
        }
    }

    function bind() {
        if (window.SharedData) {
            window.SharedData.on('ready', refreshFromSharedData);
            window.SharedData.on('studentsUpdated', refreshFromSharedData);
            window.SharedData.on('enrolleeApproved', refreshFromSharedData);
            if (window.SharedData.ready) {
                refreshFromSharedData();
            }
        }

        if (courseFilter) {
            courseFilter.addEventListener('change', function () {
                currentPage = 1;
                filteredStudents = applyFiltersToList(baseStudentPool());
                updateSectionTitle();
                renderTablePage();
            });
        }

        if (yearLevelFilter) {
            yearLevelFilter.addEventListener('change', function () {
                currentPage = 1;
                filteredStudents = applyFiltersToList(baseStudentPool());
                updateSectionTitle();
                renderTablePage();
            });
        }

        if (semesterFilter) {
            semesterFilter.addEventListener('change', function () {
                setActiveSemester(semesterFilter.value);
                currentPage = 1;
                filteredStudents = applyFiltersToList(baseStudentPool());
                updateSectionTitle();
                renderTablePage();
            });
        }

        semesterTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                setActiveSemester(tab.getAttribute('data-semester'));
                currentPage = 1;
                filteredStudents = applyFiltersToList(baseStudentPool());
                updateSectionTitle();
                renderTablePage();
            });
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                if (currentPage > 1) {
                    currentPage--;
                    renderTablePage();
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTablePage();
                }
            });
        }

        const addStudentBtn = document.querySelector('.btn-add-student');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', function () {
                const appBaseUrl = window.AppBaseUrl || 'app';
                window.location.href = appBaseUrl + '/enrollees';
            });
        }

        if (openImportStudentsBtn) {
            openImportStudentsBtn.addEventListener('click', openImportModal);
        }
        if (closeImportStudentsBtn) {
            closeImportStudentsBtn.addEventListener('click', closeImportModal);
        }
        if (cancelImportStudentsBtn) {
            cancelImportStudentsBtn.addEventListener('click', closeImportModal);
        }
        if (importEnrollmentDate) {
            importEnrollmentDate.value = defaultEnrollmentDate();
            importEnrollmentDate.addEventListener('change', syncImportAcademicYear);
            syncImportAcademicYear();
        }
        if (importAcademicYear) {
            importAcademicYear.addEventListener('input', syncImportBatchNumber);
        }
        if (importYearLevel) {
            importYearLevel.addEventListener('change', syncImportBatchNumber);
        }
        if (importForm) {
            importForm.addEventListener('submit', submitImport);
        }
        if (importModal) {
            importModal.addEventListener('click', function (event) {
                if (event.target === importModal) {
                    closeImportModal();
                }
            });
        }

        document.addEventListener('click', function (event) {
            const viewBtn = event.target.closest('.btn-action.view');
            if (viewBtn && viewBtn.closest('#studentsTableBody')) {
                const row = viewBtn.closest('tr');
                const numericId = row && row.getAttribute('data-numeric-id');
                if (numericId) {
                    fetch(getApiUrl('student_details.php?id=' + encodeURIComponent(numericId)))
                        .then(function (response) { return response.json(); })
                        .then(function (data) {
                            if (!data.ok) {
                                alert(data.error || 'Could not load student');
                                return;
                            }
                            openStudentViewModal(data.student || {});
                        })
                        .catch(function () {
                            alert('Network error');
                        });
                }
            }

            const editBtn = event.target.closest('.btn-action.edit');
            if (editBtn && editBtn.closest('#studentsTableBody')) {
                const row = editBtn.closest('tr');
                const numericId = row && row.getAttribute('data-numeric-id');
                if (numericId) {
                    const appBaseUrl = window.AppBaseUrl || 'app';
                    window.location.href = appBaseUrl + '/student';
                }
            }

            const deleteBtn = event.target.closest('.btn-action.delete');
            if (deleteBtn && deleteBtn.closest('#studentsTableBody')) {
                event.preventDefault();
            }
        });
    }

    if (typeof window !== 'undefined') {
        window.openImportStudentsModal = openImportModal;
        window.closeImportStudentsModal = closeImportModal;
    }

    if (importModal) {
        importModal.style.display = 'none';
    }

    setActiveSemester(getActiveSemester());
    bind();
});
