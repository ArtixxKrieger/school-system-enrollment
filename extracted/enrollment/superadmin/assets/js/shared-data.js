// Replace Actual Database
const SHARED_DATA_KEY = 'thesis2_shared_data';
const USE_LOCAL_STORAGE_DEMO = false;
const CLEAR_LOCAL_STORAGE_ON_INIT = false;
const USE_DATABASE = true;

const SharedData = {
    // Academic Calendar & Curriculum Schedules
    schedules: [],
    
    // Students Data
    students: [],
    approvedStudentCount: 0, // Track approved students for ID generation
    
    // Enrollees Data
    enrollees: [],
    
    // Per–course-code stats: { CODE: { enrolled, capacity, id, course_name } }
    courses: {},
    
    // Statistics
    statistics: {
        totalStudents: 0,
        totalEnrollees: 0,
        totalEnrolled: 0,
        totalCourses: 0,
        totalFaculty: 0,
        pendingEnrollments: 0,
        totalCapacity: 0,
    },

    currentUser: null,
    currentUserRole: 'staff',
    currentUserName: '',
    currentUserId: null,

    normalizeRole(role) {
        return String(role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    /** @type {Array<{id:number,course_code:string,course_name:string,description:string,max_slots:number}>} */
    courseCatalog: [],

    // DB load state (for pages that need to render after fetch)
    ready: false,
    
    init() {
        this.ready = false;
        // Wipe persisted demo data so "existing data" doesn't show up.
        if (CLEAR_LOCAL_STORAGE_ON_INIT && typeof localStorage !== 'undefined') {
            try {
                localStorage.removeItem(SHARED_DATA_KEY);
            } catch (e) {
                console.error('Error clearing shared data:', e);
            }
        }

        // Optional: allow loading from localStorage, but disabled by default.
        if (USE_LOCAL_STORAGE_DEMO && typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(SHARED_DATA_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    Object.assign(this, data);
                } catch (e) {
                    console.error('Error loading shared data:', e);
                }
            }
        }

        if (typeof window !== 'undefined' && window.AppUser) {
            this.currentUser = window.AppUser;
            this.currentUserRole = this.normalizeRole(window.AppUser.role || window.AppUser.userRole || 'staff');
            this.currentUserName = String(window.AppUser.fullName || window.AppUser.name || '').trim();
            this.currentUserId = window.AppUser.id || window.AppUser.userId || null;
        }

        this.students = [];
        this.enrollees = [];
        this.pendingEnrolleeTotal = 0;
        this.totalEnrolleesCount = 0;
        this.approvedStudentCount = 0;

        Object.keys(this.courses).forEach((code) => {
            if (this.courses[code]) this.courses[code].enrolled = 0;
        });

        // Reset statistics (updateStatistics will compute totals again).
        this.statistics.totalStudents = 0;
        this.statistics.totalEnrollees = 0;
        this.statistics.totalEnrolled = 0;
        this.statistics.pendingEnrollments = 0;

        const boot = async () => {
            if (USE_DATABASE) {
                await this.refreshFromDatabase();
            }

            this.updateStatistics();
            this.ready = true;
            this.notifyListeners('ready', {});
        };

        boot();
    },

    /**
     * Normalize API student row for Enrolled / Courses pages (legacy field names).
     */
    _normalizeStudent(raw) {
        if (!raw || typeof raw !== 'object') return raw;
        const first = raw.first_name || '';
        const mid = raw.middle_name || '';
        const last = raw.last_name || '';
        const name = [first, mid, last].filter(Boolean).join(' ').trim() || 'Student';
        const courseCode = (raw.course_code || '').trim();
        const courseName = (raw.course_name || '').trim();
        const dbStatus = (raw.status || 'active').toLowerCase();
        const isActiveEnrolled = dbStatus === 'active';
        let enrollmentDate = '';
        if (raw.enrollment_date) {
            const d = new Date(raw.enrollment_date);
            enrollmentDate = Number.isNaN(d.getTime())
                ? String(raw.enrollment_date)
                : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
        return {
            ...raw,
            name,
            course: courseCode,
            course_name: courseName,
            year_level: parseInt(raw.year_level, 10) || 1,
            yearLevel: parseInt(raw.year_level, 10) || 1,
            current_semester: parseInt(raw.current_semester, 10) || 1,
            id: raw.student_id || String(raw.id),
            numericId: parseInt(raw.id, 10) || 0,
            dbStatus,
            status: isActiveEnrolled ? 'enrolled' : dbStatus,
            enrollmentDate,
        };
    },

    _applyCourseCatalog(catalog) {
        this.courseCatalog = Array.isArray(catalog) ? catalog : [];
        this.courses = {};
        this.courseCatalog.forEach((c) => {
            const code = c.course_code;
            if (!code) return;
            this.courses[code] = {
                enrolled: 0,
                capacity: c.max_slots > 0 ? c.max_slots : 60,
                id: c.id,
                course_name: c.course_name,
                description: c.description || '',
            };
        });
    },

    async refreshFromDatabase() {
        try {
            // Skip admin-only API calls for students
            if (this.currentUserRole === 'student') {
                this.pendingEnrolleeTotal = 0;
                this.totalEnrolleesCount = 0;
                this.enrollees = [];
                this.students = [];
                this._applyCourseCatalog([]);
                return;
            }
            
            const [pendingRes, allEnrolleesRes, studentsRes, coursesRes] = await Promise.all([
                this._fetchJSON('api/enrollees_list.php?page=1&limit=1&status=pre-registered'),
                this._fetchJSON('api/enrollees_list.php?page=1&limit=1&status=all'),
                this._fetchJSON('api/students_list.php'),
                this._fetchJSON('api/courses_list.php'),
            ]);
            this.pendingEnrolleeTotal =
                pendingRes.pagination && typeof pendingRes.pagination.total === 'number'
                    ? pendingRes.pagination.total
                    : 0;
            this.totalEnrolleesCount =
                allEnrolleesRes.pagination && typeof allEnrolleesRes.pagination.total === 'number'
                    ? allEnrolleesRes.pagination.total
                    : 0;
            this.enrollees = [];
            const rawStudents = Array.isArray(studentsRes.students) ? studentsRes.students : [];
            this.students = rawStudents.map((s) => this._normalizeStudent(s));
            this._applyCourseCatalog(coursesRes.courses);
        } catch (e) {
            console.error('SharedData DB load failed:', e);
            this.enrollees = [];
            this.students = [];
            this.courseCatalog = [];
            this.courses = {};
            this.pendingEnrolleeTotal = 0;
            this.totalEnrolleesCount = 0;
        }
    },

    async refreshStudents() {
        await this.refreshFromDatabase();
        this.updateStatistics();
        this.notifyListeners('studentsUpdated', {});
    },
    
    /**
     * Save data to localStorage
     */
    save() {
        // Disabled: no persistence when there's no database.
        if (!USE_LOCAL_STORAGE_DEMO) return;
        if (typeof localStorage === 'undefined') return;

        try {
            localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(this));
        } catch (e) {
            console.error('Error saving shared data:', e);
        }
    },
    
    /**
     * Add schedule from Academic Calendar
     */
    addSchedule(schedule) {
        this.schedules.push({
            ...schedule,
            id: Date.now(),
            createdAt: new Date().toISOString()
        });
        this.save();
        this.notifyListeners('scheduleAdded', schedule);
    },
    
    /**
     * Approve enrollee - Remove PRE, generate new ID, move to students
     */
    async approveEnrollee(enrolleeId) {
        await this._fetchJSON('api/enrollees_approve.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ enrollee_id: enrolleeId, admin_id: 1 }),
        });
        await this.refreshStudents();
        this.notifyListeners('enrolleeApproved', { enrolleeId });
        return true;
    },

    /**
     * Create a pending enrollee (PRE) row.
     */
    async addEnrollee(enrollee) {
        const res = await this._fetchJSON('api/enrollees_create.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(enrollee)
        });

        if (!res.enrollee) throw new Error('Failed to create enrollee');
        this.enrollees = Array.isArray(this.enrollees) ? this.enrollees : [];
        this.enrollees.push(res.enrollee);
        this.updateStatistics();
        return res.enrollee;
    },

    /**
     * Reject an enrollee (delete PRE row).
     */
    async rejectEnrollee(enrolleeId) {
        const res = await this._fetchJSON('api/enrollees_reject.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ enrolleeId })
        });

        if (!res.ok) throw new Error('Failed to reject enrollee');
        this.enrollees = (Array.isArray(this.enrollees) ? this.enrollees : []).filter(e => e.id !== enrolleeId);
        this.updateStatistics();
        return true;
    },

    /**
     * Small fetch wrapper for JSON endpoints.
     */
    async _fetchJSON(url, options = {}) {
        const res = await fetch(url, options);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            const details = data && (data.error || data.details) ? (data.error || data.details) : `Request failed (${res.status})`;
            throw new Error(details);
        }

        if (!data || data.ok === false) {
            const details = data && (data.error || data.details) ? (data.error || data.details) : `Request failed: ${url}`;
            throw new Error(details);
        }
        return data;
    },
    
    /**
     * Update statistics
     */
    updateStatistics() {
        this.statistics.totalStudents = this.students.length;
        this.statistics.totalEnrollees = this.totalEnrolleesCount;
        this.statistics.totalEnrolled = this.students.filter(
            (s) => s.dbStatus === 'active' || s.status === 'enrolled'
        ).length;
        this.statistics.pendingEnrollments = this.pendingEnrolleeTotal;
        this.statistics.totalCourses = this.courseCatalog.length;
        this.statistics.totalCapacity = this.courseCatalog.reduce(
            (sum, c) => sum + (c.max_slots > 0 ? c.max_slots : 60),
            0
        );

        Object.keys(this.courses).forEach((code) => {
            if (!this.courses[code]) return;
            this.courses[code].enrolled = this.students.filter(
                (s) => s.course === code && (s.dbStatus === 'active' || s.status === 'enrolled')
            ).length;
        });
    },
    
    /**
     * Get statistics for dashboard (role-based)
     */
    getDashboardStats(userRole) {
        const stats = {
            totalStudents: this.statistics.totalStudents,
            totalEnrollees: this.statistics.totalEnrollees,
            totalEnrolled: this.statistics.totalEnrolled,
            pendingEnrollments: this.statistics.pendingEnrollments,
            activeCourses: this.statistics.totalCourses,
            totalFaculty: this.statistics.totalFaculty
        };
        
        // Role-based filtering
        if (userRole === 'student') {
            // Students only see their own data
            return {
                myEnrollments: 0,
                mySchedule: 0,
                announcements: 0
            };
        } else if (userRole === 'professor') {
            // Professors see their classes
            return {
                myClasses: 0,
                myStudents: 0,
                schedule: 0
            };
        } else if (userRole === 'staff') {
            // Staff see enrollment data
            return {
                pendingEnrollments: stats.pendingEnrollments,
                enrolledStudents: stats.totalEnrolled,
                schedules: this.schedules.length
            };
        }
        
        // Admin/Super Admin see all
        return stats;
    },
    
    /**
     * Event listeners for data changes
     */
    listeners: {},
    
    /**
     * Subscribe to data changes
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    /**
     * Notify listeners of changes
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in listener:', e);
                }
            });
        }
    }
};

// Initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        SharedData.init();
    });
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.SharedData = SharedData;
}

// =====================================================
// PERMISSION HELPER — available globally
// =====================================================
window.UserCan = (function () {
    function _perms() {
        return (window.AppUser && window.AppUser.permissions) || {};
    }
    function _role() {
        return String((window.AppUser && window.AppUser.role) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    function check(module, action) {
        if (_role() === 'superadmin') return true;
        var p = _perms();
        return !!(p[module] && p[module][action]);
    }
    return {
        view:    function (m) { return check(m, 'view'); },
        create:  function (m) { return check(m, 'create'); },
        edit:    function (m) { return check(m, 'edit'); },
        del:     function (m) { return check(m, 'delete'); },
        approve: function (m) { return check(m, 'approve'); },
        any:     function (m, action) { return check(m, action); },
        role:    _role
    };
})();
