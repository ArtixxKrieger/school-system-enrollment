document.addEventListener('DOMContentLoaded', function() {
    const curriculumTableBody = document.getElementById('curriculumTableBody');
    const curriculumSetupGrid = document.getElementById('curriculumSetupGrid');
    const courseFilter = document.getElementById('courseFilter');
    const yearLevelFilter = document.getElementById('yearLevelFilter');
    const semesterFilter = document.getElementById('semesterFilter');

    // ===== MODAL FUNCTIONALITY =====
    const modal = document.getElementById('addSubjectModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const btnAdd = document.getElementById('btnAdd');
    const btnImport = document.getElementById('btnImport');
    const btnEdit = document.getElementById('btnEdit');
    const btnOffer = document.getElementById('btnOffer');
    const btnDelete = document.getElementById('btnDelete');
    const curriculumImportPanel = document.getElementById('curriculumImportPanel');
    const curriculumImportForm = document.getElementById('curriculumImportForm');
    const importCourseFilter = document.getElementById('importCourseFilter');
    const importYearLevelFilter = document.getElementById('importYearLevelFilter');
    const importSemesterFilter = document.getElementById('importSemesterFilter');
    const importCurriculumFile = document.getElementById('importCurriculumFile');
    const btnCancelImport = document.getElementById('btnCancelImport');
    const btnSubmitImport = document.getElementById('btnSubmitImport');
    const btnModalCancel = document.getElementById('btnModalCancel');
    const btnModalSave = document.getElementById('btnModalSave');
    const modalTitle = modal ? modal.querySelector('.modal-title') : null;
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const btnAddRow = document.getElementById('btnAddRow');
    const formRowsContainer = document.getElementById('formRowsContainer');
    const modalSetupSummary = document.getElementById('modalSetupSummary');
    const modalCourseFilter = document.getElementById('modalCourseFilter');
    const modalYearLevelFilter = document.getElementById('modalYearLevelFilter');
    const modalSemesterFilter = document.getElementById('modalSemesterFilter');
    const pageNote = document.getElementById('curriculumPageNote');
    const API_BASE = String(window.ApiBaseUrl || 'api').replace(/\/$/, '');

    const isEditor = window.UserCan && window.UserCan.edit('curriculum');
    const canCreateCurriculum = window.UserCan && window.UserCan.create('curriculum');
    const canDeleteCurriculum = window.UserCan && window.UserCan.del('curriculum');
    const studentCourseCode = window.AppUser ? String(window.AppUser.course_code || window.AppUser.courseCode || window.AppUser.course || '').trim() : '';
    const studentYearLevel = window.AppUser ? String(window.AppUser.year_level || window.AppUser.yearLevel || window.AppUser.year || '').trim() : '';
    const studentSemester = window.AppUser ? String(window.AppUser.current_semester || window.AppUser.currentSemester || '').trim() : '';
    const normalizedUserRole = String((window.AppUser && (window.AppUser.role || window.AppUser.userRole)) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const activeUserSemester = studentSemester === '1' || studentSemester === '2'
        ? studentSemester
        : String((new Date().getMonth() + 1) >= 8 ? 1 : 2);

    if (!canCreateCurriculum) {
        if (btnAdd) btnAdd.style.display = 'none';
        if (btnImport) btnImport.style.display = 'none';
        if (btnAddRow) btnAddRow.style.display = 'none';
        if (curriculumImportPanel) curriculumImportPanel.hidden = true;
    }
    if (!isEditor) {
        if (btnEdit) btnEdit.style.display = 'none';
        if (btnOffer) btnOffer.style.display = 'none';
        if (btnModalSave) btnModalSave.style.display = 'none';
    }
    if (!canDeleteCurriculum) {
        if (btnDelete) btnDelete.style.display = 'none';
    }

    if (pageNote) {
        if (normalizedUserRole === 'student') {
            const yearText = studentYearLevel
                ? `${studentYearLevel}${getYearSuffix(Number(studentYearLevel))} Year`
                : 'your year level';
            const semesterText = activeUserSemester === '1'
                ? '1st Semester'
                : activeUserSemester === '2'
                    ? '2nd Semester'
                    : 'All Semesters';

            pageNote.textContent = studentCourseCode
                ? `Showing your enrolled subjects for ${studentCourseCode} • ${yearText} • ${semesterText}.`
                : 'Showing only your enrolled subjects.';
        } else if (isEditor) {
            pageNote.textContent = 'Set up subjects by course, year level, and semester. Click a subject row to select it for editing or deletion.';
        }
    }

    let rowCount = 0;
    let selectedSubject = null;
    let selectedSubjectIds = new Set();
    let curriculumCache = [];
    let professorOptions = [];
    let modalMode = 'add';
    let modalSubjects = [];

    function getSelectedSubjects() {
        return curriculumCache.filter(subject => selectedSubjectIds.has(String(subject.id)));
    }

    function updateSelectionState() {
        const selectedSubjects = getSelectedSubjects();
        selectedSubject = selectedSubjects.length > 0 ? selectedSubjects[0] : null;

        if (btnEdit) {
            btnEdit.disabled = !isEditor || selectedSubjects.length === 0;
        }

        if (btnDelete) {
            btnDelete.disabled = !canDeleteCurriculum || selectedSubjects.length === 0;
        }


    }

    function getModalSetupValues() {
        return {
            course: modalCourseFilter ? String(modalCourseFilter.value || '').trim() : '',
            yearLevel: modalYearLevelFilter ? String(modalYearLevelFilter.value || '').trim() : '',
            semester: modalSemesterFilter ? String(modalSemesterFilter.value || '').trim() : ''
        };
    }

    function setModalSetupValues(values = {}) {
        if (modalCourseFilter) {
            modalCourseFilter.value = values.course && values.course !== 'all' ? String(values.course) : '';
        }
        if (modalYearLevelFilter) {
            modalYearLevelFilter.value = values.yearLevel && values.yearLevel !== 'all' ? String(values.yearLevel) : '';
        }
        if (modalSemesterFilter) {
            modalSemesterFilter.value = values.semester && values.semester !== 'all' ? String(values.semester) : '';
        }
        updateModalSetupSummary();
    }

    function syncMainFilters(course, yearLevel, semester) {
        currentCourse = course || 'all';
        currentYearLevel = yearLevel || 'all';
        currentSemester = semester || 'all';

        if (courseFilter && !courseFilter.disabled) courseFilter.value = currentCourse;
        if (yearLevelFilter && !yearLevelFilter.disabled) yearLevelFilter.value = currentYearLevel;
        if (semesterFilter && !semesterFilter.disabled) semesterFilter.value = currentSemester;
    }

    function updateModalSetupSummary() {
        if (!modalSetupSummary) return;

        const modalSetup = getModalSetupValues();
        const courseText = modalSetup.course || 'Not selected';
        const yearText = modalSetup.yearLevel ? `${modalSetup.yearLevel}${getYearSuffix(Number(modalSetup.yearLevel))} Year` : 'Not selected';
        const semesterText = modalSetup.semester === '1' ? '1st Semester' : modalSetup.semester === '2' ? '2nd Semester' : 'Not selected';

        modalSetupSummary.textContent = `Setup: Course ${courseText} • Year Level ${yearText} • Semester ${semesterText}`;
        modalSetupSummary.classList.toggle('incomplete', !modalSetup.course || !modalSetup.yearLevel || !modalSetup.semester);
    }

    function openImportPanel() {
        if (!canCreateCurriculum || !curriculumImportPanel) return;

        if (importCourseFilter) {
            importCourseFilter.value = currentCourse && currentCourse !== 'all' ? String(currentCourse) : '';
        }
        if (importYearLevelFilter) {
            importYearLevelFilter.value = currentYearLevel && currentYearLevel !== 'all' ? String(currentYearLevel) : '';
        }
        if (importSemesterFilter) {
            importSemesterFilter.value = currentSemester && currentSemester !== 'all' ? String(currentSemester) : '';
        }

        curriculumImportPanel.hidden = false;
        curriculumImportPanel.classList.add('active');
        curriculumImportPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function closeImportPanel() {
        if (!curriculumImportPanel) return;
        curriculumImportPanel.hidden = true;
        curriculumImportPanel.classList.remove('active');
        if (curriculumImportForm) {
            curriculumImportForm.reset();
        }
    }

    async function submitImportCurriculum(event) {
        event.preventDefault();

        if (!curriculumImportForm || !canCreateCurriculum) {
            return;
        }

        if (!importCourseFilter || !importCourseFilter.value || !importYearLevelFilter || !importYearLevelFilter.value || !importSemesterFilter || !importSemesterFilter.value) {
            alert('Please choose the course, year level, and semester before importing.');
            return;
        }

        if (!importCurriculumFile || !importCurriculumFile.files || !importCurriculumFile.files.length) {
            alert('Please choose a curriculum file to import.');
            return;
        }

        const formData = new FormData(curriculumImportForm);
        const originalLabel = btnSubmitImport ? btnSubmitImport.textContent : 'Import Curriculum';

        if (btnSubmitImport) {
            btnSubmitImport.disabled = true;
            btnSubmitImport.textContent = 'Importing...';
        }

        try {
            const response = await fetch(`${API_BASE}/curriculum_import.php`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.ok) {
                alert(data.error || data.details || 'Curriculum import failed.');
                return;
            }

            syncMainFilters(importCourseFilter.value, importYearLevelFilter.value, importSemesterFilter.value);
            closeImportPanel();

            let message = data.message || 'Curriculum imported successfully.';
            message += `\nCreated: ${data.created || 0}`;
            message += `\nSkipped: ${data.skipped || 0}`;
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                message += `\nIssues: ${data.errors.length}`;
                message += `\n${data.errors.slice(0, 5).join('\n')}`;
            }
            alert(message);
            loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
        } catch (error) {
            alert((error && error.message) || 'Curriculum import failed.');
        } finally {
            if (btnSubmitImport) {
                btnSubmitImport.disabled = false;
                btnSubmitImport.textContent = originalLabel;
            }
        }
    }

    function openModal(mode = 'add', subject = null) {
        if (!isEditor) return;
        modalMode = mode;
        modalSubjects = Array.isArray(subject) ? subject.filter(Boolean) : (subject ? [subject] : []);
        modal.classList.add('active');
        modalOverlay.classList.add('active');
        rowCount = 0;
        formRowsContainer.innerHTML = '';

        if (modalTitle) {
            modalTitle.textContent = mode === 'edit'
                ? 'Edit Subject'
                : mode === 'offer'
                    ? 'Offer Subject'
                    : 'Add Subject';
        }
        if (btnModalSave) {
            btnModalSave.textContent = mode === 'edit'
                ? 'Update'
                : mode === 'offer'
                    ? 'Offer Subject'
                    : 'Save';
        }
        if (btnAddRow) {
            btnAddRow.style.display = mode === 'edit' || mode === 'offer' ? 'none' : '';
        }

        if ((mode === 'edit' || mode === 'offer') && modalSubjects.length) {
            const primarySubject = modalSubjects[0];
            setModalSetupValues({
                course: primarySubject.course_code || primarySubject.course || '',
                yearLevel: String(primarySubject.year_level || ''),
                semester: String(primarySubject.semester || '')
            });
            modalSubjects.forEach(currentSubject => {
                addFormRow({
                    code: currentSubject.subject_code || '',
                    subject: currentSubject.subject_name || currentSubject.description || '',
                    units: String(currentSubject.units || ''),
                    professorId: String(currentSubject.professor_id || ''),
                    prerequisites: currentSubject.prerequisites || ''
                });
            });
        } else {
            setModalSetupValues({
                course: currentCourse !== 'all' ? currentCourse : '',
                yearLevel: currentYearLevel !== 'all' ? currentYearLevel : '',
                semester: currentSemester !== 'all' ? currentSemester : ''
            });
            addFormRow();
        }
    }

    function closeModal() {
        modal.classList.remove('active');
        modalOverlay.classList.remove('active');
        modalMode = 'add';
        modalSubjects = [];
        if (btnAddRow) {
            btnAddRow.style.display = '';
        }
        if (btnModalSave) {
            btnModalSave.textContent = 'Save';
        }
    }

    function buildProfessorOptions(selectedProfessorId) {
        const baseLabel = professorOptions.length ? 'Undefined' : 'Undefined (No professor available)';
        const baseOption = `<option value="">${baseLabel}</option>`;
        const items = professorOptions.map(professor => {
            const id = String(professor.id || '');
            const name = String(professor.name || professor.full_name || 'Professor');
            return `<option value="${escapeHtml(id)}" ${String(selectedProfessorId || '') === id ? 'selected' : ''}>${escapeHtml(name)}</option>`;
        }).join('');
        return baseOption + items;
    }

    function createFormRow(values = {}) {
        const rowId = `row-${rowCount++}`;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'form-row';
        rowDiv.id = rowId;
        rowDiv.innerHTML = `
            <div class="form-group small-field">
                <label>Subject Code</label>
                <input type="text" class="field-code" placeholder="e.g. IT101" maxlength="10" value="${escapeHtml(values.code || '')}">
            </div>
            <div class="form-group small-field">
                <label>Units</label>
                <input type="number" class="field-units" placeholder="e.g. 3" min="1" max="999" value="${escapeHtml(values.units || '')}">
            </div>
            <div class="form-group full-row">
                <label>Subject Description</label>
                <input type="text" class="field-subject" placeholder="Subject description" value="${escapeHtml(values.subject || '')}">
            </div>
            <div class="form-group">
                <label>Prerequisites</label>
                <input type="text" class="field-prerequisites" placeholder="Optional" value="${escapeHtml(values.prerequisites || '')}">
            </div>
            <button type="button" class="btn-remove-row">−</button>
        `;

        const removeBtn = rowDiv.querySelector('.btn-remove-row');
        removeBtn.addEventListener('click', function() {
            removeFormRow(rowId);
        });

        return rowDiv;
    }

    function addFormRow(values = {}) {
        const newRow = createFormRow(values);
        formRowsContainer.appendChild(newRow);
    }

    function removeFormRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
        }
        // Ensure at least one row remains
        if (formRowsContainer.querySelectorAll('.form-row').length === 0) {
            addFormRow();
        }
    }

    function collectFormData() {
        const rows = formRowsContainer.querySelectorAll('.form-row');
        const data = [];

        rows.forEach(row => {
            const rowData = {
                code: row.querySelector('.field-code')?.value || '',
                subject: row.querySelector('.field-subject')?.value || '',
                units: row.querySelector('.field-units')?.value || '',
                professorId: row.querySelector('.field-professor-id')?.value || '',
                prerequisites: row.querySelector('.field-prerequisites')?.value || ''
            };
            data.push(rowData);
        });

        return data;
    }

    function requireSelectedSubject() {
        const selectedSubjects = getSelectedSubjects();
        if (selectedSubjects.length !== 1 || !selectedSubject || !selectedSubject.id) {
            alert('Please select exactly one subject first.');
            return false;
        }
        return true;
    }

    // Modal event listeners
    if (btnAdd) {
        btnAdd.addEventListener('click', function() {
            openModal('add');
        });
    }

    if (btnImport) {
        btnImport.addEventListener('click', openImportPanel);
    }

    if (btnCancelImport) {
        btnCancelImport.addEventListener('click', closeImportPanel);
    }

    if (curriculumImportForm) {
        curriculumImportForm.addEventListener('submit', submitImportCurriculum);
    }

    if (btnEdit) {
        btnEdit.addEventListener('click', function() {
            const selectedSubjects = getSelectedSubjects();
            if (!selectedSubjects.length) {
                alert('Please select at least one subject first.');
                return;
            }
            openModal('edit', selectedSubjects);
        });
    }

    if (btnOffer) {
        btnOffer.addEventListener('click', function() {
            if (!requireSelectedSubject()) return;
            if (!professorOptions.length) {
                alert('No active professor is available yet. Please add or activate a professor first.');
                return;
            }
            openModal('offer', selectedSubject);
        });
    }

    if (btnDelete) {
        btnDelete.addEventListener('click', function() {
            const selectedSubjects = getSelectedSubjects();
            if (!selectedSubjects.length) {
                alert('Please select at least one subject first.');
                return;
            }
            if (!confirm(`Delete ${selectedSubjects.length} selected subject${selectedSubjects.length === 1 ? '' : 's'}?`)) return;

            Promise.all(selectedSubjects.map(subject =>
                fetch(`${API_BASE}/curriculum_delete.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: subject.id })
                }).then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, json: j })))
            ))
            .then(results => {
                const failed = results.find(result => !result.ok || !result.json?.ok);
                if (failed) {
                    alert(failed.json?.error || 'Failed to delete curriculum.');
                    return;
                }
                selectedSubject = null;
                selectedSubjectIds.clear();
                alert(`Deleted ${selectedSubjects.length} subject${selectedSubjects.length === 1 ? '' : 's'} successfully.`);
                loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
            })
            .catch(() => alert('Network error while deleting curriculum.'));
        });
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (btnModalCancel) btnModalCancel.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    if (btnAddRow) btnAddRow.addEventListener('click', addFormRow);
    if (modalCourseFilter) modalCourseFilter.addEventListener('change', updateModalSetupSummary);
    if (modalYearLevelFilter) modalYearLevelFilter.addEventListener('change', updateModalSetupSummary);
    if (modalSemesterFilter) modalSemesterFilter.addEventListener('change', updateModalSetupSummary);

    if (btnModalSave) {
        btnModalSave.addEventListener('click', function() {
            const formData = collectFormData();
            const modalSetup = getModalSetupValues();
            const invalidIndex = formData.findIndex(item => !item.code || !item.subject || !item.units);
            if (invalidIndex !== -1) {
                alert('Please fill in all required fields in all rows.');
                return;
            }

            if (!modalSetup.course || !modalSetup.yearLevel || !modalSetup.semester) {
                alert('Please choose the Course, Year Level, and Semester inside the modal.');
                return;
            }

            if (modalMode === 'edit' || modalMode === 'offer') {
                const editTargets = modalSubjects.length ? modalSubjects : getSelectedSubjects();
                if (!editTargets.length) {
                    alert('Please select at least one subject first.');
                    return;
                }

                if (formData.length !== editTargets.length) {
                    alert('Please review the selected subject rows before saving.');
                    return;
                }

                const editCourseCode = modalSetup.course;
                const editYearLevel = Number(modalSetup.yearLevel);
                const editSemester = Number(modalSetup.semester);

                Promise.all(editTargets.map((subject, index) => {
                    const item = formData[index];
                    return fetch(`${API_BASE}/curriculum_update.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: subject.id,
                            course_code: editCourseCode,
                            subject_code: item.code.trim(),
                            subject_name: item.subject.trim(),
                            year_level: editYearLevel,
                            semester: editSemester,
                            units: Number(item.units),
                            description: item.subject.trim(),
                            professor_id: subject && subject.professor_id ? Number(subject.professor_id) : null,
                            prerequisites: item.prerequisites.trim()
                        })
                    }).then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, json: j })));
                }))
                .then(results => {
                    const failed = results.find(result => !result.ok || !result.json?.ok);
                    if (failed) {
                        alert(failed.json?.error || 'Failed to update curriculum.');
                        return;
                    }
                    syncMainFilters(editCourseCode, String(editYearLevel), String(editSemester));
                    closeModal();
                    alert(`Updated ${editTargets.length} subject${editTargets.length === 1 ? '' : 's'} successfully.`);
                    loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
                })
                .catch(() => alert('Network error while updating curriculum.'));

                return;
            }

            const items = formData.map(item => ({
                course_code: modalSetup.course,
                subject_code: item.code.trim(),
                subject_name: item.subject.trim(),
                year_level: Number(modalSetup.yearLevel),
                semester: Number(modalSetup.semester),
                units: Number(item.units),
                description: item.subject.trim(),
                professor_id: item.professorId ? Number(item.professorId) : null,
                prerequisites: item.prerequisites.trim()
            }));

            fetch(`${API_BASE}/curriculum_create.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            })
            .then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, json: j })))
            .then(({ ok, json }) => {
                if (!ok || !json.ok) {
                    alert(json.error || 'Failed to save curriculum.');
                    return;
                }
                syncMainFilters(modalSetup.course, modalSetup.yearLevel, modalSetup.semester);
                closeModal();
                alert('Subject saved successfully.');
                loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
            })
            .catch(() => alert('Network error while saving curriculum.'));
        });
    }

    // ===== EXISTING CURRICULUM FUNCTIONALITY =====
    let currentCourse = 'all';
    let currentYearLevel = 'all';
    let currentSemester = 'all';

    async function fetchCurriculum(course, yearLevel, semester) {
        const params = new URLSearchParams();
        if (course && course !== 'all') {
            params.append('course', course);
        }
        if (yearLevel && yearLevel !== 'all') {
            params.append('year_level', yearLevel);
        }
        if (semester && semester !== 'all') {
            params.append('semester', semester);
        }
        if (normalizedUserRole === 'student') {
            params.append('enrolled_only', '1');
        }

        const query = params.toString();
        const response = await fetch(`${API_BASE}/curriculum_list.php${query ? `?${query}` : ''}`);
        if (!response.ok) {
            throw new Error(`Failed to load curriculum: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.error || 'Failed to load curriculum');
        }

        professorOptions = Array.isArray(data.professors) ? data.professors : [];
        return Array.isArray(data.curriculum) ? data.curriculum : [];
    }

    async function fetchCurriculumAllSemesters(course, yearLevel) {
        const params = new URLSearchParams();
        if (course && course !== 'all') {
            params.append('course', course);
        }
        if (yearLevel && yearLevel !== 'all') {
            params.append('year_level', yearLevel);
        }
        if (normalizedUserRole === 'student') {
            params.append('enrolled_only', '1');
        }

        const query = params.toString();
        const response = await fetch(`${API_BASE}/curriculum_list.php${query ? `?${query}` : ''}`);
        if (!response.ok) {
            throw new Error(`Failed to load curriculum: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.error || 'Failed to load curriculum');
        }

        return Array.isArray(data.curriculum) ? data.curriculum : [];
    }
    
    // Set default course filter to "all"
    if (courseFilter) {
        courseFilter.value = 'all';
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
            semesterFilter.value = activeUserSemester || 'all';
            semesterFilter.disabled = false;
        }

        currentCourse = studentCourseCode || courseFilter?.value || 'all';
        currentYearLevel = studentYearLevel || yearLevelFilter?.value || 'all';
        currentSemester = activeUserSemester || semesterFilter?.value || 'all';
    }

    // Initialize with default data
    async function loadCurriculumData(course, yearLevel, semester) {
        if (!curriculumTableBody) return;

        try {
            const effectiveSemester = semester || 'all';
            const curriculum = await fetchCurriculum(course, yearLevel, effectiveSemester);
            const displayData = effectiveSemester === 'all'
                ? await fetchCurriculumAllSemesters(course, yearLevel)
                : curriculum;

            curriculumCache = displayData;
            const availableIds = new Set(displayData.map(subject => String(subject.id)));
            selectedSubjectIds = new Set(Array.from(selectedSubjectIds).filter(id => availableIds.has(id)));
            selectedSubject = null;
            curriculumTableBody.innerHTML = '';
            renderSetupColumns(displayData, effectiveSemester);
            updateSelectionState();
        } catch (error) {
            console.error(error);
            if (curriculumSetupGrid) {
                curriculumSetupGrid.innerHTML = `
                    <div class="curriculum-setup-empty" style="color: #f87171;">${normalizedUserRole === 'student' ? 'Unable to load your enrolled subjects.' : 'Unable to load curriculum data.'}</div>
                `;
            }
        }
    }

    function isSubjectOffered(subject) {
        return Number(subject?.is_offered || 0) === 1;
    }

    function getOfferStatusText(subject) {
        return isSubjectOffered(subject) ? 'Offered' : 'Not offered';
    }

    function renderTable(data) {
        if (!curriculumTableBody) return;

        if (data.length === 0) {
            curriculumTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px; display: block;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p style="margin: 0; font-size: 14px;">No curriculum found for the selected filters</p>
                    </td>
                </tr>
            `;
            renderSetupColumns([], currentSemester);
            return;
        }

        curriculumTableBody.innerHTML = data.map(subject => `
            <tr data-id="${subject.id}" class="${selectedSubjectIds.has(String(subject.id)) ? 'selected' : ''}">
                <td>${escapeHtml(subject.course_code || subject.course || 'Unknown')}</td>
                <td>${escapeHtml(subject.subject_code)}</td>
                <td>${escapeHtml(subject.subject_name || subject.description || '')}</td>
                <td>
                    <span class="year-level-badge year-${subject.year_level}">
                        ${subject.year_level}${getYearSuffix(subject.year_level)} Year
                    </span>
                </td>
                <td>${subject.semester === 1 ? '1st Semester' : subject.semester === 2 ? '2nd Semester' : escapeHtml(subject.semester)}</td>
                <td>${subject.units}</td>
                <td>${escapeHtml(subject.prerequisites || 'None')}</td>
            </tr>
        `).join('');

        renderSetupColumns(data, currentSemester);
    }

    function renderSetupColumns(data, semesterView = 'all') {
        if (!curriculumSetupGrid) return;

        if (!Array.isArray(data) || data.length === 0) {
            curriculumSetupGrid.innerHTML = `<div class="curriculum-setup-empty">${normalizedUserRole === 'student' ? 'No enrolled subjects yet.' : 'No curriculum setup available yet.'}</div>`;
            return;
        }

        const normalizedSemesterView = String(semesterView || 'all');

        const grouped = {};
        data.forEach(subject => {
            const courseCode = String(subject.course_code || subject.course || 'Unknown');
            const yearLevel = String(subject.year_level || '1');
            const key = courseCode + '||' + yearLevel;

            if (!grouped[key]) {
                grouped[key] = {
                    courseCode,
                    yearLevel,
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

        const sortedGroups = Object.values(grouped).sort((a, b) => {
            if (a.courseCode === b.courseCode) {
                return Number(a.yearLevel) - Number(b.yearLevel);
            }
            return a.courseCode.localeCompare(b.courseCode);
        });

        curriculumSetupGrid.innerHTML = sortedGroups.map(group => {
            const renderSubjectTable = (items, emptyText) => {
                if (!items.length) {
                    return `<div class="curriculum-semester-empty">${emptyText}</div>`;
                }

                return `
                    <table class="semester-table ${!isEditor ? 'student-view' : ''}">
                        <thead>
                            <tr>
                                <th>Subject Code</th>
                                <th>Subject Description</th>
                                <th>Units</th>
                                <th>Prerequisites</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(subject => `
                                <tr data-id="${subject.id}" class="${selectedSubjectIds.has(String(subject.id)) ? 'selected' : ''}">
                                    <td>${escapeHtml(subject.subject_code || '')}</td>
                                    <td>${escapeHtml(subject.subject_name || subject.description || '')}</td>
                                    <td>${escapeHtml(String(subject.units || '0'))}</td>
                                    <td>${escapeHtml(subject.prerequisites || 'None')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            };

            const showFirstSemester = normalizedSemesterView === 'all' || normalizedSemesterView === '1';
            const showSecondSemester = normalizedSemesterView === 'all' || normalizedSemesterView === '2';
            const visibleCount = (showFirstSemester ? group.firstSemester.length : 0) + (showSecondSemester ? group.secondSemester.length : 0);
            const yearBadge = `${escapeHtml(group.yearLevel)}${getYearSuffix(Number(group.yearLevel))} Year`;

            return `
                <div class="curriculum-setup-card">
                    <div class="curriculum-setup-card-header">
                        <h4>${escapeHtml(group.courseCode)} - ${yearBadge}</h4>
                        <span class="curriculum-setup-count">${visibleCount} subjects</span>
                    </div>
                    <div class="curriculum-semester-blocks">
                        ${showFirstSemester ? `
                        <div class="curriculum-semester-block">
                            <div class="curriculum-semester-heading">
                                <h5>1st Semester</h5>
                                <span class="curriculum-semester-year">${yearBadge}</span>
                            </div>
                            ${renderSubjectTable(group.firstSemester, 'No 1st semester subjects')}
                        </div>` : ''}
                        ${showSecondSemester ? `
                        <div class="curriculum-semester-block">
                            <div class="curriculum-semester-heading">
                                <h5>2nd Semester</h5>
                                <span class="curriculum-semester-year">${yearBadge}</span>
                            </div>
                            ${renderSubjectTable(group.secondSemester, 'No 2nd semester subjects')}
                        </div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    curriculumTableBody?.addEventListener('click', function(e) {
        const tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        const id = String(tr.getAttribute('data-id') || '');
        if (!id) return;
        if (selectedSubjectIds.has(id)) {
            selectedSubjectIds.delete(id);
        } else {
            selectedSubjectIds.add(id);
        }
        renderTable(curriculumCache);
        updateSelectionState();
    });

    // Click-to-select on subject rows in the setup grid
    if (curriculumSetupGrid) {
        curriculumSetupGrid.addEventListener('click', function(e) {
            const row = e.target.closest('.semester-table tr[data-id]');
            if (!row) return;
            const id = String(row.getAttribute('data-id') || '');
            if (!id) return;
            if (selectedSubjectIds.has(id)) {
                selectedSubjectIds.delete(id);
            } else {
                selectedSubjectIds.add(id);
            }
            renderSetupColumns(curriculumCache, currentSemester);
            updateSelectionState();
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getYearSuffix(year) {
        const suffixes = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' };
        return suffixes[year] || 'th';
    }

    // Course filter
    if (courseFilter) {
        courseFilter.addEventListener('change', function() {
            currentCourse = this.value;
            updateModalSetupSummary();
            loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
        });
    }

    // Year level filter
    if (yearLevelFilter) {
        yearLevelFilter.addEventListener('change', function() {
            currentYearLevel = this.value;
            updateModalSetupSummary();
            loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
        });
    }

    // Semester filter
    if (semesterFilter) {
        semesterFilter.addEventListener('change', function() {
            currentSemester = this.value;
            updateModalSetupSummary();
            loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
        });
    }

    // Initialize with default data
    loadCurriculumData(currentCourse, currentYearLevel, currentSemester);
});