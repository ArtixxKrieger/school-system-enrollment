document.addEventListener('DOMContentLoaded', function () {
	const root = document.querySelector('.enrollment-settings-page');
	if (!root) return;

	const state = {
		courses: [],
		scheduleByCourse: new Map(),
		students: [],
		logs: [],
		logsPage: 1,
		logsLimit: 10,
		logsTotal: 0,
		logsTotalPages: 1,
	};

	const tabs = Array.from(root.querySelectorAll('.tab-button'));
	const panels = Array.from(root.querySelectorAll('.tab-panel'));

	const windowTableBody = document.getElementById('windowTableBody');
	const saveAllWindowsBtn = document.getElementById('saveAllWindows');
	const refreshWindowsBtn = document.getElementById('refreshWindows');
	const saveAdvancedSettingsBtn = document.getElementById('saveAdvancedSettings');

	const autoCloseAccounts = document.getElementById('autoCloseAccounts');
	const strictEnrollmentWindows = document.getElementById('strictEnrollmentWindows');
	const autoProgression = document.getElementById('autoProgression');
	const systemCloseDate = document.getElementById('systemCloseDate');

	const filterYear = document.getElementById('filterYear');
	const filterSemester = document.getElementById('filterSemester');
	const filterProgression = document.getElementById('filterProgression');
	const selectAllStudents = document.getElementById('selectAllStudents');
	const studentManagementBody = document.getElementById('studentManagementBody');
	const batchApprove = document.getElementById('batchApprove');
	const batchLock = document.getElementById('batchLock');
	const batchProgressApprove = document.getElementById('batchProgressApprove');

	const overrideFirstName = document.getElementById('overrideFirstName');
	const overrideMiddleName = document.getElementById('overrideMiddleName');
	const overrideLastName = document.getElementById('overrideLastName');
	const overrideEmail = document.getElementById('overrideEmail');
	const overridePhone = document.getElementById('overridePhone');
	const overrideAddress = document.getElementById('overrideAddress');
	const overrideCourse = document.getElementById('overrideCourse');
	const overrideYear = document.getElementById('overrideYear');
	const overrideSemester = document.getElementById('overrideSemester');
	const overrideReason = document.getElementById('overrideReason');
	const saveOverride = document.getElementById('saveOverride');

	const progressionLogList = document.getElementById('progressionLogList');
	const logPagination = document.getElementById('logPagination');
	const logPaginationInfo = document.getElementById('logPaginationInfo');
	const logPaginationPages = document.getElementById('logPaginationPages');
	const logPrevBtn = document.getElementById('logPrevBtn');
	const logNextBtn = document.getElementById('logNextBtn');

	// Permission checks
	const canEditSettings = window.UserCan && window.UserCan.edit('settings');
	if (!canEditSettings) {
		if (saveAllWindowsBtn) saveAllWindowsBtn.style.display = 'none';
		if (saveAdvancedSettingsBtn) saveAdvancedSettingsBtn.style.display = 'none';
		if (batchApprove) batchApprove.style.display = 'none';
		if (batchLock) batchLock.style.display = 'none';
		if (batchProgressApprove) batchProgressApprove.style.display = 'none';
		if (saveOverride) saveOverride.style.display = 'none';
		if (autoCloseAccounts) autoCloseAccounts.disabled = true;
		if (strictEnrollmentWindows) strictEnrollmentWindows.disabled = true;
		if (autoProgression) autoProgression.disabled = true;
		if (systemCloseDate) systemCloseDate.disabled = true;
	}

	function escapeHtml(value) {
		const div = document.createElement('div');
		div.textContent = value == null ? '' : String(value);
		return div.innerHTML;
	}

	function fetchJson(url, options) {
		return fetch(url, options).then(function (res) {
			return res
				.json()
				.catch(function () {
					return null;
				})
				.then(function (data) {
					if (!res.ok || !data || data.ok === false) {
						const msg = (data && (data.error || data.details)) || ('Request failed (' + res.status + ')');
						throw new Error(msg);
					}
					return data;
				});
		});
	}

	function notify(message, type) {
		type = type || 'success';
		var container = document.getElementById('toastContainer');
		if (!container) { window.alert(message); return; }

		var toast = document.createElement('div');
		toast.className = 'toast ' + type;
		toast.innerHTML = '<span>' + escapeHtml(message) + '</span><button class="toast-close" type="button">&times;</button>';

		container.appendChild(toast);

		toast.querySelector('.toast-close').addEventListener('click', function () {
			removeToast(toast);
		});

		setTimeout(function () {
			removeToast(toast);
		}, 4000);
	}

	function removeToast(el) {
		if (!el || el.classList.contains('removing')) return;
		el.classList.add('removing');
		setTimeout(function () {
			if (el.parentNode) el.parentNode.removeChild(el);
		}, 300);
	}

	function confirmAction(message, onConfirm, anchorEl) {
		// Show inline confirmation bar above the anchor element (or at top of page)
		var bar = document.createElement('div');
		bar.className = 'inline-confirm';
		bar.innerHTML =
			'<span class="confirm-msg">' + escapeHtml(message) + '</span>' +
			'<button type="button" class="confirm-yes">Yes, proceed</button>' +
			'<button type="button" class="confirm-no">Cancel</button>';

		var target = anchorEl ? anchorEl.parentNode : root;
		target.insertBefore(bar, anchorEl || target.firstChild);

		bar.querySelector('.confirm-yes').addEventListener('click', function () {
			bar.remove();
			onConfirm();
		});
		bar.querySelector('.confirm-no').addEventListener('click', function () {
			bar.remove();
		});
	}

	// Convert a MySQL DATETIME string (e.g. "2026-04-15 08:00:00") to the
	// value format expected by <input type="datetime-local"> ("2026-04-15T08:00").
	function toDatetimeLocalValue(mysqlDatetime) {
		if (!mysqlDatetime) return '';
		// Already in T-format
		if (mysqlDatetime.indexOf('T') !== -1) return mysqlDatetime.slice(0, 16);
		// "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM"
		var parts = mysqlDatetime.split(' ');
		if (parts.length === 2) return parts[0] + 'T' + parts[1].slice(0, 5);
		// Date-only fallback
		return mysqlDatetime.slice(0, 10) + 'T00:00';
	}

	// Convert a datetime-local value ("2026-04-15T08:00") to MySQL format ("2026-04-15 08:00:00")
	function toMysqlDatetime(localValue) {
		if (!localValue) return null;
		return localValue.replace('T', ' ') + (localValue.length <= 16 ? ':00' : '');
	}

	function addLog(message) {
		state.logs.unshift({
			description: message,
			actor_name: 'Current session',
			actor_role: '',
			created_at: new Date().toISOString(),
		});
		state.logs = state.logs.slice(0, 30);
		renderLogs();
	}

	function createLogPageButton(pageNumber, isActive) {
		var button = document.createElement('button');
		button.type = 'button';
		button.className = 'log-page-number' + (isActive ? ' active' : '');
		button.textContent = String(pageNumber);
		button.addEventListener('click', function () {
			if (pageNumber === state.logsPage) return;
			loadActivityLogs(pageNumber).catch(function (err) {
				notify(err.message || 'Failed to load activity logs.', 'error');
			});
		});
		return button;
	}

	function renderLogPagination() {
		if (!logPagination || !logPaginationInfo || !logPaginationPages || !logPrevBtn || !logNextBtn) {
			return;
		}

		var total = Number(state.logsTotal || 0);
		var currentPage = Number(state.logsPage || 1);
		var totalPages = Math.max(1, Number(state.logsTotalPages || 1));

		logPagination.hidden = total <= 0;
		logPaginationInfo.textContent = total <= 0
			? 'Showing 0 of 0'
			: 'Showing page ' + currentPage + ' of ' + totalPages + ' (' + total + ' total)';

		logPaginationPages.innerHTML = '';

		if (total > 0) {
			var startPage = Math.max(1, currentPage - 2);
			var endPage = Math.min(totalPages, startPage + 4);
			startPage = Math.max(1, endPage - 4);

			for (var page = startPage; page <= endPage; page++) {
				logPaginationPages.appendChild(createLogPageButton(page, currentPage === page));
			}
		}

		logPrevBtn.disabled = total <= 0 || currentPage <= 1;
		logNextBtn.disabled = total <= 0 || currentPage >= totalPages;
	}

	function formatLogDate(value) {
		if (!value) return 'Unknown time';
		var date = new Date(value);
		if (Number.isNaN(date.getTime())) return String(value);
		return date.toLocaleString();
	}

	function formatRole(role) {
		if (!role) return '';
		return String(role)
			.replace(/[_-]+/g, ' ')
			.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
	}

	function loadActivityLogs(pageNumber) {
		if (!progressionLogList) {
			return Promise.resolve();
		}

		var requestedPage = Math.max(1, Number(pageNumber || state.logsPage || 1));
		state.logsPage = requestedPage;
		progressionLogList.innerHTML = '<div class="empty-state">Loading activity logs...</div>';
		renderLogPagination();

		return fetchJson('api/enrollment_activity_logs.php?page=' + encodeURIComponent(requestedPage) + '&limit=' + encodeURIComponent(state.logsLimit)).then(function (data) {
			state.logs = Array.isArray(data.logs) ? data.logs : [];
			state.logsPage = Number(data.page || requestedPage || 1);
			state.logsLimit = Number(data.limit || state.logsLimit || 10);
			state.logsTotal = Number(data.total || 0);
			state.logsTotalPages = Math.max(1, Number(data.total_pages || 1));
			renderLogs();
		});
	}

	function renderLogs() {
		if (!progressionLogList) return;
		if (!state.logs.length) {
			progressionLogList.innerHTML = '<div class="empty-state">No activity yet.</div>';
			renderLogPagination();
			return;
		}
		progressionLogList.innerHTML = state.logs
			.map(function (log) {
				var actorName = escapeHtml(log.actor_name || 'System User');
				var actorRole = formatRole(log.actor_role || '');
				var actorMeta = actorRole ? actorName + ' · ' + escapeHtml(actorRole) : actorName;
				var description = escapeHtml(log.description || log.message || 'Activity recorded');
				return (
					'<div class="log-item">' +
					'<div class="log-item-title"><strong>' + description + '</strong></div>' +
					'<div class="log-item-meta">' + actorMeta + '</div>' +
					'<div class="log-item-time">' + escapeHtml(formatLogDate(log.created_at || log.at)) + '</div>' +
					'</div>'
				);
			})
			.join('');
		renderLogPagination();
	}

	function bindTabs() {
		tabs.forEach(function (btn) {
			btn.addEventListener('click', function () {
				const tab = btn.getAttribute('data-tab');
				tabs.forEach(function (b) {
					b.classList.toggle('active', b === btn);
					b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
				});
				panels.forEach(function (panel) {
					panel.classList.toggle('active', panel.id === 'tab-' + tab);
				});

				if (tab === 'logs') {
					loadActivityLogs(state.logsPage).catch(function (err) {
						notify(err.message || 'Failed to load activity logs.', 'error');
					});
				}
			});
		});
	}

	function bindLogPagination() {
		if (logPrevBtn) {
			logPrevBtn.addEventListener('click', function () {
				if (state.logsPage <= 1) return;
				loadActivityLogs(state.logsPage - 1).catch(function (err) {
					notify(err.message || 'Failed to load activity logs.', 'error');
				});
			});
		}

		if (logNextBtn) {
			logNextBtn.addEventListener('click', function () {
				if (state.logsPage >= state.logsTotalPages) return;
				loadActivityLogs(state.logsPage + 1).catch(function (err) {
					notify(err.message || 'Failed to load activity logs.', 'error');
				});
			});
		}
	}

	function getScheduleForCourse(courseId) {
		var key = String(courseId);
		return state.scheduleByCourse.get(key) || null;
	}

	function renderWindowRows() {
		if (!windowTableBody) return;
		if (!state.courses.length) {
			windowTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No courses found.</td></tr>';
			return;
		}

		var rows = [];

		state.courses.forEach(function (course) {
			var schedule = getScheduleForCourse(course.id);
			var scheduleId = schedule ? schedule.id : '';
			var startVal = schedule ? toDatetimeLocalValue(schedule.enrollment_start_date) : '';
			var endVal = schedule ? toDatetimeLocalValue(schedule.enrollment_end_date) : '';
			rows.push(
				'<tr data-course-id="' + course.id + '" data-schedule-id="' + scheduleId + '">' +
				'<td>' + escapeHtml(course.course_code + ' - ' + course.course_name) + '</td>' +
				'<td><input type="datetime-local" class="date-input start-date" value="' + escapeHtml(startVal) + '"></td>' +
				'<td><input type="datetime-local" class="date-input end-date" value="' + escapeHtml(endVal) + '"></td>' +
				'<td><button class="save-window btn-secondary" type="button">Save</button></td>' +
				'</tr>'
			);
		});

		windowTableBody.innerHTML = rows.join('');
	}

	function loadAdvancedSettings() {
		return fetchJson('api/enrollment_advanced_settings.php').then(function (data) {
			const settings = data.settings || {};
			if (autoCloseAccounts) autoCloseAccounts.value = settings.auto_close_accounts || 'never';
			if (strictEnrollmentWindows) strictEnrollmentWindows.checked = !!Number(settings.strict_enrollment_windows || 0) || settings.strict_enrollment_windows === true;
			if (autoProgression) autoProgression.checked = !!Number(settings.auto_progression || 0) || settings.auto_progression === true;
			if (systemCloseDate) systemCloseDate.value = toDatetimeLocalValue(settings.system_close_date);
		});
	}

	function saveAdvancedSettings() {
		const payload = {
			auto_close_accounts: autoCloseAccounts ? autoCloseAccounts.value : 'never',
			strict_enrollment_windows: strictEnrollmentWindows ? strictEnrollmentWindows.checked : false,
			auto_progression: autoProgression ? autoProgression.checked : true,
			system_close_date: systemCloseDate ? toMysqlDatetime(systemCloseDate.value) : null,
		};

		return fetchJson('api/enrollment_advanced_settings.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then(function () {
			addLog('Saved advanced enrollment settings (system close date: ' + (payload.system_close_date || 'none') + ')');
			return loadActivityLogs();
		}).then(function () {
			notify('Advanced settings saved.');
			return loadAdvancedSettings();
		});
	}

	function loadCoursesAndSchedules() {
		return Promise.all([
			fetchJson('api/courses_list.php'),
			fetchJson('api/course_enrollment_schedules.php'),
		]).then(function (results) {
			const courses = Array.isArray(results[0].courses) ? results[0].courses : [];
			const schedules = Array.isArray(results[1].schedules) ? results[1].schedules : [];

			state.courses = courses;
			state.scheduleByCourse.clear();

			schedules.forEach(function (schedule) {
				var key = String(schedule.course_id);
				if (!state.scheduleByCourse.has(key)) {
					state.scheduleByCourse.set(key, schedule);
				}
			});

			renderWindowRows();
			renderOverrideCourses();
		});
	}

	function saveWindowRow(tr) {
		const courseId = tr.getAttribute('data-course-id');
		if (!courseId) {
			return Promise.reject(new Error('Missing course.'));
		}

		const startDate = tr.querySelector('.start-date') ? tr.querySelector('.start-date').value : '';
		const endDate = tr.querySelector('.end-date') ? tr.querySelector('.end-date').value : '';

		if (!startDate || !endDate) {
			return Promise.reject(new Error('Start and end date are required.'));
		}

		if (startDate > endDate) {
			return Promise.reject(new Error('Start date cannot be later than end date.'));
		}

		const existingSchedule = getScheduleForCourse(courseId);
		const payload = {
			id: existingSchedule ? existingSchedule.id : null,
			course_id: Number(courseId),
			enrollment_start_date: toMysqlDatetime(startDate),
			enrollment_end_date: toMysqlDatetime(endDate),
		};

		return fetchJson('api/course_enrollment_schedules.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then(function () {
			const course = state.courses.find(function (c) {
				return String(c.id) === String(courseId);
			});
			addLog('Saved enrollment window for ' + (course ? course.course_code : 'course #' + courseId));
			return loadActivityLogs();
		});
	}

	function bindWindowActions() {
		if (!windowTableBody) return;

		windowTableBody.addEventListener('click', function (e) {
			const btn = e.target.closest('.save-window');
			if (!btn) return;
			const tr = btn.closest('tr');
			if (!tr) return;

			btn.disabled = true;
			btn.textContent = 'Saving...';
			saveWindowRow(tr)
				.then(function () {
					return loadCoursesAndSchedules();
				})
				.then(function () {
					notify('Enrollment window saved.');
				})
				.catch(function (err) {
					notify(err.message || 'Failed to save window.', 'error');
				})
				.finally(function () {
					btn.disabled = false;
					btn.textContent = 'Save';
				});
		});
	}

	function saveAllWindows() {
		const rows = Array.from(windowTableBody.querySelectorAll('tr[data-course-id]'));
		if (!rows.length) {
			notify('No windows to save.', 'warning');
			return;
		}

		saveAllWindowsBtn.disabled = true;
		saveAllWindowsBtn.textContent = 'Saving all...';

		rows
			.reduce(function (promise, row) {
				return promise.then(function () {
					return saveWindowRow(row);
				});
			}, Promise.resolve())
			.then(function () {
				return loadCoursesAndSchedules();
			})
			.then(function () {
				addLog('Saved all enrollment windows');
				return loadActivityLogs();
			})
			.then(function () {
				notify('All windows saved successfully.');
			})
			.catch(function (err) {
				notify(err.message || 'Failed to save all windows.', 'error');
			})
			.finally(function () {
				saveAllWindowsBtn.disabled = false;
				saveAllWindowsBtn.textContent = 'Save All Windows';
			});
	}

	function renderStudents() {
		if (!studentManagementBody) return;

		const yearVal = filterYear ? filterYear.value : 'ALL';
		const semVal = filterSemester ? filterSemester.value : 'ALL';
		const progVal = filterProgression ? filterProgression.value : 'ALL';

		const filtered = state.students.filter(function (s) {
			if (yearVal !== 'ALL' && String(s.year_level) !== String(yearVal)) return false;
			if (semVal !== 'ALL' && String(s.current_semester) !== String(semVal)) return false;
			if (progVal !== 'ALL' && String(s.progression_status || 'enrolled') !== String(progVal)) return false;
			return true;
		});

		if (!filtered.length) {
			studentManagementBody.innerHTML = '<tr><td colspan="7" class="empty-state">No students found for the selected filters.</td></tr>';
			return;
		}

		var progressionLabels = {
			'enrolled': 'Enrolled',
			'pending_progression': 'Pending Progression',
			'approved_progression': 'Approved'
		};

		var progressionClasses = {
			'enrolled': 'active',
			'pending_progression': 'pending',
			'approved_progression': 'active'
		};

		studentManagementBody.innerHTML = filtered
			.map(function (s) {
				const isActive = String(s.status).toLowerCase() === 'active';
				const progStatus = s.progression_status || 'enrolled';
				const progLabel = progressionLabels[progStatus] || progStatus;
				const progClass = progressionClasses[progStatus] || 'inactive';
				return (
					'<tr data-id="' + s.id + '" data-student-id="' + escapeHtml(s.student_id || '') + '">' +
					'<td><input type="checkbox" class="student-select"></td>' +
					'<td>' + escapeHtml([s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')) + '<br><small>' + escapeHtml(s.student_id || '') + '</small></td>' +
					'<td>' + escapeHtml(s.course_code || s.course_name || '-') + '</td>' +
					'<td>' + escapeHtml(String(s.year_level) + ' / ' + String(s.current_semester)) + '</td>' +
					'<td><span class="status-chip ' + (isActive ? 'active' : 'inactive') + '">' + escapeHtml(s.status || '') + '</span></td>' +
					'<td><span class="status-chip ' + progClass + '">' + escapeHtml(progLabel) + '</span></td>' +
					'<td>' +
					'<button type="button" class="btn-row-action activate">Activate</button> ' +
					'<button type="button" class="btn-row-action deactivate">Lock</button>' +
					(progStatus === 'pending_progression' ? ' <button type="button" class="btn-row-action approve-progress">Promote</button>' : '') +
					'</td>' +
					'</tr>'
				);
			})
			.join('');
	}

	function loadStudents() {
		if (!studentManagementBody) {
			return Promise.resolve();
		}
		return fetchJson('api/students_list.php').then(function (data) {
			state.students = Array.isArray(data.students) ? data.students : [];
			renderStudents();
		});
	}

	function setStudentStatus(studentNumericId, status) {
		return fetchJson('api/student_update_status.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: Number(studentNumericId), status: status }),
		}).then(function () {
			const student = state.students.find(function (s) {
				return Number(s.id) === Number(studentNumericId);
			});
			if (student) student.status = status;
			addLog('Updated student ' + (student ? student.student_id : studentNumericId) + ' to ' + status);
			return loadActivityLogs();
		});
	}

	function getSelectedStudentIds() {
		return Array.from(studentManagementBody.querySelectorAll('tr[data-id] .student-select:checked'))
			.map(function (checkbox) {
				const tr = checkbox.closest('tr');
				return tr ? Number(tr.getAttribute('data-id')) : 0;
			})
			.filter(function (id) {
				return id > 0;
			});
	}

	function bindStudentActions() {
		if (!studentManagementBody) return;

		if (filterYear) filterYear.addEventListener('change', renderStudents);
		if (filterSemester) filterSemester.addEventListener('change', renderStudents);
		if (filterProgression) filterProgression.addEventListener('change', renderStudents);

		if (selectAllStudents) {
			selectAllStudents.addEventListener('change', function () {
				const checked = !!selectAllStudents.checked;
				studentManagementBody.querySelectorAll('.student-select').forEach(function (cb) {
					cb.checked = checked;
				});
			});
		}

		if (batchApprove) {
			batchApprove.addEventListener('click', function () {
				const ids = getSelectedStudentIds();
				if (!ids.length) {
					notify('Select at least one student.', 'warning');
					return;
				}

				Promise.all(ids.map(function (id) { return setStudentStatus(id, 'active'); }))
					.then(function () {
						renderStudents();
						notify('Selected students set to active.');
					})
					.catch(function (err) {
						notify(err.message || 'Failed to update selected students.', 'error');
					});
			});
		}

		if (batchLock) {
			batchLock.addEventListener('click', function () {
				const ids = getSelectedStudentIds();
				if (!ids.length) {
					notify('Select at least one student.', 'warning');
					return;
				}

				Promise.all(ids.map(function (id) { return setStudentStatus(id, 'inactive'); }))
					.then(function () {
						renderStudents();
						notify('Selected students set to inactive.');
					})
					.catch(function (err) {
						notify(err.message || 'Failed to update selected students.', 'error');
					});
			});
		}

		studentManagementBody.addEventListener('click', function (e) {
			const btnActivate = e.target.closest('.btn-row-action.activate');
			const btnDeactivate = e.target.closest('.btn-row-action.deactivate');

			if (!btnActivate && !btnDeactivate) return;

			const tr = e.target.closest('tr[data-id]');
			if (!tr) return;
			const id = Number(tr.getAttribute('data-id'));

			const status = btnActivate ? 'active' : 'inactive';

			setStudentStatus(id, status)
				.then(function () {
					renderStudents();
					notify('Student status updated.');
				})
				.catch(function (err) {
					notify(err.message || 'Failed to update student status.', 'error');
				});
		});
	}

	function renderOverrideCourses() {
		if (!overrideCourse) return;
		const keep = overrideCourse.value;
		overrideCourse.innerHTML = state.courses
			.map(function (c) {
				return '<option value="' + c.id + '">' + escapeHtml(c.course_code + ' - ' + c.course_name) + '</option>';
			})
			.join('');

		if (keep && Array.from(overrideCourse.options).some(function (o) { return o.value === keep; })) {
			overrideCourse.value = keep;
		}
	}

	function bindOverrideAction() {
		if (!saveOverride) return;

		saveOverride.addEventListener('click', function () {
			const firstName = String(overrideFirstName ? overrideFirstName.value : '').trim();
			const middleName = String(overrideMiddleName ? overrideMiddleName.value : '').trim();
			const lastName = String(overrideLastName ? overrideLastName.value : '').trim();
			const email = String(overrideEmail ? overrideEmail.value : '').trim();
			const phone = String(overridePhone ? overridePhone.value : '').trim();
			const address = String(overrideAddress ? overrideAddress.value : '').trim();
			const reason = String(overrideReason ? overrideReason.value : '').trim();

			if (!firstName || !lastName) {
				notify('First name and last name are required.', 'warning');
				return;
			}

			if (!email) {
				notify('Email is required.', 'warning');
				return;
			}

			if (!reason) {
				notify('Please provide a transferee note.', 'warning');
				return;
			}

			const payload = {
				create_mode: 'transferee',
				first_name: firstName,
				middle_name: middleName,
				last_name: lastName,
				email: email,
				phone: phone,
				address: address,
				status: 'active',
				student_type: 'irregular',
				course_id: Number(overrideCourse.value),
				year_level: Number(overrideYear.value),
				current_semester: Number(overrideSemester.value),
				reason: reason,
			};

			saveOverride.disabled = true;
			saveOverride.textContent = 'Adding...';

			fetchJson('api/student_update.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
				.then(function (data) {
					addLog('Transferee added: ' + firstName + ' ' + lastName + ' (' + (data.student_id || 'new student') + ')');
				return loadActivityLogs().then(function () { return data; });
			})
			.then(function (data) {
					notify(data.message || 'Transferee student added successfully.');
					if (overrideFirstName) overrideFirstName.value = '';
					if (overrideMiddleName) overrideMiddleName.value = '';
					if (overrideLastName) overrideLastName.value = '';
					if (overrideEmail) overrideEmail.value = '';
					if (overridePhone) overridePhone.value = '';
					if (overrideAddress) overrideAddress.value = '';
					if (overrideReason) overrideReason.value = '';
					return loadStudents();
				})
				.catch(function (err) {
					notify(err.message || 'Failed to add transferee student.', 'error');
				})
				.finally(function () {
					saveOverride.disabled = false;
					saveOverride.textContent = 'Add Transferee Student';
				});
		});
	}

	function bindTopActions() {
		if (saveAllWindowsBtn) {
			saveAllWindowsBtn.addEventListener('click', saveAllWindows);
		}

		if (refreshWindowsBtn) {
			refreshWindowsBtn.addEventListener('click', function () {
				loadCoursesAndSchedules().catch(function (err) {
					notify(err.message || 'Failed to refresh windows.', 'error');
				});
			});
		}

		if (saveAdvancedSettingsBtn) {
			saveAdvancedSettingsBtn.addEventListener('click', function () {
				saveAdvancedSettings().catch(function (err) {
					notify(err.message || 'Failed to save advanced settings.', 'error');
				});
			});
		}

		// Semester end triggers
		var triggerEndSem1 = document.getElementById('triggerEndSem1');
		var triggerEndSem2 = document.getElementById('triggerEndSem2');

		if (triggerEndSem1) {
			triggerEndSem1.addEventListener('click', function () {
				confirmAction('This will send active 1st semester students to Enrollees under the Registered queue with Pending status while keeping their accounts active. Continue?', function () {
					triggerEndSem1.disabled = true;
					triggerEndSem1.textContent = 'Processing...';
					fetchJson('api/student_year_progression.php', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ action: 'trigger_semester_end', semester: 1 }),
					})
						.then(function (data) {
							addLog('Processed 1st semester progression: ' + (data.affected || 0) + ' student(s) marked pending');
							return loadActivityLogs().then(function () { return data; });
						})
						.then(function (data) {
							notify(data.message || 'Done.', 'success');
							return loadStudents();
						})
						.catch(function (err) {
							notify(err.message || 'Failed to process semester.', 'error');
						})
						.finally(function () {
							triggerEndSem1.disabled = false;
							triggerEndSem1.textContent = '1st Semester';
						});
				}, triggerEndSem1);
			});
		}

		if (triggerEndSem2) {
			triggerEndSem2.addEventListener('click', function () {
				confirmAction('This will send active 2nd semester students to Enrollees under the Registered queue with Pending status while keeping their accounts active. Continue?', function () {
					triggerEndSem2.disabled = true;
					triggerEndSem2.textContent = 'Processing...';
					fetchJson('api/student_year_progression.php', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ action: 'trigger_semester_end', semester: 2 }),
					})
						.then(function (data) {
							addLog('Processed 2nd semester progression: ' + (data.affected || 0) + ' student(s) marked pending');
							return loadActivityLogs().then(function () { return data; });
						})
						.then(function (data) {
							notify(data.message || 'Done.', 'success');
							return loadStudents();
						})
						.catch(function (err) {
							notify(err.message || 'Failed to process semester.', 'error');
						})
						.finally(function () {
							triggerEndSem2.disabled = false;
							triggerEndSem2.textContent = '2nd Semester';
						});
				}, triggerEndSem2);
			});
		}
	}

	function init() {
		bindTabs();
		bindLogPagination();
		bindTopActions();
		bindWindowActions();
		bindStudentActions();
		bindOverrideAction();

		Promise.all([
			loadAdvancedSettings(),
			loadCoursesAndSchedules(),
			loadStudents(),
			loadActivityLogs(),
		]).catch(function (err) {
			notify(err.message || 'Failed to load enrollment settings data.', 'error');
		});
	}

	init();
});
