const notificationState = {
    alerts: [],
    reports: [],
    alertPage: 1,
    reportPage: 1,
    pageSize: 4
};

document.addEventListener('DOMContentLoaded', function () {
    const submitButton = document.getElementById('submitReport');
    const clearButton = document.getElementById('clearReport');

    if (submitButton) {
        submitButton.addEventListener('click', submitNotificationReport);
    }

    if (clearButton) {
        clearButton.addEventListener('click', clearReportForm);
    }

    loadSystemAlerts();
    loadNotificationReports();
});

function loadSystemAlerts() {
    const alertList = document.getElementById('systemAlertList');
    if (!alertList) {
        return;
    }

    alertList.innerHTML = '<div class="no-reports">Loading security alerts...</div>';

    fetch('api/system_notifications.php')
        .then(response => response.json().catch(() => ({})))
        .then(data => {
            if (!data.ok || !Array.isArray(data.alerts)) {
                throw new Error(data.error || 'Unable to load system alerts.');
            }

            notificationState.alerts = data.alerts.slice();
            renderSystemAlerts();
        })
        .catch(() => {
            alertList.innerHTML = '<div class="no-reports">Unable to load system alerts right now.</div>';
            const pagination = document.getElementById('systemAlertPagination');
            if (pagination) pagination.innerHTML = '';
        });
}

function renderSystemAlerts() {
    const alertList = document.getElementById('systemAlertList');
    const pagination = document.getElementById('systemAlertPagination');
    if (!alertList) {
        return;
    }

    renderPaginatedItems({
        items: notificationState.alerts,
        page: notificationState.alertPage,
        listElement: alertList,
        paginationElement: pagination,
        emptyMessage: 'No security alerts recorded.',
        onPageChange: function (page) {
            notificationState.alertPage = page;
            renderSystemAlerts();
        },
        renderItem: function (alert) {
            const item = document.createElement('div');
            item.className = 'report-item';
            item.innerHTML = `
                <div class="report-summary">
                    <div>
                        <h4>${escapeHtml(formatAlertTitle(alert.action))}</h4>
                        <p class="report-meta">
                            <span>Security Alert</span>
                            <span>${new Date(alert.created_at).toLocaleString()}</span>
                        </p>
                    </div>
                </div>
                <p class="report-details">${escapeHtml(alert.description || 'System alert')}</p>
            `;
            return item;
        }
    });
}

function formatAlertTitle(action) {
    switch (String(action || '')) {
        case 'login_lockout':
            return 'Repeated Failed Login Attempts';
        case 'password_reset_email_failed':
            return 'Password Reset Email Delivery Failed';
        default:
            return 'System Security Alert';
    }
}

function loadNotificationReports() {
    const reportList = document.getElementById('reportList');
    if (reportList) {
        reportList.innerHTML = '<div class="no-reports">Loading shared notification reports...</div>';
    }

    fetch('api/notification_reports.php')
        .then(response => response.json().catch(() => ({})))
        .then(data => {
            if (!data.ok || !Array.isArray(data.reports)) {
                throw new Error(data.error || 'Unable to load notification reports.');
            }

            notificationState.reports = data.reports.slice();
            renderNotificationReports();
        })
        .catch(() => {
            if (reportList) {
                reportList.innerHTML = '<div class="no-reports">Unable to load shared reports right now.</div>';
            }
            const pagination = document.getElementById('reportPagination');
            if (pagination) pagination.innerHTML = '';
        });
}

function renderNotificationReports() {
    const reportList = document.getElementById('reportList');
    const pagination = document.getElementById('reportPagination');
    if (!reportList) {
        return;
    }

    renderPaginatedItems({
        items: notificationState.reports,
        page: notificationState.reportPage,
        listElement: reportList,
        paginationElement: pagination,
        emptyMessage: 'No reports have been submitted yet.',
        onPageChange: function (page) {
            notificationState.reportPage = page;
            renderNotificationReports();
        },
        renderItem: function (report) {
            const item = document.createElement('div');
            item.className = 'report-item';
            item.innerHTML = `
                <div class="report-summary">
                    <div>
                        <h4>${escapeHtml(report.title)}</h4>
                        <p class="report-meta">
                            <span>${escapeHtml(report.categoryLabel)}</span>
                            <span>${escapeHtml(report.submittedBy || 'System User')}</span>
                            <span>${new Date(report.submittedAt).toLocaleString()}</span>
                        </p>
                    </div>
                </div>
                <p class="report-details">${escapeHtml(report.details)}</p>
            `;
            return item;
        }
    });
}

function renderPaginatedItems(options) {
    const items = Array.isArray(options.items) ? options.items : [];
    const listElement = options.listElement;
    const paginationElement = options.paginationElement;
    const emptyMessage = options.emptyMessage || 'No records found.';
    const totalPages = Math.max(1, Math.ceil(items.length / notificationState.pageSize));
    const currentPage = Math.min(Math.max(Number(options.page) || 1, 1), totalPages);
    const startIndex = (currentPage - 1) * notificationState.pageSize;
    const visibleItems = items.slice(startIndex, startIndex + notificationState.pageSize);

    listElement.innerHTML = '';

    if (!items.length) {
        listElement.innerHTML = `<div class="no-reports">${escapeHtml(emptyMessage)}</div>`;
        if (paginationElement) paginationElement.innerHTML = '';
        return;
    }

    visibleItems.forEach(function (item) {
        listElement.appendChild(options.renderItem(item));
    });

    if (!paginationElement) {
        return;
    }

    const status = `Page ${currentPage} of ${totalPages}`;
    paginationElement.innerHTML = `
        <span class="pagination-status">${escapeHtml(status)}</span>
        <div class="pagination-buttons">
            <button type="button" class="pagination-btn prev-btn" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
            <button type="button" class="pagination-btn next-btn" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
    `;

    const prevBtn = paginationElement.querySelector('.prev-btn');
    const nextBtn = paginationElement.querySelector('.next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            if (currentPage > 1) options.onPageChange(currentPage - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            if (currentPage < totalPages) options.onPageChange(currentPage + 1);
        });
    }
}

function submitNotificationReport() {
    const titleInput = document.getElementById('reportTitle');
    const categorySelect = document.getElementById('reportCategory');
    const detailsInput = document.getElementById('reportDetails');

    if (!titleInput || !categorySelect || !detailsInput) {
        return;
    }

    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const details = detailsInput.value.trim();

    if (!title || !details) {
        showAlert('Please enter both a title and description for the report.', 'error');
        return;
    }

    fetch('api/notification_reports.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title,
            category: category,
            details: details
        })
    })
        .then(response => response.json().catch(() => ({})))
        .then(data => {
            if (!data.ok) {
                throw new Error(data.error || 'Failed to submit the report.');
            }

            notificationState.reportPage = 1;
            showAlert(data.message || 'Report delivered to the admin team.', 'success');
            clearReportForm();
            loadNotificationReports();
        })
        .catch(error => {
            showAlert(error.message || 'Failed to submit the report.', 'error');
        });
}

function clearReportForm(event) {
    if (event) {
        event.preventDefault();
    }

    const titleInput = document.getElementById('reportTitle');
    const detailsInput = document.getElementById('reportDetails');
    const categorySelect = document.getElementById('reportCategory');

    if (titleInput) {
        titleInput.value = '';
    }
    if (detailsInput) {
        detailsInput.value = '';
    }
    if (categorySelect) {
        categorySelect.value = 'issue';
    }
}

function showAlert(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification message-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 3200);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
