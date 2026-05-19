document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('subjectsTableBody');
    const subjectsSetupGrid = document.getElementById('subjectsSetupGrid');
    if (!tableBody && !subjectsSetupGrid) return;

    const courseFilter = document.getElementById('subjectCourseFilter');
    const yearLevelFilter = document.getElementById('subjectYearLevelFilter');
    const semesterFilter = document.getElementById('subjectSemesterFilter');
    const selectAllCheckbox = document.getElementById('selectAllSubjects');
    const btnOffer = document.getElementById('btnSubjectOffer');
    const btnOfferLabel = document.getElementById('btnSubjectOfferLabel');
    const pageNote = document.getElementById('subjectsPageNote');
    const offerModal = document.getElementById('offerSubjectsModal');
    const offerModalOverlay = document.getElementById('offerModalOverlay');
    const offerModalClose = document.getElementById('offerModalClose');
    const offerModalCancel = document.getElementById('offerModalCancel');
    const offerModalSave = document.getElementById('offerModalSave');
    const offerModalCourse = document.getElementById('offerModalCourse');
    const offerModalYearLevel = document.getElementById('offerModalYearLevel');
    const offerModalSemester = document.getElementById('offerModalSemester');
    const offerModalSummary = document.getElementById('offerModalSummary');
    const offerSelectedSubjectsList = document.getElementById('offerSelectedSubjectsList');
    const batchPreviewBtn = document.getElementById('btnBatchPreviewCOR');
    const batchPrintBtn = document.getElementById('btnBatchPrintCOR');
    const batchPrintModal = document.getElementById('batchPrintCorModal');
    const batchPrintOverlay = document.getElementById('batchPrintCorOverlay');
    const batchPrintClose = document.getElementById('batchPrintCorClose');
    const batchPrintCancel = document.getElementById('batchPrintCorCancel');
    const batchPrintRefresh = document.getElementById('batchPrintPreviewBtn');
    const batchPrintPrint = document.getElementById('batchPrintCorPrintBtn');
    const batchPrintSummary = document.getElementById('batchPrintSummary');
    const corAcademicYearInput = document.getElementById('corAcademicYearInput');
    const corTuitionFeeInput = document.getElementById('corTuitionFeeInput');
    const corMiscFeeInput = document.getElementById('corMiscFeeInput');
    const corScheduleTableBody = document.getElementById('corScheduleTableBody');
    const corBatchStudentCount = document.getElementById('corBatchStudentCount');
    const corMatchingStudentsInfo = document.getElementById('corMatchingStudentsInfo');
    const corPrintPreview = document.getElementById('corPrintPreview');
    const API_BASE = String(window.ApiBaseUrl || 'api').replace(/\/$/, '');
    const pageMode = String((document.body && document.body.getAttribute('data-page')) || '').toLowerCase();
    const isOfferedPage = pageMode === 'offered';

    const isEditor = window.UserCan && window.UserCan.edit('curriculum');
    const canSelectSubjects = isEditor && !isOfferedPage;
    const studentCourseCode = window.AppUser ? String(window.AppUser.course_code || window.AppUser.courseCode || window.AppUser.course || '').trim() : '';
    const studentYearLevel = window.AppUser ? String(window.AppUser.year_level || window.AppUser.yearLevel || window.AppUser.year || '').trim() : '';
    const studentSemester = window.AppUser ? String(window.AppUser.current_semester || window.AppUser.currentSemester || '').trim() : '';
    const activeAcademicYear = window.AppUser ? String(window.AppUser.current_academic_year || window.AppUser.academicYear || window.AppUser.academic_year || '').trim() : '';
    const normalizedUserRole = String((window.AppUser && (window.AppUser.role || window.AppUser.userRole)) || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const canSelfEnroll = normalizedUserRole === 'student' && !isOfferedPage;
    const canBatchPrint = isOfferedPage && normalizedUserRole !== 'student';

    let currentCourse = 'all';
    let currentYearLevel = 'all';
    let currentSemester = 'all';
    let subjectsCache = [];
    let assignedCurriculumSubjects = [];
    let selectedSubjectIds = new Set();
    let enrollingSubjectIds = new Set();
    let matchingStudentsCache = [];
    let scheduleEntries = [];
    let previewReady = false;

    if ((!isEditor || isOfferedPage) && btnOffer) {
        btnOffer.style.display = 'none';
    }
    if ((!isEditor || isOfferedPage) && selectAllCheckbox) {
        const toggle = selectAllCheckbox.closest('.bulk-select-toggle');
        if (toggle) toggle.style.display = 'none';
    }
    if (!canBatchPrint && batchPrintBtn) {
        batchPrintBtn.style.display = 'none';
    }
    if (!canBatchPrint && batchPreviewBtn) {
        batchPreviewBtn.style.display = 'none';
    }

    if (pageNote) {
        if (normalizedUserRole === 'student' && isOfferedPage) {
            const currentSemesterLabel = studentSemester === '1' ? '1st Semester' : studentSemester === '2' ? '2nd Semester' : 'Unknown';
            pageNote.textContent = `Showing the subjects you already enrolled (Current: Year ${studentYearLevel}, ${currentSemesterLabel}). This page is read-only.`;
        } else if (normalizedUserRole === 'student') {
            const currentSemesterLabel = studentSemester === '1' ? '1st Semester' : studentSemester === '2' ? '2nd Semester' : 'Unknown';
            const enrollmentPeriodActive = window.AppUser && window.AppUser.progression_status === 'pending_progression';
            
            if (enrollmentPeriodActive) {
                pageNote.textContent = studentCourseCode
                    ? `🎓 ENROLLMENT PERIOD ACTIVE: Enroll in next semester subjects for ${studentCourseCode} (Current: Year ${studentYearLevel}, ${currentSemesterLabel}).`
                    : `🎓 ENROLLMENT PERIOD ACTIVE: Enroll in next semester subjects (Current: Year ${studentYearLevel}, ${currentSemesterLabel}).`;
                pageNote.style.backgroundColor = '#065f46';
                pageNote.style.color = '#d1fae5';
                pageNote.style.fontWeight = 'bold';
            } else {
                pageNote.textContent = studentCourseCode
                    ? `Showing current subjects for ${studentCourseCode} (Year ${studentYearLevel}, ${currentSemesterLabel}). Next semester subjects will appear when enrollment period opens.`
                    : `Showing current subjects (Year ${studentYearLevel}, ${currentSemesterLabel}). Next semester subjects will appear when enrollment period opens.`;
                pageNote.style.backgroundColor = '';
                pageNote.style.color = '';
                pageNote.style.fontWeight = '';
            }
        } else if (isOfferedPage) {
            pageNote.textContent = 'Showing only subjects that were saved as offered for their course, year level, and semester.';
        } else {
            pageNote.textContent = 'Select subjects, click Offer Selected, then save the course, year level, and semester setup.';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function getYearSuffix(year) {
        const suffixes = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' };
        return suffixes[Number(year)] || 'th';
    }

    function formatSemesterLabel(semester) {
        const value = String(semester || '');
        if (value === '1') return '1st Semester';
        if (value === '2') return '2nd Semester';
        return value || '—';
    }

    function getDisplayYearLabel() {
        if (activeAcademicYear) {
            return activeAcademicYear;
        }
        return String(new Date().getFullYear());
    }

    function isSubjectOffered(subject) {
        return Number(subject && subject.is_offered || 0) === 1;
    }

    function isSubjectEnrolled(subject) {
        return Number(subject && subject.is_enrolled || 0) === 1;
    }

    function getTableColspan() {
        return 7 + (canSelectSubjects ? 1 : 0);
    }

    function restrictStudentFilterOptions() {
        if (!studentYearLevel || !yearLevelFilter) return;

        const sYearLevel = Number(studentYearLevel) || 0;
        if (sYearLevel <= 0) return;

        const sSemester = Number(studentSemester) || 0;
        // Calculate next enrollment term
        const nextYearLevel = sSemester === 2 ? Math.min(sYearLevel + 1, 4) : sYearLevel;
        const nextSemester = sSemester === 1 ? 2 : 1;

        // If student just progressed (ended 2nd sem), force filters to next year/1st sem
        if (window.AppUser && window.AppUser.progression_status === 'pending_progression') {
            if (sSemester === 2) {
                // Set year level filter to next year
                if (yearLevelFilter) yearLevelFilter.value = String(nextYearLevel);
                // Set semester filter to 1st semester
                if (semesterFilter) semesterFilter.value = '1';
            }
        }

        // Check if student just progressed to new year (1st semester with pending_progression)
        const justProgressedToNewYear = window.AppUser && 
            window.AppUser.progression_status === 'pending_progression' && 
            sSemester === 1;

        // Show year levels up to next enrollment year
        if (yearLevelFilter.options) {
            for (let i = 0; i < yearLevelFilter.options.length; i++) {
                const option = yearLevelFilter.options[i];
                const optionValue = String(option.value || '').trim();
                if (optionValue && optionValue !== 'all') {
                    const optionYear = Number(optionValue);
                    // Hide years beyond next enrollment year
                    if (optionYear > nextYearLevel) {
                        option.style.display = 'none';
                    } else {
                        option.style.display = '';
                    }
                }
            }
        }

        // Update semester options based on selected year level
        if (semesterFilter && semesterFilter.options) {
            const selectedYear = Number(yearLevelFilter.value) || 0;
            for (let i = 0; i < semesterFilter.options.length; i++) {
                const option = semesterFilter.options[i];
                const optionValue = String(option.value || '').trim();

                if (optionValue && optionValue !== 'all') {
                    const optionSemester = Number(optionValue);

                    // Set semester label without "(current)" marker
                    const baseLabel = optionSemester === 1 ? '1st Semester' : '2nd Semester';
                    option.textContent = baseLabel;

                    // If student just progressed to new year (1st sem), disable 2nd semester
                    if (justProgressedToNewYear && optionSemester === 2) {
                        option.disabled = true;
                        option.style.display = 'none';
                        // Also visually indicate it's disabled
                        if (semesterFilter.value === '2') {
                            semesterFilter.value = '1';
                        }
                        continue;
                    }

                    // Show semesters based on progression logic
                    if (selectedYear === sYearLevel) {
                        // Current year: show up to next semester
                        if (optionSemester > nextSemester) {
                            option.style.display = 'none';
                        } else {
                            option.style.display = '';
                            option.disabled = false;
                        }
                    } else if (selectedYear === nextYearLevel && selectedYear > sYearLevel) {
                        // Next year (only if student is in sem 2): show only semester 1
                        if (optionSemester > 1) {
                            option.style.display = 'none';
                        } else {
                            option.style.display = '';
                            option.disabled = false;
                        }
                    } else {
                        // Past years: show all semesters
                        option.style.display = '';
                        option.disabled = false;
                    }
                }
            }
        }
    }

    function redirectToOfferedPage() {
        const currentPath = String(window.location.pathname || '');

        if (/\/app\/offer\/?$/i.test(currentPath)) {
            window.location.assign(currentPath.replace(/\/offer\/?$/i, '/offered'));
            return;
        }

        if (/\/superadmin\/offer\.php$/i.test(currentPath)) {
            window.location.assign(currentPath.replace(/offer\.php$/i, 'offered.php'));
            return;
        }

        window.location.assign('offered');
    }

    async function enrollSubject(subjectId, options) {
        const normalizedId = String(subjectId || '').trim();
        if (!normalizedId || enrollingSubjectIds.has(normalizedId)) return false;

        const subject = options && options.subject
            ? options.subject
            : subjectsCache.find(function (item) {
                return String(item.offering_id || item.id) === normalizedId;
            });

        if (!subject || !isSubjectOffered(subject)) {
            if (!(options && options.silent)) {
                alert('Only offered subjects can be enrolled.');
            }
            return false;
        }

        enrollingSubjectIds.add(normalizedId);
        renderTable(subjectsCache);
        renderSetupGrid(subjectsCache, currentSemester);

        try {
            const response = await fetch(`${API_BASE}/student_curriculum_assignments.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'self_enroll',
                    offering_id: Number(subject.offering_id || normalizedId),
                    curriculum_id: Number(subject.id || 0)
                })
            });

            const data = await response.json().catch(function () { return {}; });
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Failed to enroll this subject');
            }

            subjectsCache = subjectsCache.map(function (item) {
                if (String(item.offering_id || item.id) === normalizedId) {
                    return Object.assign({}, item, { is_enrolled: 1 });
                }
                return item;
            });

            return true;
        } catch (error) {
            if (!(options && options.silent)) {
                alert(error && error.message ? error.message : 'Unable to enroll this subject right now.');
            }
            return false;
        } finally {
            enrollingSubjectIds.delete(normalizedId);
            renderTable(subjectsCache);
            renderSetupGrid(subjectsCache, currentSemester);
        }
    }

    async function enrollSetupSubjects(setupSubjects) {
        const items = Array.isArray(setupSubjects) ? setupSubjects.filter(function (subject) {
            return subject && !isSubjectEnrolled(subject) && isSubjectOffered(subject);
        }) : [];

        if (!items.length) {
            alert('No available subjects to enroll in this setup.');
            return;
        }

        let successCount = 0;
        for (const subject of items) {
            const enrolled = await enrollSubject(String(subject.offering_id || subject.id), { subject: subject, silent: true });
            if (enrolled) {
                successCount++;
            }
        }

        if (successCount === 0) {
            alert('Unable to enroll this offered setup right now.');
            return;
        }

        alert(`Successfully enrolled ${successCount} subject${successCount === 1 ? '' : 's'}. The subject list will stay visible while the admin side updates your re-enrollment status.`);
    }

    function getSelectedSubjects() {
        return subjectsCache.filter(function (subject) {
            return selectedSubjectIds.has(String(subject.id));
        });
    }

    function updateOfferButtonState() {
        const selectedCount = selectedSubjectIds.size;

        if (btnOffer) {
            btnOffer.disabled = !canSelectSubjects || selectedCount === 0;
        }

        if (btnOfferLabel) {
            btnOfferLabel.textContent = selectedCount > 0
                ? `Offer Selected (${selectedCount})`
                : 'Offer Selected';
        }

        if (selectAllCheckbox) {
            const total = subjectsCache.length;
            selectAllCheckbox.checked = total > 0 && selectedCount === total;
            selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < total;
        }

        const hasSpecificSetup = currentCourse !== 'all' && currentYearLevel !== 'all' && currentSemester !== 'all';
        const canPrepareBatch = hasSpecificSetup && Array.isArray(subjectsCache) && subjectsCache.length > 0;

        if (batchPreviewBtn) {
            batchPreviewBtn.disabled = !canBatchPrint || !canPrepareBatch;
        }

        if (batchPrintBtn) {
            batchPrintBtn.disabled = !canBatchPrint || !canPrepareBatch || !previewReady;
        }

        if (batchPrintPrint) {
            batchPrintPrint.disabled = !canBatchPrint || !canPrepareBatch || !previewReady;
        }
    }

    function renderSelectedSubjectsList(selectedSubjects) {
        if (!offerSelectedSubjectsList) return;

        if (!selectedSubjects.length) {
            offerSelectedSubjectsList.innerHTML = '<li>No subjects selected yet.</li>';
            return;
        }

        offerSelectedSubjectsList.innerHTML = selectedSubjects.map(function (subject) {
            const code = escapeHtml(subject.subject_code || '');
            const name = escapeHtml(subject.subject_name || subject.description || '');
            return `<li><strong>${code}</strong> — ${name}</li>`;
        }).join('');
    }

    function updateOfferModalSummary(selectedCount) {
        if (!offerModalSummary) return;

        const course = offerModalCourse ? String(offerModalCourse.value || '').trim() : '';
        const yearLevel = offerModalYearLevel ? String(offerModalYearLevel.value || '').trim() : '';
        const semester = offerModalSemester ? String(offerModalSemester.value || '').trim() : '';
        const yearText = yearLevel ? `${yearLevel}${getYearSuffix(Number(yearLevel))} Year` : 'Not selected';
        const semesterText = semester ? formatSemesterLabel(semester) : 'Not selected';
        const courseText = course || 'Not selected';

        offerModalSummary.textContent = `Setup: Course ${courseText} • Year Level ${yearText} • Semester ${semesterText} • ${selectedCount || 0} selected subject(s)`;
        offerModalSummary.classList.toggle('incomplete', !course || !yearLevel || !semester);
    }

    function openOfferModal() {
        const selectedSubjects = getSelectedSubjects();
        if (!selectedSubjects.length) {
            alert('Please select at least one subject first.');
            return;
        }

        if (!offerModal || !offerModalOverlay) return;

        const firstSubject = selectedSubjects[0] || {};
        if (offerModalCourse) {
            offerModalCourse.value = currentCourse !== 'all'
                ? currentCourse
                : String(firstSubject.course_code || '');
        }
        if (offerModalYearLevel) {
            offerModalYearLevel.value = currentYearLevel !== 'all'
                ? currentYearLevel
                : String(firstSubject.year_level || '');
        }
        if (offerModalSemester) {
            offerModalSemester.value = currentSemester !== 'all'
                ? currentSemester
                : String(firstSubject.semester || '');
        }

        renderSelectedSubjectsList(selectedSubjects);
        updateOfferModalSummary(selectedSubjects.length);
        offerModal.classList.add('active');
        offerModalOverlay.classList.add('active');
    }

    function closeOfferModal() {
        if (offerModal) offerModal.classList.remove('active');
        if (offerModalOverlay) offerModalOverlay.classList.remove('active');
    }

    function formatMoney(value) {
        const amount = Number(value || 0);
        if (!Number.isFinite(amount)) {
            return '0.00';
        }

        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getOfferedSubjectsForPrint() {
        return Array.isArray(subjectsCache)
            ? subjectsCache.filter(function (subject) {
                return isSubjectOffered(subject);
            })
            : [];
    }

    function syncScheduleEntries() {
        const existingMap = new Map(scheduleEntries.map(function (entry) {
            return [entry.id, entry];
        }));

        scheduleEntries = getOfferedSubjectsForPrint().map(function (subject) {
            const id = String(subject.offering_id || subject.id || '');
            const existing = existingMap.get(id) || {};

            return {
                id: id,
                subject_code: String(subject.subject_code || ''),
                subject_name: String(subject.subject_name || subject.description || ''),
                units: Number(subject.units || 0),
                date: String(existing.date || ''),
                time: String(existing.time || ''),
                professor: String(existing.professor || subject.professor_name || '')
            };
        });

        return scheduleEntries;
    }

    function updateBatchPrintSummary() {
        if (!batchPrintSummary) return;

        const courseText = currentCourse !== 'all' ? currentCourse : 'Not selected';
        const yearText = currentYearLevel !== 'all'
            ? `${currentYearLevel}${getYearSuffix(Number(currentYearLevel))} Year`
            : 'Not selected';
        const semesterText = currentSemester !== 'all' ? formatSemesterLabel(currentSemester) : 'Not selected';
        const subjectCount = getOfferedSubjectsForPrint().length;

        batchPrintSummary.textContent = `Setup: ${courseText} • ${yearText} • ${semesterText} • ${subjectCount} offered subject(s)`;
        batchPrintSummary.classList.toggle('incomplete', courseText === 'Not selected' || yearText === 'Not selected' || semesterText === 'Not selected' || subjectCount === 0);
    }

    function renderScheduleTable() {
        if (!corScheduleTableBody) return;

        const rows = syncScheduleEntries();
        if (!rows.length) {
            corScheduleTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 24px; color: #9ca3af;">No offered subjects found for the selected setup.</td></tr>';
            return;
        }

        corScheduleTableBody.innerHTML = rows.map(function (entry) {
            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(entry.subject_code)}</strong><br>
                        <span style="color:#6b7280; font-size:12px;">${escapeHtml(entry.subject_name)}</span>
                    </td>
                    <td><input type="text" class="cor-schedule-input" data-schedule-id="${escapeHtml(entry.id)}" data-field="date" value="${escapeHtml(entry.date)}" placeholder="e.g. Mon/Wed"></td>
                    <td><input type="text" class="cor-schedule-input" data-schedule-id="${escapeHtml(entry.id)}" data-field="time" value="${escapeHtml(entry.time)}" placeholder="e.g. 8:00 AM - 12:00 PM"></td>
                    <td><input type="text" class="cor-schedule-input" data-schedule-id="${escapeHtml(entry.id)}" data-field="professor" value="${escapeHtml(entry.professor)}" placeholder="Professor name"></td>
                </tr>
            `;
        }).join('');
    }

    async function loadMatchingStudents() {
        const response = await fetch(`${API_BASE}/students_list.php`, { credentials: 'same-origin' });
        if (!response.ok) {
            throw new Error(`Failed to load students: ${response.statusText}`);
        }

        const data = await response.json().catch(function () { return {}; });
        if (!data.ok) {
            throw new Error(data.error || 'Failed to load matching students');
        }

        matchingStudentsCache = Array.isArray(data.students) ? data.students : [];
        return matchingStudentsCache;
    }

    function getMatchingStudentsForCurrentSetup() {
        return matchingStudentsCache.filter(function (student) {
            const studentCourse = String(student.course_code || '').trim().toUpperCase();
            const studentYear = String(student.year_level || '').trim();
            const studentSemester = String(student.current_semester || '').trim();
            const status = String(student.status || '').trim().toLowerCase();

            if (currentCourse !== 'all' && studentCourse !== String(currentCourse).trim().toUpperCase()) {
                return false;
            }

            if (currentYearLevel !== 'all' && studentYear !== String(currentYearLevel).trim()) {
                return false;
            }

            if (currentSemester !== 'all' && studentSemester !== String(currentSemester).trim()) {
                return false;
            }

            return !['inactive', 'graduated', 'transferred'].includes(status);
        });
    }

    function renderMatchingStudentsInfo(students) {
        if (!corMatchingStudentsInfo) return;

        if (!Array.isArray(students) || !students.length) {
            corMatchingStudentsInfo.innerHTML = '<div class="curriculum-setup-empty">No student information available for the current setup.</div>';
            return;
        }

        corMatchingStudentsInfo.innerHTML = `
            <div class="cor-student-info-header">
                <h3>Matching Students</h3>
                <span class="curriculum-setup-count">${students.length} student(s)</span>
            </div>
            <div class="curriculum-table-container">
                <table class="curriculum-table cor-student-info-table">
                    <thead>
                        <tr>
                            <th>Student No</th>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Year</th>
                            <th>Semester</th>
                            <th>Academic Year</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(function (student) {
                            const fullName = [student.last_name, student.first_name, student.middle_name].filter(Boolean).join(', ');
                            return `
                                <tr>
                                    <td>${escapeHtml(student.student_id || '')}</td>
                                    <td>${escapeHtml(fullName)}</td>
                                    <td>${escapeHtml(student.course_code || '')}</td>
                                    <td>${escapeHtml(String(student.year_level || ''))}</td>
                                    <td>${escapeHtml(formatSemesterLabel(student.current_semester || ''))}</td>
                                    <td>${escapeHtml(String(student.current_academic_year || '—'))}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function buildCorTableRows() {
        const rows = syncScheduleEntries();
        const rowCount = Math.max(rows.length, 4);

        return Array.from({ length: rowCount }).map(function (_, index) {
            const entry = rows[index];
            if (!entry) {
                return '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>';
            }

            return `
                <tr>
                    <td>${escapeHtml(entry.subject_code)}</td>
                    <td>${escapeHtml(entry.subject_name)}</td>
                    <td>${escapeHtml(String(entry.units || 0))}</td>
                    <td>${escapeHtml(entry.date || '')}</td>
                    <td>${escapeHtml(entry.time || '')}</td>
                    <td>${escapeHtml(entry.professor || '')}</td>
                </tr>
            `;
        }).join('');
    }

    function buildCorCopy(student, copyLabel) {
        const surname = escapeHtml(student.last_name || '');
        const firstName = escapeHtml(student.first_name || '');
        const middleName = escapeHtml(student.middle_name || '');
        const studentNo = escapeHtml(student.student_id || '');
        const courseText = escapeHtml(student.course_name || student.course_code || currentCourse || '');
        const yearText = escapeHtml(String(student.year_level || currentYearLevel || ''));
        const academicYearValue = escapeHtml(String((corAcademicYearInput && corAcademicYearInput.value) || student.current_academic_year || getDisplayYearLabel()));
        const totalUnits = syncScheduleEntries().reduce(function (sum, entry) {
            return sum + Number(entry.units || 0);
        }, 0);
        const tuition = Number(corTuitionFeeInput && corTuitionFeeInput.value || 0);
        const misc = Number(corMiscFeeInput && corMiscFeeInput.value || 0);
        const totalFees = tuition + misc;

        return `
            <section class="cor-copy">
                <div class="cor-copy-header-row">
                    <span class="cor-copy-title">CERTIFICATE OF REGISTRATION</span>
                    <span class="cor-copy-label">${escapeHtml(copyLabel)}</span>
                </div>

                <div class="cor-school-header">
                    <div class="cor-school-name">KURIOS CHRISTIAN COLLEGES FOUNDATION, INC.</div>
                    <div>Bundia I, Magallanes Cavite</div>
                    <div>Office of the College Registrar</div>
                </div>

                <div class="cor-field-row cor-name-row">
                    <div class="cor-field-label">Name:</div>
                    <div class="cor-name-grid">
                        <div class="cor-line-cell">
                            <span class="cor-line-value">${surname}</span>
                            <span class="cor-line-caption">Surname</span>
                        </div>
                        <div class="cor-line-cell">
                            <span class="cor-line-value">${firstName}</span>
                            <span class="cor-line-caption">First Name</span>
                        </div>
                        <div class="cor-line-cell">
                            <span class="cor-line-value">${middleName}</span>
                            <span class="cor-line-caption">Middle Name</span>
                        </div>
                    </div>
                </div>

                <div class="cor-meta-grid">
                    <div class="cor-meta-item"><span class="cor-field-label">Student No:</span><span class="cor-inline-value">${studentNo}</span></div>
                    <div class="cor-meta-item"><span class="cor-field-label">Academic Year / Term:</span><span class="cor-inline-value">${academicYearValue} / ${escapeHtml(formatSemesterLabel(currentSemester))}</span></div>
                    <div class="cor-meta-item"><span class="cor-field-label">Course:</span><span class="cor-inline-value">${courseText}</span></div>
                    <div class="cor-meta-item"><span class="cor-field-label">Year:</span><span class="cor-inline-value">${yearText}</span></div>
                </div>

                <table class="cor-copy-table">
                    <thead>
                        <tr>
                            <th>CODE</th>
                            <th>SUBJECT DESCRIPTION</th>
                            <th>UNITS</th>
                            <th>DATE</th>
                            <th>TIME</th>
                            <th>PROFESSOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buildCorTableRows()}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="cor-total-label">TOTAL</td>
                            <td>${escapeHtml(String(totalUnits))}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tfoot>
                </table>

                <div class="cor-copy-footer">
                    <div class="cor-signatures">
                        <div class="cor-signature-block"><span class="cor-signature-line"></span><span class="cor-signature-label">STUDENT</span></div>
                        <div class="cor-signature-block"><span class="cor-signature-line"></span><span class="cor-signature-label">CASHIER</span></div>
                        <div class="cor-signature-block"><span class="cor-signature-line"></span><span class="cor-signature-label">Acting Registrar</span></div>
                    </div>

                    <table class="cor-fee-table">
                        <tr><th colspan="2">SEMESTRAL FEE</th></tr>
                        <tr><td>Tuition Fee</td><td>${formatMoney(tuition)}</td></tr>
                        <tr><td>Misc. Fee</td><td>${formatMoney(misc)}</td></tr>
                        <tr><td><strong>TOTAL</strong></td><td><strong>${formatMoney(totalFees)}</strong></td></tr>
                    </table>
                </div>
            </section>
        `;
    }

    function renderBatchCorPreview() {
        if (!corPrintPreview) return;

        updateBatchPrintSummary();
        const students = getMatchingStudentsForCurrentSetup();
        renderMatchingStudentsInfo(students);

        if (!students.length) {
            previewReady = false;
            if (corBatchStudentCount) {
                corBatchStudentCount.textContent = 'No matching active students were found for the selected course, year level, and semester.';
            }
            corPrintPreview.innerHTML = '<div class="curriculum-setup-empty">No matching active students found for this offered setup.</div>';
            updateOfferButtonState();
            return;
        }

        if (corBatchStudentCount) {
            corBatchStudentCount.textContent = `${students.length} matching student(s) found. One A4 page will be generated per student with Student Copy and Registrar Copy.`;
        }

        corPrintPreview.innerHTML = students.map(function (student) {
            return `
                <div class="cor-print-page">
                    ${buildCorCopy(student, 'Student Copy')}
                    <div class="cor-copy-divider"></div>
                    ${buildCorCopy(student, 'Registrar Copy')}
                </div>
            `;
        }).join('');

        previewReady = true;
        updateOfferButtonState();
    }

    async function refreshBatchPrintPreview() {
        previewReady = false;
        updateBatchPrintSummary();
        updateOfferButtonState();

        if (currentCourse === 'all' || currentYearLevel === 'all' || currentSemester === 'all') {
            if (corMatchingStudentsInfo) {
                corMatchingStudentsInfo.innerHTML = '<div class="curriculum-setup-empty">Choose a specific course, year level, and semester first.</div>';
            }
            if (corPrintPreview) {
                corPrintPreview.innerHTML = '<div class="curriculum-setup-empty">Please choose a specific course, year level, and semester first.</div>';
            }
            return;
        }

        if (!getOfferedSubjectsForPrint().length) {
            if (corMatchingStudentsInfo) {
                corMatchingStudentsInfo.innerHTML = '<div class="curriculum-setup-empty">No matching student information available because no offered subjects were found.</div>';
            }
            if (corPrintPreview) {
                corPrintPreview.innerHTML = '<div class="curriculum-setup-empty">No offered subjects are available for the selected setup.</div>';
            }
            return;
        }

        renderScheduleTable();

        if (corMatchingStudentsInfo) {
            corMatchingStudentsInfo.innerHTML = '<div class="curriculum-setup-empty">Loading student information...</div>';
        }
        if (corPrintPreview) {
            corPrintPreview.innerHTML = '<div class="curriculum-setup-empty">Loading matching students and preview layout...</div>';
        }

        try {
            // Only load students for admin/staff roles
            if (normalizedUserRole !== 'student') {
                await loadMatchingStudents();
            }
            renderBatchCorPreview();
        } catch (error) {
            console.error(error);
            previewReady = false;
            updateOfferButtonState();
            if (corBatchStudentCount) {
                corBatchStudentCount.textContent = 'Unable to load matching students right now.';
            }
            if (corMatchingStudentsInfo) {
                corMatchingStudentsInfo.innerHTML = '<div class="curriculum-setup-empty" style="color:#b91c1c;">Unable to load student information right now.</div>';
            }
            if (corPrintPreview) {
                corPrintPreview.innerHTML = '<div class="curriculum-setup-empty" style="color:#b91c1c;">Unable to load matching students right now.</div>';
            }
        }
    }

    function openBatchPrintModal() {
        if (!canBatchPrint) return;

        if (currentCourse === 'all' || currentYearLevel === 'all' || currentSemester === 'all') {
            alert('Please choose the course, year level, and semester first.');
            return;
        }

        if (!getOfferedSubjectsForPrint().length) {
            alert('No offered subjects are available for the selected setup.');
            return;
        }

        if (corAcademicYearInput && !String(corAcademicYearInput.value || '').trim()) {
            corAcademicYearInput.value = getDisplayYearLabel();
        }

        if (batchPrintModal) batchPrintModal.classList.add('active');
        if (batchPrintOverlay) batchPrintOverlay.classList.add('active');

        refreshBatchPrintPreview();
    }

    function closeBatchPrintModal() {
        if (batchPrintModal) batchPrintModal.classList.remove('active');
        if (batchPrintOverlay) batchPrintOverlay.classList.remove('active');
    }

    function getCorPrintStyles() {
        return `
            @page { size: A4 portrait; margin: 6mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
            .cor-print-page { width: 100%; min-height: 285mm; page-break-after: always; break-after: page; display: flex; flex-direction: column; gap: 3mm; }
            .cor-print-page:last-child { page-break-after: auto; break-after: auto; }
            .cor-copy { border: 1px solid #111827; padding: 3mm; display: flex; flex-direction: column; min-height: 136mm; break-inside: avoid; page-break-inside: avoid; }
            .cor-copy-header-row, .cor-school-header { text-align: center; }
            .cor-copy-header-row { display: flex; justify-content: space-between; align-items: center; font-size: 10px; margin-bottom: 2mm; }
            .cor-copy-title { font-weight: 600; }
            .cor-copy-label { font-size: 9px; }
            .cor-school-name { font-weight: 700; font-size: 14px; }
            .cor-school-header { font-size: 10px; line-height: 1.2; margin-bottom: 2mm; }
            .cor-field-row { display: grid; grid-template-columns: 17mm 1fr; gap: 2mm; align-items: center; margin-bottom: 1.2mm; }
            .cor-field-label { font-weight: 700; font-size: 9px; }
            .cor-name-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2mm; }
            .cor-line-cell { min-height: 6.5mm; display: flex; flex-direction: column; gap: 0.5mm; }
            .cor-line-value { font-size: 9px; min-height: 4mm; line-height: 1.1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 0.8mm 0.2mm; border-bottom: 1px solid #111827; }
            .cor-line-caption { font-size: 7px; text-align: center; color: #4b5563; }
            .cor-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1mm 4mm; margin-bottom: 2mm; }
            .cor-meta-item { display: flex; align-items: center; gap: 1.5mm; }
            .cor-inline-value { border-bottom: 1px solid #111827; flex: 1; min-height: 5mm; font-size: 9px; line-height: 1.1; display: inline-flex; align-items: center; justify-content: center; text-align: center; padding: 0 0.8mm 0.2mm; }
            .cor-copy-table, .cor-fee-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .cor-copy-table th, .cor-copy-table td, .cor-fee-table th, .cor-fee-table td { border: 1px solid #111827; padding: 0.8mm 1mm; font-size: 7.5px; line-height: 1.1; vertical-align: top; }
            .cor-copy-table th { text-align: center; font-weight: 700; }
            .cor-copy-table td:nth-child(1) { width: 14%; }
            .cor-copy-table td:nth-child(2) { width: 33%; }
            .cor-copy-table td:nth-child(3) { width: 9%; text-align: center; }
            .cor-copy-table td:nth-child(4) { width: 12%; }
            .cor-copy-table td:nth-child(5) { width: 16%; }
            .cor-copy-table td:nth-child(6) { width: 16%; }
            .cor-copy-table tfoot td { font-weight: 700; }
            .cor-total-label { text-align: right; }
            .cor-copy-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 4mm; padding-top: 2mm; }
            .cor-signatures { display: flex; gap: 4mm; flex: 1; }
            .cor-signature-block { flex: 1; text-align: center; font-size: 8px; }
            .cor-signature-line { display: block; border-top: 1px solid #111827; margin-bottom: 0.3mm; height: 3mm; }
            .cor-signature-label { font-weight: 700; }
            .cor-fee-table { width: 34mm; }
            .cor-fee-table th { background: #f3f4f6; }
            .cor-copy-divider { border-top: 1px dashed #9ca3af; margin: 0.5mm 0; }
        `;
    }

    function printBatchCor() {
        if (!previewReady || !corPrintPreview || !corPrintPreview.innerHTML.trim()) {
            alert('Please generate and review the preview first.');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=1100,height=900');
        if (!printWindow) {
            alert('Please allow pop-ups to print the COR batch.');
            return;
        }

        const title = `COR - ${currentCourse} - ${currentYearLevel}${getYearSuffix(Number(currentYearLevel))} Year - ${formatSemesterLabel(currentSemester)}`;
        printWindow.document.open();
        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${getCorPrintStyles()}</style></head><body>${corPrintPreview.innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = function () {
            printWindow.print();
        };
    }

    async function fetchSubjects(course, yearLevel, semester) {
        const params = new URLSearchParams();
        if (course && course !== 'all') params.append('course', course);
        if (yearLevel && yearLevel !== 'all') params.append('year_level', yearLevel);
        if (semester && semester !== 'all') params.append('semester', semester);
        if (normalizedUserRole === 'student' && isOfferedPage) {
            params.append('enrolled_only', '1');
        } else if (normalizedUserRole === 'student' || isOfferedPage) {
            params.append('offered_only', '1');
        }

        const query = params.toString();
        const response = await fetch(`${API_BASE}/curriculum_list.php${query ? `?${query}` : ''}`);
        if (!response.ok) {
            throw new Error(`Failed to load subjects: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.error || 'Failed to load subjects');
        }

        return Array.isArray(data.curriculum) ? data.curriculum : [];
    }

    async function loadAssignedCurriculumForStudent() {
        if (normalizedUserRole !== 'student') return;

        try {
            const response = await fetch(`${API_BASE}/profile_data.php`, { credentials: 'same-origin' });
            const data = await response.json().catch(function () { return {}; });
            if (response.ok && data.ok && data.profile) {
                assignedCurriculumSubjects = Array.isArray(data.profile.assigned_curriculum)
                    ? data.profile.assigned_curriculum
                    : [];
                renderSetupGrid(subjectsCache, currentSemester);
            }
        } catch (error) {
            console.error('Unable to load assigned curriculum for student:', error);
        }
    }

    function renderAssignedCurriculumCard() {
        if (normalizedUserRole !== 'student' || !Array.isArray(assignedCurriculumSubjects) || !assignedCurriculumSubjects.length) {
            return '';
        }

        return `
            <div class="curriculum-setup-card">
                <div class="curriculum-setup-card-header">
                    <h4>Required Additional Subjects</h4>
                    <span class="curriculum-setup-count">${assignedCurriculumSubjects.length} selected</span>
                </div>
                <div class="curriculum-semester-blocks">
                    <div class="curriculum-semester-block">
                        <div class="curriculum-semester-heading">
                            <h5>Assigned by Admin</h5>
                        </div>
                        <table class="semester-table">
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Subject Description</th>
                                    <th>Units</th>
                                    <th>Year/Sem</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${assignedCurriculumSubjects.map(function (subject) {
                                    const isCompleted = Number(subject.is_completed || 0) === 1;
                                    return `
                                        <tr>
                                            <td>${escapeHtml(subject.subject_code || '')}</td>
                                            <td>${escapeHtml(subject.subject_name || '')}</td>
                                            <td>${escapeHtml(String(subject.units || '0'))}</td>
                                            <td>Y${escapeHtml(String(subject.year_level || '—'))} / ${escapeHtml(formatSemesterLabel(subject.semester || ''))}</td>
                                            <td><span class="offer-status-badge ${isCompleted ? 'enrolled' : 'offered'}">${isCompleted ? 'Completed' : 'Pending'}</span></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    function renderTable(subjects) {
        if (!tableBody) return;

        if (!Array.isArray(subjects) || subjects.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${getTableColspan()}" style="text-align: center; padding: 40px; color: #9ca3af;">${isOfferedPage ? 'No offered subjects found for the selected filters.' : 'No subjects found for the selected filters.'}</td></tr>`;
            updateOfferButtonState();
            return;
        }

        tableBody.innerHTML = subjects.map(function (subject) {
            const isSelected = selectedSubjectIds.has(String(subject.id));
            const isEnrolled = isSubjectEnrolled(subject);
            const isBusy = enrollingSubjectIds.has(String(subject.offering_id || subject.id));
            return `
                <tr data-id="${subject.id}" class="${isSelected ? 'selected' : ''}">
                    ${canSelectSubjects ? `<td class="subject-select-cell"><input type="checkbox" class="subject-select-checkbox" data-id="${subject.id}" ${isSelected ? 'checked' : ''} aria-label="Select ${escapeHtml(subject.subject_code || 'subject')}"></td>` : ''}
                    <td>${escapeHtml(subject.course_code || 'Unknown')}</td>
                    <td>${escapeHtml(subject.subject_code || '')}</td>
                    <td>${escapeHtml(subject.subject_name || subject.description || '')}</td>
                    <td><span class="year-level-badge year-${escapeHtml(String(subject.year_level || '1'))}">${escapeHtml(String(subject.year_level || '1'))}${getYearSuffix(subject.year_level)} Year</span></td>
                    <td>${escapeHtml(formatSemesterLabel(subject.semester))}</td>
                    <td>${escapeHtml(String(subject.units || '0'))}</td>
                    <td>${escapeHtml(subject.prerequisites || 'None')}</td>
                </tr>
            `;
        }).join('');

        updateOfferButtonState();
    }

    function renderSetupGrid(subjects, semesterView) {
        if (!subjectsSetupGrid) return;

        const assignedCardHtml = renderAssignedCurriculumCard();

        if (!Array.isArray(subjects) || subjects.length === 0) {
            subjectsSetupGrid.innerHTML = assignedCardHtml || `<div class="curriculum-setup-empty">${normalizedUserRole === 'student' && isOfferedPage ? 'No enrolled subjects yet.' : (canSelfEnroll ? 'No offered subjects are available for the selected setup.' : (isOfferedPage ? 'No offered subjects found for the selected filters.' : 'No subjects found for the selected filters.'))}</div>`;
            updateOfferButtonState();
            return;
        }

        const normalizedSemesterView = String(semesterView || 'all');
        const grouped = {};

        subjects.forEach(function (subject) {
            const courseCode = String(subject.course_code || 'Unknown');
            const yearLevel = String(subject.year_level || '1');
            const key = courseCode + '||' + yearLevel;

            if (!grouped[key]) {
                grouped[key] = {
                    courseCode: courseCode,
                    yearLevel: yearLevel,
                    firstSemester: [],
                    secondSemester: []
                };
            }

            if (Number(subject.semester) === 2) {
                grouped[key].secondSemester.push(subject);
            } else {
                grouped[key].firstSemester.push(subject);
            }
        });

        const sortedGroups = Object.values(grouped).sort(function (a, b) {
            if (a.courseCode === b.courseCode) {
                return Number(a.yearLevel) - Number(b.yearLevel);
            }
            return a.courseCode.localeCompare(b.courseCode);
        });

        subjectsSetupGrid.innerHTML = assignedCardHtml + sortedGroups.map(function (group) {
            function renderSubjectTable(items, emptyText) {
                if (!items.length) {
                    return `<div class="curriculum-semester-empty">${emptyText}</div>`;
                }

                return `
                    <table class="semester-table">
                        <thead>
                            <tr>
                                ${canSelectSubjects ? '<th class="subject-select-col"></th>' : ''}
                                <th>Subject Code</th>
                                <th>Subject Description</th>
                                <th>Units</th>
                                <th>Prerequisites</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(function (subject) {
                                const isSelected = selectedSubjectIds.has(String(subject.id));
                                return `
                                    <tr data-id="${subject.id}" class="${isSelected ? 'selected' : ''}">
                                        ${canSelectSubjects ? `<td class="subject-select-cell"><input type="checkbox" class="subject-select-checkbox" data-id="${subject.id}" ${isSelected ? 'checked' : ''} aria-label="Select ${escapeHtml(subject.subject_code || 'subject')}"></td>` : ''}
                                        <td>${escapeHtml(subject.subject_code || '')}</td>
                                        <td>${escapeHtml(subject.subject_name || subject.description || '')}</td>
                                        <td>${escapeHtml(String(subject.units || '0'))}</td>
                                        <td>${escapeHtml(subject.prerequisites || 'None')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            }

            const showFirstSemester = normalizedSemesterView === 'all' || normalizedSemesterView === '1';
            const showSecondSemester = normalizedSemesterView === 'all' || normalizedSemesterView === '2';
            const visibleCount = (showFirstSemester ? group.firstSemester.length : 0) + (showSecondSemester ? group.secondSemester.length : 0);

            const renderSemesterBlock = function (label, items, semesterValue, emptyText) {
                const setupKey = `${group.courseCode}||${group.yearLevel}||${semesterValue}`;
                const isBusy = items.some(function (subject) {
                    return enrollingSubjectIds.has(String(subject.offering_id || subject.id));
                });
                const hasAvailableSubjects = items.some(function (subject) {
                    return subject && !isSubjectEnrolled(subject) && isSubjectOffered(subject);
                });
                const canShowEnrollButton = canSelfEnroll && items.length > 0;

                return `<div class="curriculum-semester-block" data-setup-key="${escapeHtml(setupKey)}">
                    <div class="curriculum-semester-heading" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                        <h5>${label}</h5>
                        ${canShowEnrollButton ? `<button type="button" class="btn-subject-enroll btn-enroll-setup" data-setup-key="${escapeHtml(setupKey)}" ${isBusy || !hasAvailableSubjects ? 'disabled' : ''}>${isBusy ? 'Enrolling...' : (hasAvailableSubjects ? 'Enroll' : 'Enrolled')}</button>` : ''}
                    </div>
                    ${renderSubjectTable(items, emptyText)}
                </div>`;
            };

            return `
                <div class="curriculum-setup-card">
                    <div class="curriculum-setup-card-header">
                        <h4>${escapeHtml(group.courseCode)} - ${escapeHtml(group.yearLevel)}${getYearSuffix(group.yearLevel)} Year</h4>
                        <span class="curriculum-setup-year">${escapeHtml(getDisplayYearLabel())}</span>
                        <span class="curriculum-setup-count">${visibleCount} subjects</span>
                    </div>
                    <div class="curriculum-semester-blocks">
                        ${showFirstSemester ? renderSemesterBlock('1st Semester', group.firstSemester, 1, 'No 1st semester subjects') : ''}
                        ${showSecondSemester ? renderSemesterBlock('2nd Semester', group.secondSemester, 2, 'No 2nd semester subjects') : ''}
                    </div>
                </div>
            `;
        }).join('');

        updateOfferButtonState();
    }

    function toggleSelection(id) {
        const normalizedId = String(id || '');
        if (!normalizedId) return;

        if (selectedSubjectIds.has(normalizedId)) {
            selectedSubjectIds.delete(normalizedId);
        } else {
            selectedSubjectIds.add(normalizedId);
        }

        renderTable(subjectsCache);
        renderSetupGrid(subjectsCache, currentSemester);
    }

    async function saveSelectedOfferSetup() {
        const selectedSubjects = getSelectedSubjects();
        if (!selectedSubjects.length) {
            alert('Please select at least one subject first.');
            return;
        }

        const courseCode = offerModalCourse ? String(offerModalCourse.value || '').trim() : '';
        const yearLevel = offerModalYearLevel ? String(offerModalYearLevel.value || '').trim() : '';
        const semester = offerModalSemester ? String(offerModalSemester.value || '').trim() : '';

        if (!courseCode || !yearLevel || !semester) {
            updateOfferModalSummary(selectedSubjects.length);
            alert('Please choose the course, year level, and semester before saving.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/subject_offerings_save.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    curriculum_ids: selectedSubjects.map(function (subject) {
                        return Number(subject.id);
                    }),
                    course_code: courseCode,
                    year_level: Number(yearLevel),
                    semester: Number(semester)
                })
            });

            const result = await response.json().catch(function () { return {}; });
            if (!response.ok || !result.ok) {
                alert((result && result.error) || 'Failed to save the offered subject setup.');
                return;
            }

            currentCourse = courseCode;
            currentYearLevel = yearLevel;
            currentSemester = semester;

            if (courseFilter) courseFilter.value = currentCourse;
            if (yearLevelFilter) yearLevelFilter.value = currentYearLevel;
            if (semesterFilter) semesterFilter.value = currentSemester;

            selectedSubjectIds.clear();
            closeOfferModal();
            alert(`Successfully offered ${selectedSubjects.length} subject${selectedSubjects.length === 1 ? '' : 's'} for the selected setup.`);
            loadSubjects();
        } catch (error) {
            alert('Network error while saving the offered subject setup.');
        }
    }

    async function loadSubjects() {
        previewReady = false;
        updateOfferButtonState();

        try {
            const subjects = await fetchSubjects(currentCourse, currentYearLevel, currentSemester);
            
            // Debug logging for students
            if (normalizedUserRole === 'student') {
                console.log('Student filters:', { currentCourse, currentYearLevel, currentSemester });
                console.log('Student data:', { studentYearLevel, studentSemester });
                console.log('Subjects returned:', subjects.length, subjects);
            }
            
            subjectsCache = subjects;
            const availableIds = new Set(subjects.map(function (subject) { return String(subject.id); }));
            selectedSubjectIds = new Set(Array.from(selectedSubjectIds).filter(function (id) {
                return availableIds.has(id);
            }));
            renderTable(subjectsCache);
            renderSetupGrid(subjectsCache, currentSemester);
            updateBatchPrintSummary();
            if (batchPrintModal && batchPrintModal.classList.contains('active')) {
                renderScheduleTable();
                renderBatchCorPreview();
            }
        } catch (error) {
            console.error(error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="${getTableColspan()}" style="text-align: center; padding: 40px; color: #f87171;">Unable to load subjects right now.</td></tr>`;
            }
            if (subjectsSetupGrid) {
                subjectsSetupGrid.innerHTML = '<div class="curriculum-setup-empty" style="color: #f87171;">Unable to load subjects right now.</div>';
            }
            updateOfferButtonState();
        }
    }

    if (tableBody) {
        tableBody.addEventListener('change', function (event) {
            if (!canSelectSubjects) return;
            const checkbox = event.target.closest('.subject-select-checkbox');
            if (!checkbox) return;
            toggleSelection(checkbox.getAttribute('data-id'));
        });

        tableBody.addEventListener('click', function (event) {
            const enrollBtn = event.target.closest('.btn-subject-enroll');
            if (enrollBtn) {
                event.preventDefault();
                event.stopPropagation();
                enrollSubject(enrollBtn.getAttribute('data-enroll-id'));
                return;
            }

            if (!canSelectSubjects || event.target.closest('.subject-select-checkbox')) return;
            const row = event.target.closest('tr[data-id]');
            if (!row) return;
            toggleSelection(row.getAttribute('data-id'));
        });
    }

    if (subjectsSetupGrid) {
        subjectsSetupGrid.addEventListener('change', function (event) {
            if (!canSelectSubjects) return;
            const checkbox = event.target.closest('.subject-select-checkbox');
            if (!checkbox) return;
            toggleSelection(checkbox.getAttribute('data-id'));
        });

        subjectsSetupGrid.addEventListener('click', function (event) {
            const enrollSetupBtn = event.target.closest('.btn-enroll-setup');
            if (enrollSetupBtn) {
                event.preventDefault();
                event.stopPropagation();
                const setupKey = String(enrollSetupBtn.getAttribute('data-setup-key') || '');
                const parts = setupKey.split('||');
                const setupSubjects = subjectsCache.filter(function (subject) {
                    return String(subject.course_code || '') === (parts[0] || '')
                        && String(subject.year_level || '') === (parts[1] || '')
                        && String(subject.semester || '') === (parts[2] || '');
                });
                enrollSetupSubjects(setupSubjects);
                return;
            }

            const enrollBtn = event.target.closest('.btn-subject-enroll');
            if (enrollBtn) {
                event.preventDefault();
                event.stopPropagation();
                enrollSubject(enrollBtn.getAttribute('data-enroll-id'));
                return;
            }

            if (!canSelectSubjects || event.target.closest('.subject-select-checkbox')) return;
            const row = event.target.closest('.semester-table tr[data-id]');
            if (!row) return;
            toggleSelection(row.getAttribute('data-id'));
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            if (this.checked) {
                selectedSubjectIds = new Set(subjectsCache.map(function (subject) { return String(subject.id); }));
            } else {
                selectedSubjectIds.clear();
            }
            renderTable(subjectsCache);
            renderSetupGrid(subjectsCache, currentSemester);
        });
    }

    if (btnOffer) {
        btnOffer.addEventListener('click', openOfferModal);
    }

    if (offerModalClose) {
        offerModalClose.addEventListener('click', closeOfferModal);
    }

    if (offerModalCancel) {
        offerModalCancel.addEventListener('click', closeOfferModal);
    }

    if (offerModalOverlay) {
        offerModalOverlay.addEventListener('click', closeOfferModal);
    }

    if (offerModalSave) {
        offerModalSave.addEventListener('click', saveSelectedOfferSetup);
    }

    if (offerModalCourse) {
        offerModalCourse.addEventListener('change', function () {
            updateOfferModalSummary(getSelectedSubjects().length);
        });
    }

    if (offerModalYearLevel) {
        offerModalYearLevel.addEventListener('change', function () {
            updateOfferModalSummary(getSelectedSubjects().length);
        });
    }

    if (offerModalSemester) {
        offerModalSemester.addEventListener('change', function () {
            updateOfferModalSummary(getSelectedSubjects().length);
        });
    }

    if (batchPreviewBtn) {
        batchPreviewBtn.addEventListener('click', openBatchPrintModal);
    }

    if (batchPrintBtn) {
        batchPrintBtn.addEventListener('click', function () {
            if (!previewReady) {
                openBatchPrintModal();
                return;
            }

            printBatchCor();
        });
    }

    if (batchPrintClose) {
        batchPrintClose.addEventListener('click', closeBatchPrintModal);
    }

    if (batchPrintCancel) {
        batchPrintCancel.addEventListener('click', closeBatchPrintModal);
    }

    if (batchPrintOverlay) {
        batchPrintOverlay.addEventListener('click', closeBatchPrintModal);
    }

    if (batchPrintRefresh) {
        batchPrintRefresh.addEventListener('click', refreshBatchPrintPreview);
    }

    if (batchPrintPrint) {
        batchPrintPrint.addEventListener('click', printBatchCor);
    }

    if (corScheduleTableBody) {
        corScheduleTableBody.addEventListener('input', function (event) {
            const input = event.target.closest('.cor-schedule-input');
            if (!input) return;

            const scheduleId = String(input.getAttribute('data-schedule-id') || '');
            const field = String(input.getAttribute('data-field') || '');
            const entry = scheduleEntries.find(function (item) {
                return item.id === scheduleId;
            });

            if (!entry || !field) return;
            entry[field] = input.value;
            renderBatchCorPreview();
        });
    }

    [corAcademicYearInput, corTuitionFeeInput, corMiscFeeInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('input', renderBatchCorPreview);
    });

    if (courseFilter) {
        courseFilter.addEventListener('change', function () {
            currentCourse = this.value;
            loadSubjects();
        });
    }

    if (yearLevelFilter) {
        yearLevelFilter.addEventListener('change', function () {
            currentYearLevel = this.value;
            if (normalizedUserRole === 'student') {
                restrictStudentFilterOptions();
            }
            loadSubjects();
        });
    }

    if (semesterFilter) {
        semesterFilter.addEventListener('change', function () {
            currentSemester = this.value;
            loadSubjects();
        });
    }

    if (normalizedUserRole === 'student') {
        if (courseFilter) {
            courseFilter.value = studentCourseCode || 'all';
            courseFilter.disabled = true;
        }
        if (yearLevelFilter) {
            yearLevelFilter.value = studentYearLevel || 'all';
            yearLevelFilter.disabled = false;
        }
        if (semesterFilter) {
            // Default to 'all' so students can see current + next semester
            semesterFilter.value = 'all';
            semesterFilter.disabled = false;
        }
        currentCourse = studentCourseCode || 'all';
        currentYearLevel = studentYearLevel || 'all';
        currentSemester = 'all';  // Changed from studentSemester to 'all'
        
        // Restrict available filter options for students
        restrictStudentFilterOptions();
        
        // Refresh session to get latest year_level and current_semester
        fetch('api/refresh_session.php', { credentials: 'same-origin' })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.ok && data.refreshed && data.user && window.AppUser) {
                    window.AppUser.year_level = data.user.year_level;
                    window.AppUser.current_semester = data.user.current_semester;
                    window.AppUser.course_code = data.user.course_code;
                    window.AppUser.progression_status = data.user.progression_status || 'enrolled';
                    console.log('Session refreshed - Y' + data.user.year_level + 'S' + data.user.current_semester, 'Status:', data.user.progression_status);
                    
                    // Update banner based on new progression status
                    if (pageNote) {
                        const currentSemesterLabel = data.user.current_semester === 1 ? '1st Semester' : data.user.current_semester === 2 ? '2nd Semester' : 'Unknown';
                        const enrollmentPeriodActive = data.user.progression_status === 'pending_progression';
                        
                        if (enrollmentPeriodActive) {
                            pageNote.textContent = data.user.course_code
                                ? `🎓 ENROLLMENT PERIOD ACTIVE: Enroll in next semester subjects for ${data.user.course_code} (Current: Year ${data.user.year_level}, ${currentSemesterLabel}).`
                                : `🎓 ENROLLMENT PERIOD ACTIVE: Enroll in next semester subjects (Current: Year ${data.user.year_level}, ${currentSemesterLabel}).`;
                            pageNote.style.backgroundColor = '#065f46';
                            pageNote.style.color = '#d1fae5';
                            pageNote.style.fontWeight = 'bold';
                        } else {
                            pageNote.textContent = data.user.course_code
                                ? `Showing current subjects for ${data.user.course_code} (Year ${data.user.year_level}, ${currentSemesterLabel}). Next semester subjects will appear when enrollment period opens.`
                                : `Showing current subjects (Year ${data.user.year_level}, ${currentSemesterLabel}). Next semester subjects will appear when enrollment period opens.`;
                            pageNote.style.backgroundColor = '';
                            pageNote.style.color = '';
                            pageNote.style.fontWeight = '';
                        }
                    }
                    
                    // Reload subjects with updated data
                    loadSubjects();
                }
            })
            .catch(function(error) {
                console.warn('Session refresh failed:', error);
                loadSubjects(); // Load anyway
            });
    } else {
        loadSubjects();
    }

    updateOfferButtonState();
    loadAssignedCurriculumForStudent();
});
