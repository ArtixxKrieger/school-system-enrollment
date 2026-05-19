document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.records-container');
    if (!container) return;

    const API_BASE = String(window.ApiBaseUrl || 'api').replace(/\/$/, '');
    const searchInput = document.getElementById('recordsSearchInput');
    const searchBtn = document.getElementById('recordsSearchBtn');
    const refreshBtn = document.getElementById('recordsRefreshBtn');
    const archiveBtn = document.getElementById('recordsArchiveBtn');
    const flashMessage = document.getElementById('recordsFlashMessage');
    const tabButtons = Array.from(document.querySelectorAll('.records-tab'));
    const panels = Array.from(document.querySelectorAll('.records-panel'));

    const graduatedCount = document.getElementById('recordsGraduatedCount');
    const inactiveCount = document.getElementById('recordsInactiveCount');
    const archiveCandidatesCount = document.getElementById('recordsArchiveCandidatesCount');
    const archivedCount = document.getElementById('recordsArchivedCount');

    const graduatedBody = document.getElementById('recordsGraduatedBody');
    const inactiveBody = document.getElementById('recordsInactiveBody');
    const archivedBody = document.getElementById('recordsArchivedBody');

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function formatDate(value) {
        if (!value) return 'â€”';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return escapeHtml(value);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getFullName(row) {
        return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ') || 'Student';
    }

    function getStatusLabel(status) {
        const value = String(status || '').toLowerCase();
        if (value === 'graduated') return 'Graduated';
        if (value === 'inactive') return 'Inactive';
        if (value === 'transferred') return 'Dropped';
        return value || 'â€”';
    }

    function formatSemesterLabel(value) {
        const semester = Number(value || 0);
        if (semester === 1) return '1st Semester';
        if (semester === 2) return '2nd Semester';
        return 'Saved semester';
    }

    function openStudentView(studentId) {
        const base = String(window.AppBaseUrl || 'app').replace(/\/$/, '');
        window.location.assign(base + '/student?view=' + encodeURIComponent(String(studentId || '')));
    }

    function formatSemesterLabel(value) {
        const semester = Number(value || 0);
        if (semester === 1) return '1st Semester';
        if (semester === 2) return '2nd Semester';
        return 'Saved semester';
    }

    function openStudentView(studentId) {
        const base = String(window.AppBaseUrl || 'app').replace(/\/$/, '');
        window.location.assign(base + '/student?view=' + encodeURIComponent(String(studentId || '')));
    }

    function showMessage(text, type) {
        if (!flashMessage) return;
        flashMessage.textContent = text;
        flashMessage.className = 'records-flash ' + (type || 'success');
        flashMessage.style.display = 'block';
    }

    function clearMessage() {
        if (!flashMessage) return;
        flashMessage.textContent = '';
        flashMessage.className = 'records-flash';
        flashMessage.style.display = 'none';
    }

    function renderCurrentRows(target, rows, emptyText) {
        if (!target) return;
        if (!Array.isArray(rows) || rows.length === 0) {
            target.innerHTML = '<tr><td colspan="7" class="records-empty-row">' + escapeHtml(emptyText) + '</td></tr>';
            return;
        }

        target.innerHTML = rows.map(function (row) {
            const status = String(row.status || '').toLowerCase();
            const studentId = Number(row.id || 0);
            const yearLevel = Number(row.year_level || 0);
            const currentSemester = Number(row.current_semester || 0);

            return '<tr>' +
                '<td>' + escapeHtml(getFullName(row)) + '</td>' +
                '<td>' + escapeHtml(row.email || 'â€”') + '</td>' +
                '<td>' + escapeHtml(row.course_code || row.course_name || 'â€”') + '</td>' +
                '<td>' + escapeHtml(String(row.year_level || 'â€”')) + '</td>' +
                '<td><span class="records-status-badge ' + escapeHtml(status) + '">' + escapeHtml(getStatusLabel(status)) + '</span></td>' +
                '<td>' + formatDate(row.graduated_at || row.enrollment_date) + '</td>' +
                '<td><div class="records-action-buttons">' +
                    '<button type="button" class="records-action-btn records-view-btn" data-record-action="view" data-id="' + studentId + '" title="View student">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
                    '</button>' +
                    '<button type="button" class="records-action-btn records-retrieve-btn" data-record-action="retrieve" data-source="current" data-id="' + studentId + '" data-year="' + yearLevel + '" data-semester="' + currentSemester + '" title="Retrieve student">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 3 12 9 6"></polyline><path d="M3 12h18"></path></svg>' +
                    '</button>' +
                '</div></td>' +
            '</tr>';
        }).join('');
    }

    function renderArchivedRows(rows) {
        if (!archivedBody) return;
        if (!Array.isArray(rows) || rows.length === 0) {
            archivedBody.innerHTML = '<tr><td colspan="8" class="records-empty-row">No archived graduates found.</td></tr>';
            return;
        }

        archivedBody.innerHTML = rows.map(function (row) {
            const studentId = Number(row.student_pk || 0);
            const yearLevel = Number(row.year_level || 0);
            const currentSemester = Number(row.current_semester || 0);

            return '<tr>' +
                '<td>' + escapeHtml(getFullName(row)) + '</td>' +
                '<td>' + escapeHtml(row.email || 'â€”') + '</td>' +
                '<td>' + escapeHtml(row.course_code || row.course_name || 'â€”') + '</td>' +
                '<td>' + escapeHtml(String(row.year_level || 'â€”')) + '</td>' +
                '<td>' + formatDate(row.graduated_at) + '</td>' +
                '<td>' + formatDate(row.archived_at) + '</td>' +
                '<td>' + escapeHtml(row.archive_reason || 'Archived') + '</td>' +
                '<td><div class="records-action-buttons">' +
                    '<button type="button" class="records-action-btn records-view-btn" data-record-action="view" data-id="' + studentId + '" title="View student">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
                    '</button>' +
                    '<button type="button" class="records-action-btn records-retrieve-btn" data-record-action="retrieve" data-source="archived" data-id="' + studentId + '" data-year="' + yearLevel + '" data-semester="' + currentSemester + '" title="Retrieve student">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 3 12 9 6"></polyline><path d="M3 12h18"></path></svg>' +
                    '</button>' +
                '</div></td>' +
            '</tr>';
        }).join('');
    }

    function setActiveTab(target) {
        tabButtons.forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-target') === target);
        });

        panels.forEach(function (panel) {
            panel.classList.toggle('active', panel.getAttribute('data-panel') === target);
        });
    }

    async function retrieveRecord(button) {
        const studentId = Number(button.getAttribute('data-id') || 0);
        const source = String(button.getAttribute('data-source') || 'current');
        const yearLevel = String(button.getAttribute('data-year') || '').trim();
        const semester = String(button.getAttribute('data-semester') || '').trim();

        if (!studentId) {
            showMessage('Unable to retrieve this student right now.', 'error');
            return;
        }

        const yearText = yearLevel ? ('Year ' + yearLevel) : 'saved year level';
        const semesterText = formatSemesterLabel(semester);
        const confirmed = window.confirm('Retrieve this student? They will return to ' + yearText + ' â€¢ ' + semesterText + '.');
        if (!confirmed) {
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch(source === 'archived' ? (API_BASE + '/records_archive.php') : (API_BASE + '/student_update_status.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(source === 'archived'
                    ? { action: 'retrieve_record', student_id: studentId }
                    : { id: studentId, status: 'active' })
            });

            const data = await response.json().catch(function () { return {}; });
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Failed to retrieve this student.');
            }

            showMessage((data.message || 'Student retrieved successfully.') + ' Restored to ' + yearText + ' â€¢ ' + semesterText + '.', 'success');
            await loadRecords();
        } catch (error) {
            showMessage(error && error.message ? error.message : 'Failed to retrieve this student.', 'error');
        } finally {
            button.disabled = false;
        }
    }

    async function loadRecords() {
        clearMessage();

        const params = new URLSearchParams();
        const search = searchInput ? String(searchInput.value || '').trim() : '';
        if (search) {
            params.set('search', search);
        }

        const response = await fetch(API_BASE + '/records_list.php' + (params.toString() ? '?' + params.toString() : ''));
        const data = await response.json().catch(function () { return {}; });

        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Unable to load records right now.');
        }

        const graduated = Array.isArray(data.graduated) ? data.graduated : [];
        const inactiveDrop = Array.isArray(data.inactive_drop) ? data.inactive_drop : [];
        const archived = Array.isArray(data.archived) ? data.archived : [];
        const stats = data.stats || {};

        if (graduatedCount) graduatedCount.textContent = String(stats.graduated || graduated.length || 0);
        if (inactiveCount) inactiveCount.textContent = String(stats.inactive_drop || inactiveDrop.length || 0);
        if (archiveCandidatesCount) archiveCandidatesCount.textContent = String(stats.archive_candidates || 0);
        if (archivedCount) archivedCount.textContent = String(stats.archived || archived.length || 0);

        renderCurrentRows(graduatedBody, graduated, 'No graduated students found.');
        renderCurrentRows(inactiveBody, inactiveDrop, 'No inactive or dropped students found.');
        renderArchivedRows(archived);
    }

    async function archiveEligibleGraduates() {
        if (!archiveBtn) return;
        const confirmed = window.confirm('Move all graduates older than 3 years into the archive table?');
        if (!confirmed) return;

        archiveBtn.disabled = true;

        try {
            const response = await fetch(API_BASE + '/records_archive.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'archive_eligible_graduates' })
            });

            const data = await response.json().catch(function () { return {}; });
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Failed to archive graduates.');
            }

            showMessage(data.message || 'Archive completed successfully.', 'success');
            setActiveTab('archived');
            await loadRecords();
        } catch (error) {
            showMessage(error && error.message ? error.message : 'Failed to archive graduates.', 'error');
        } finally {
            archiveBtn.disabled = false;
        }
    }

    container.addEventListener('click', function (event) {
        const actionButton = event.target.closest('button[data-record-action]');
        if (!actionButton) {
            return;
        }

        event.preventDefault();

        const action = String(actionButton.getAttribute('data-record-action') || '');
        const studentId = Number(actionButton.getAttribute('data-id') || 0);

        if (action === 'view' && studentId > 0) {
            openStudentView(studentId);
            return;
        }

        if (action === 'retrieve') {
            retrieveRecord(actionButton);
        }
    });

    container.addEventListener('click', function (event) {
        const actionButton = event.target.closest('button[data-record-action]');
        if (!actionButton) {
            return;
        }

        event.preventDefault();

        const action = String(actionButton.getAttribute('data-record-action') || '');
        const studentId = Number(actionButton.getAttribute('data-id') || 0);

        if (action === 'view' && studentId > 0) {
            openStudentView(studentId);
            return;
        }

        if (action === 'retrieve') {
            retrieveRecord(actionButton);
        }
    });

    tabButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            setActiveTab(button.getAttribute('data-target') || 'graduated');
        });
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            loadRecords().catch(function (error) {
                showMessage(error && error.message ? error.message : 'Unable to load records right now.', 'error');
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                loadRecords().catch(function (error) {
                    showMessage(error && error.message ? error.message : 'Unable to load records right now.', 'error');
                });
            }
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            loadRecords().catch(function (error) {
                showMessage(error && error.message ? error.message : 'Unable to load records right now.', 'error');
            });
        });
    }

    if (archiveBtn) {
        archiveBtn.addEventListener('click', archiveEligibleGraduates);
    }

    loadRecords().catch(function (error) {
        showMessage(error && error.message ? error.message : 'Unable to load records right now.', 'error');
    });
});

