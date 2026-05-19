document.addEventListener('DOMContentLoaded', function () {
    const COURSE_ITEMS_PER_PAGE = 10;
    /** @type {Record<string, {name:string,description:string,college:string,code:string,courseId:number,students:object[]}>} */
    let courseData = {};
    let currentCoursePage = 1;
    const courseCanEdit = window.UserCan && window.UserCan.edit('course');
    const courseCanEnroll = window.UserCan && window.UserCan.create('enrollment');

    function formatYearLevel(yearLevel) {
        const y = parseInt(yearLevel, 10) || 1;
        const suffixes = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' };
        return `${y}${suffixes[y] || 'th'} yr`;
    }

    function collegeLabel(courseName) {
        const n = (courseName || '').toLowerCase();
        if (n.includes('information technology')) return 'College of Computing';
        if (n.includes('criminology')) return 'College of Criminal Justice';
        if (n.includes('education')) return 'College of Education';
        if (n.includes('business')) return 'College of Business';
        if (n.includes('theolog')) return 'College of Theology';
        return 'Academic Program';
    }

    function buildCourseDataFromShared() {
        courseData = {};
        if (!window.SharedData) return;

        const catalog = window.SharedData.courseCatalog || [];
        const allStudents = window.SharedData.students || [];

        catalog.forEach(function (c) {
            const code = c.course_code;
            if (!code) return;

            const students = allStudents
                .filter(function (s) {
                    return (
                        s.course === code &&
                        (s.dbStatus === 'active' ||
                            s.dbStatus === 'inactive' ||
                            s.status === 'enrolled')
                    );
                })
                .map(function (s) {
                    const active = s.dbStatus === 'active' || s.status === 'enrolled';
                    return {
                        id: s.id,
                        name: s.name,
                        email: s.email || '',
                        yearLevel: formatYearLevel(s.year_level),
                        status: active ? 'Active' : 'Inactive',
                        course: code,
                        numericId: s.numericId,
                    };
                });

            courseData[code] = {
                name: c.course_name,
                description: c.description || 'Program details from the curriculum.',
                college: collegeLabel(c.course_name),
                code: code,
                courseId: c.id,
                students: students,
            };
        });
    }

    function getCourseIdByCode(courseCode) {
        const entry = courseData[courseCode];
        return entry && entry.courseId ? entry.courseId : null;
    }

    function renderCourseCards() {
        const container = document.getElementById('courseCardsContainer');
        if (!container || !window.SharedData) return;

        const catalog = window.SharedData.courseCatalog || [];
        const previousActive =
            (document.querySelector('.course-card.active') &&
                document.querySelector('.course-card.active').getAttribute('data-course-code')) ||
            '';

        container.innerHTML = '';

        catalog.forEach(function (c, idx) {
            const code = c.course_code;
            const data = courseData[code];
            if (!data) return;

            const card = document.createElement('div');
            card.className = 'course-card';
            card.setAttribute('data-course-code', code);
            if (code === previousActive || (!previousActive && idx === 0)) {
                card.classList.add('active');
            }

            card.innerHTML =
                '<span class="badge">' +
                escapeHtml(code) +
                '</span>' +
                '<h3>' +
                escapeHtml(data.name) +
                '</h3>' +
                '<p>' +
                escapeHtml(data.college) +
                '</p>' +
                '<div class="students">👥 ' +
                data.students.filter(function (s) {
                    return s.status === 'Active';
                }).length +
                ' students enrolled</div>';

            container.appendChild(card);
        });

        container.querySelectorAll('.course-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                if (e.target.closest('.btn-enroll-students')) return;
                container.querySelectorAll('.course-card').forEach(function (c) {
                    c.classList.remove('active');
                });
                card.classList.add('active');
                const code = card.getAttribute('data-course-code') || '';
                updateCourseInfo(code, true);
            });
        });

        container.querySelectorAll('.btn-enroll-students').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const card = btn.closest('.course-card');
                const code = card && card.getAttribute('data-course-code');
                if (code) openEnrollmentModal(code);
            });
        });

        const active = container.querySelector('.course-card.active');
        if (active) {
            updateCourseInfo(active.getAttribute('data-course-code') || '', true);
        } else {
            const title = document.getElementById('courseInfoTitle');
            const desc = document.getElementById('courseInfoDesc');
            const tags = document.getElementById('courseInfoTags');
            if (title) title.textContent = 'No courses';
            if (desc) desc.textContent = 'Add active courses in the database.';
            if (tags) tags.innerHTML = '';
            updateStudentsTable([]);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function updateCourseInfo(courseCode, resetFilters) {
        const course = courseData[courseCode];
        if (!course) return;

        const titleEl = document.getElementById('courseInfoTitle');
        const descEl = document.getElementById('courseInfoDesc');
        const tagsEl = document.getElementById('courseInfoTags');

        if (titleEl) titleEl.textContent = course.name;
        if (descEl) descEl.textContent = course.description;
        if (tagsEl) {
            tagsEl.innerHTML =
                '<span>' +
                escapeHtml(course.code) +
                '</span><span>' +
                escapeHtml(course.college) +
                '</span>';
        }

        if (resetFilters) {
            const searchInput = document.getElementById('courseSearchInput');
            const yearLevelFilter = document.getElementById('courseYearLevelFilter');
            const statusFilter = document.getElementById('courseStatusFilter');
            if (searchInput) searchInput.value = '';
            if (yearLevelFilter) yearLevelFilter.value = 'all';
            if (statusFilter) statusFilter.value = 'all';
        }

        applyFilters();
    }

    function renderCoursePagination(totalRecords) {
        const info = document.getElementById('coursePaginationInfo');
        const prevBtn = document.getElementById('coursePrevBtn');
        const nextBtn = document.getElementById('courseNextBtn');
        const pagesEl = document.getElementById('coursePaginationPages');
        const totalPages = Math.max(1, Math.ceil(totalRecords / COURSE_ITEMS_PER_PAGE));
        const startIndex = totalRecords === 0 ? 0 : ((currentCoursePage - 1) * COURSE_ITEMS_PER_PAGE) + 1;
        const endIndex = Math.min(currentCoursePage * COURSE_ITEMS_PER_PAGE, totalRecords);

        if (info) {
            info.textContent = totalRecords === 0
                ? 'Showing 0 of 0'
                : `Showing ${startIndex} to ${endIndex} of ${totalRecords}`;
        }

        if (prevBtn) {
            prevBtn.disabled = currentCoursePage <= 1 || totalRecords === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = currentCoursePage >= totalPages || totalRecords === 0;
        }

        if (!pagesEl) {
            return;
        }

        pagesEl.innerHTML = '';
        if (totalRecords === 0) {
            return;
        }

        let startPage = Math.max(1, currentCoursePage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        startPage = Math.max(1, endPage - 4);

        for (let page = startPage; page <= endPage; page++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'course-page-number' + (page === currentCoursePage ? ' active' : '');
            button.textContent = String(page);
            button.addEventListener('click', function () {
                currentCoursePage = page;
                applyFilters(false);
            });
            pagesEl.appendChild(button);
        }
    }

    function updateStudentsTable(students) {
        const tableBody = document.querySelector('.table-card tbody');
        const tableTitle = document.getElementById('courseTableTitle');
        if (tableTitle) {
            tableTitle.textContent = 'Enrolled Students (' + (students ? students.length : 0) + ')';
        }
        if (!tableBody) return;

        tableBody.innerHTML = '';

        const list = Array.isArray(students) ? students : [];
        const totalPages = Math.max(1, Math.ceil(list.length / COURSE_ITEMS_PER_PAGE));
        if (currentCoursePage > totalPages) {
            currentCoursePage = totalPages;
        }
        const startIndex = (currentCoursePage - 1) * COURSE_ITEMS_PER_PAGE;
        const pageItems = list.slice(startIndex, startIndex + COURSE_ITEMS_PER_PAGE);

        renderCoursePagination(list.length);

        if (pageItems.length > 0) {
            pageItems.forEach(function (student) {
                const row = document.createElement('tr');
                row.innerHTML =
                    '<td>' +
                    escapeHtml(student.name) +
                    '</td><td>' +
                    escapeHtml(student.email) +
                    '</td><td>' +
                    escapeHtml(student.yearLevel) +
                    '</td><td><span class="status ' +
                    student.status.toLowerCase() +
                    '">' +
                    escapeHtml(student.status) +
                    '</span></td>';
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML =
                '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #6b7280;">No students for this course</td></tr>';
        }
    }

    function applyFilters(resetPage) {
        if (resetPage !== false) {
            currentCoursePage = 1;
        }

        const activeCard = document.querySelector('#courseCardsContainer .course-card.active');
        if (!activeCard) return;

        const courseCode = activeCard.getAttribute('data-course-code') || '';
        const course = courseData[courseCode];
        if (!course) return;

        const searchInput = document.getElementById('courseSearchInput');
        const yearLevelFilter = document.getElementById('courseYearLevelFilter');
        const statusFilter = document.getElementById('courseStatusFilter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedYear = yearLevelFilter ? yearLevelFilter.value : 'all';
        const selectedStatus = statusFilter ? statusFilter.value : 'all';

        const filtered = course.students.filter(function (student) {
            if (student.course && student.course !== courseCode) return false;

            const matchesSearch =
                !searchTerm ||
                student.name.toLowerCase().includes(searchTerm) ||
                (student.email && student.email.toLowerCase().includes(searchTerm));

            let matchesYear = true;
            if (selectedYear !== 'all') {
                matchesYear = student.yearLevel.toLowerCase().includes(selectedYear.toLowerCase());
            }

            let matchesStatus = true;
            if (selectedStatus !== 'all') {
                matchesStatus = student.status.toLowerCase() === selectedStatus.toLowerCase();
            }

            return matchesSearch && matchesYear && matchesStatus;
        });

        updateStudentsTable(filtered);
    }

    let filtersSetup = false;

    function setupFilters() {
        if (filtersSetup) return;

        const searchInput = document.getElementById('courseSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                applyFilters(true);
            });
        }
        const yearLevelFilter = document.getElementById('courseYearLevelFilter');
        if (yearLevelFilter) {
            yearLevelFilter.addEventListener('change', function () {
                applyFilters(true);
            });
        }
        const statusFilter = document.getElementById('courseStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function () {
                applyFilters(true);
            });
        }

        const prevBtn = document.getElementById('coursePrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                if (currentCoursePage > 1) {
                    currentCoursePage--;
                    applyFilters(false);
                }
            });
        }

        const nextBtn = document.getElementById('courseNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                currentCoursePage++;
                applyFilters(false);
            });
        }

        filtersSetup = true;
    }

    function fullRender() {
        buildCourseDataFromShared();
        renderCourseCards();
        setupFilters();
    }

    if (window.SharedData) {
        window.SharedData.on('ready', fullRender);
        window.SharedData.on('studentsUpdated', fullRender);
        window.SharedData.on('enrolleeApproved', fullRender);
        if (window.SharedData.ready) fullRender();
    } else {
        fullRender();
    }

    async function fetchAvailableStudentsForEnrollment(searchTerm) {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            const response = await fetch('api/student_available_enroll.php?' + params.toString());
            const data = await response.json();
            if (data.ok) return data.students || [];
            return [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async function enrollStudentToCourse(studentId, courseCode, yearLevel, semester) {
        try {
            const courseId = getCourseIdByCode(courseCode);
            if (!courseId) {
                alert('Course not found');
                return false;
            }

            const response = await fetch('api/student_enroll.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentId,
                    courseId: courseId,
                    yearLevel: yearLevel,
                    semester: semester,
                    academicYear: getCurrentAcademicYear(),
                }),
            });

            const data = await response.json();
            if (data.ok) {
                if (window.SharedData && window.SharedData.refreshStudents) {
                    await window.SharedData.refreshStudents();
                }
                return true;
            }
            alert(data.error || 'Failed to enroll');
            return false;
        } catch (e) {
            console.error(e);
            alert('Error enrolling student');
            return false;
        }
    }

    function getCurrentAcademicYear() {
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        const startYear = month < 6 ? year - 1 : year;
        return startYear + '-' + (startYear + 1);
    }

    function openEnrollmentModal(courseCode) {
        if (!courseCanEnroll) return;
        let modal = document.getElementById('enrollmentModal');
        if (!modal) {
            createEnrollmentModal(courseCode);
            modal = document.getElementById('enrollmentModal');
        }
        if (modal) {
            modal.dataset.courseCode = courseCode;
            loadAvailableStudentsForEnrollment(courseCode);
            modal.style.display = 'flex';
        }
    }

    async function loadAvailableStudentsForEnrollment(courseCode) {
        const modal = document.getElementById('enrollmentModal');
        const studentsList = modal && modal.querySelector('.available-students-for-enrollment');
        if (!studentsList) return;

        studentsList.innerHTML = '<div class="loading">Loading students...</div>';

        const students = await fetchAvailableStudentsForEnrollment('');

        if (students.length === 0) {
            studentsList.innerHTML = '<div class="no-data">No students available for enrollment</div>';
            return;
        }

        studentsList.innerHTML = students
            .map(function (student) {
                return (
                    '<div class="enrollment-student-item">' +
                    '<div class="enrollment-student-info">' +
                    '<div class="enrollment-student-name">' +
                    escapeHtml(student.first_name + ' ' + student.last_name) +
                    '</div>' +
                    '<div class="enrollment-student-details">' +
                    '<span>' +
                    escapeHtml(student.student_id || '') +
                    '</span>' +
                    '<span>' +
                    escapeHtml(student.email || '') +
                    '</span>' +
                    '<span>Year ' +
                    escapeHtml(String(student.year_level || '')) +
                    '</span>' +
                    '</div></div>' +
                    '<div class="enrollment-controls">' +
                    '<select class="year-level-select" data-student-id="' +
                    student.id +
                    '">' +
                    '<option value="1"' + (parseInt(student.year_level, 10) === 1 ? ' selected' : '') + '>1st Year</option>' +
                    '<option value="2"' + (parseInt(student.year_level, 10) === 2 ? ' selected' : '') + '>2nd Year</option>' +
                    '<option value="3"' + (parseInt(student.year_level, 10) === 3 ? ' selected' : '') + '>3rd Year</option>' +
                    '<option value="4"' + (parseInt(student.year_level, 10) === 4 ? ' selected' : '') + '>4th Year</option>' +
                    '</select>' +
                    '<button type="button" class="btn-enroll-now" data-student-id="' +
                    student.id +
                    '" data-semester="' +
                    (parseInt(student.current_semester, 10) || 1) +
                    '">Enroll</button>' +
                    '</div></div>'
                );
            })
            .join('');

        studentsList.querySelectorAll('.btn-enroll-now').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                const studentId = parseInt(btn.getAttribute('data-student-id'), 10);
                const semester = parseInt(btn.getAttribute('data-semester'), 10) || 1;
                const yearLevelSelect = modal.querySelector(
                    '.year-level-select[data-student-id="' + studentId + '"]'
                );
                const yearLevel = yearLevelSelect ? parseInt(yearLevelSelect.value, 10) : 1;
                const code = modal.dataset.courseCode || courseCode;

                btn.disabled = true;
                btn.textContent = 'Enrolling...';

                const ok = await enrollStudentToCourse(studentId, code, yearLevel, semester);
                if (ok) {
                    btn.textContent = 'Enrolled ✓';
                    const item = btn.closest('.enrollment-student-item');
                    if (item) item.remove();
                    if (studentsList.querySelectorAll('.enrollment-student-item').length === 0) {
                        studentsList.innerHTML =
                            '<div class="no-data">No more students in this list</div>';
                    }
                } else {
                    btn.disabled = false;
                    btn.textContent = 'Enroll';
                }
            });
        });
    }

    function createEnrollmentModal(courseCode) {
        const modal = document.createElement('div');
        modal.id = 'enrollmentModal';
        modal.className = 'modal-overlay';
        modal.dataset.courseCode = courseCode;
        modal.innerHTML =
            '<div class="modal-content enrollment-modal">' +
            '<div class="modal-header">' +
            '<h2>Enroll students</h2>' +
            '<button type="button" class="modal-close">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<div class="available-students-for-enrollment"></div>' +
            '</div></div>';

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', function () {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
        });

        loadAvailableStudentsForEnrollment(courseCode);
    }
});