// ---------------------------------------------------------------
// Offered Subjects Archive — added to existing records.js scope
// ---------------------------------------------------------------
(function () {
    const container = document.querySelector('.records-container');
    if (!container) return;

    const API_BASE = String(window.ApiBaseUrl || 'api').replace(/\/$/, '');

    const activeBody   = document.getElementById('offeredActiveBody');
    const archivedBody = document.getElementById('offeredArchivedBody');
    const flashEl      = document.getElementById('offeredFlashMessage');
    const archiveYearBtn = document.getElementById('offeredArchiveYearBtn');
    const archiveAllBtn  = document.getElementById('offeredArchiveAllBtn');
    const refreshBtn     = document.getElementById('offeredRefreshBtn');
    const yearInput      = document.getElementById('offeredArchiveYearInput');
    const activeCountEl  = document.getElementById('recordsOfferedActiveCount');

    const canEdit = !!(archiveYearBtn || archiveAllBtn);

    function escHtml(v) {
        const d = document.createElement('div');
        d.textContent = v == null ? '' : String(v);
        return d.innerHTML;
    }

    function fmtDate(v) {
        if (!v) return '—';
        const d = new Date(v);
        return isNaN(d) ? escHtml(v) : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function showMsg(text, type) {
        if (!flashEl) return;
        flashEl.textContent = text;
        flashEl.className = 'records-flash ' + (type || 'success');
        flashEl.style.display = 'block';
        setTimeout(function () { flashEl.style.display = 'none'; }, 6000);
    }

    function renderActive(rows) {
        if (!activeBody) return;
        const colspan = canEdit ? 5 : 4;
        if (!rows || !rows.length) {
            activeBody.innerHTML = '<tr><td colspan="' + colspan + '" class="records-empty-row">No active offered subjects.</td></tr>';
            return;
        }
        activeBody.innerHTML = rows.map(function (r) {
            return '<tr>' +
                '<td>' + escHtml(r.academic_year || '—') + '</td>' +
                '<td>' + escHtml(r.subject_count || 0) + '</td>' +
                '<td>' + escHtml(r.courses || '—') + '</td>' +
                '<td>' + fmtDate(r.last_offered) + '</td>' +
                (canEdit ? '<td><button class="records-btn records-btn-secondary" data-off-action="archive-year" data-year="' + escHtml(r.academic_year) + '" style="font-size:12px;padding:4px 10px;">Archive</button></td>' : '') +
            '</tr>';
        }).join('');
    }

    function renderArchived(rows) {
        if (!archivedBody) return;
        const colspan = canEdit ? 5 : 4;
        if (!rows || !rows.length) {
            archivedBody.innerHTML = '<tr><td colspan="' + colspan + '" class="records-empty-row">No archived offerings yet.</td></tr>';
            return;
        }
        archivedBody.innerHTML = rows.map(function (r) {
            return '<tr>' +
                '<td>' + escHtml(r.academic_year || '—') + '</td>' +
                '<td>' + escHtml(r.subject_count || 0) + '</td>' +
                '<td>' + escHtml(r.courses || '—') + '</td>' +
                '<td>' + fmtDate(r.archived_at) + '</td>' +
                (canEdit ? '<td><button class="records-btn records-btn-secondary" data-off-action="restore-year" data-year="' + escHtml(r.academic_year) + '" style="font-size:12px;padding:4px 10px;">Restore</button></td>' : '') +
            '</tr>';
        }).join('');
    }

    async function loadOffered() {
        try {
            const res  = await fetch(API_BASE + '/subject_offerings_archive.php');
            const data = await res.json().catch(function () { return {}; });
            if (!data.ok) throw new Error(data.error || 'Failed to load offered subjects.');

            if (activeCountEl) activeCountEl.textContent = String(data.active_count || 0);
            renderActive(data.active);
            renderArchived(data.archived);
        } catch (err) {
            showMsg(err && err.message ? err.message : 'Could not load offered subjects.', 'error');
        }
    }

    async function postAction(payload, btn) {
        if (btn) btn.disabled = true;
        try {
            const res  = await fetch(API_BASE + '/subject_offerings_archive.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(function () { return {}; });
            if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed.');
            showMsg(data.message || 'Done.', 'success');
            await loadOffered();
        } catch (err) {
            showMsg(err && err.message ? err.message : 'An error occurred.', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // Archive a specific year (from input)
    if (archiveYearBtn) {
        archiveYearBtn.addEventListener('click', function () {
            const yr = yearInput ? yearInput.value.trim() : '';
            if (!/^\d{4}-\d{4}$/.test(yr)) {
                showMsg('Enter a valid academic year, e.g. 2024-2025.', 'error');
                return;
            }
            if (!confirm('Archive all active offered subjects for ' + yr + '? This will clear the active schedule for that year.')) return;
            postAction({ action: 'archive_year', academic_year: yr }, archiveYearBtn);
        });
    }

    // Archive all active at once
    if (archiveAllBtn) {
        archiveAllBtn.addEventListener('click', function () {
            if (!confirm('Archive ALL currently active offered subjects? They can be restored later.')) return;
            postAction({ action: 'archive_all' }, archiveAllBtn);
        });
    }

    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            loadOffered().catch(function () {});
        });
    }

    // Delegate archive/restore buttons in the table rows
    container.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-off-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-off-action');
        const year   = btn.getAttribute('data-year') || '';

        if (action === 'archive-year') {
            if (!confirm('Archive all active offerings for ' + year + '?')) return;
            postAction({ action: 'archive_year', academic_year: year }, btn);
        } else if (action === 'restore-year') {
            if (!confirm('Restore offered subjects for ' + year + '? They will become active again.')) return;
            postAction({ action: 'restore_year', academic_year: year }, btn);
        }
    });

    // Load when the Offered Subjects tab is clicked
    document.querySelectorAll('.records-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            if (tab.getAttribute('data-target') === 'offered') {
                loadOffered().catch(function () {});
            }
        });
    });

    // Also load on page init so the stat card updates
    loadOffered().catch(function () {});
})();
