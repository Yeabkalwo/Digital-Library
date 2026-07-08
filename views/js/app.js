const Auth = {
    getToken() {
        return localStorage.getItem('token');
    },

    setSession(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    },

    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    isLoggedIn() {
        return Boolean(this.getToken());
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }
};

const API = {
    baseUrl: '/api',

    async request(url, options = {}) {
        const headers = { ...(options.headers || {}) };
        const token = Auth.getToken();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(`${this.baseUrl}${url}`, { ...options, headers });
        } catch {
            throw new Error('Network error. Check your connection and try again.');
        }

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (response.status === 401) {
            Auth.clearSession();
            if (!window.location.pathname.includes('login')) {
                UI.flashRedirect('/auth/login.html', data.error || 'Your session expired. Please sign in again.', 'error');
            }
            throw new Error(data.error || 'Your session expired. Please sign in again.');
        }

        if (response.status === 403) {
            throw new Error(data.error || 'You do not have permission to perform this action.');
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `Request failed (${response.status}).`);
        }

        return data;
    },

    get(url) {
        return this.request(url);
    },

    post(url, body) {
        return this.request(url, { method: 'POST', body });
    }
};

const UI = {
    toastIcons: {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    },

    ensureToastContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
    },

    toast(message, type = 'success', options = {}) {
        if (!message) return;

        this.ensureToastContainer();
        const container = document.getElementById('toast-container');
        const duration = options.duration ?? (type === 'error' ? 7000 : 5000);

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `
            <span class="toast-icon">${this.toastIcons[type] || 'ℹ'}</span>
            <div class="toast-body">${message}</div>
            <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
        `;

        const dismiss = () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 200);
        };

        toast.querySelector('.toast-close').addEventListener('click', dismiss);
        container.appendChild(toast);

        if (options.autoDismiss !== false) {
            setTimeout(dismiss, duration);
        }

        return dismiss;
    },

    success(message, options) {
        this.toast(message, 'success', options);
    },

    error(message, options) {
        this.toast(message, 'error', options);
    },

    info(message, options) {
        this.toast(message, 'info', options);
    },

    warning(message, options) {
        this.toast(message, 'warning', options);
    },

    handleError(err, fallback = 'Something went wrong. Please try again.') {
        this.error(err.message || fallback);
    },

    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-dialog" role="dialog" aria-modal="true">
                    <h3>${options.title || 'Please confirm'}</h3>
                    <p class="modal-message"></p>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary modal-cancel">${options.cancelText || 'Cancel'}</button>
                        <button type="button" class="btn ${options.danger ? 'btn-danger' : 'btn-primary'} modal-confirm">${options.confirmText || 'Confirm'}</button>
                    </div>
                </div>
            `;
            overlay.querySelector('.modal-message').textContent = message;

            const close = (result) => {
                overlay.remove();
                resolve(result);
            };

            overlay.querySelector('.modal-cancel').addEventListener('click', () => close(false));
            overlay.querySelector('.modal-confirm').addEventListener('click', () => close(true));
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) close(false);
            });

            document.body.appendChild(overlay);
            overlay.querySelector('.modal-confirm').focus();
        });
    },

    setLoading(button, isLoading) {
        if (!button) return;
        button.disabled = isLoading;
        button.classList.toggle('is-loading', isLoading);
    },

    flashRedirect(url, message, type = 'info') {
        sessionStorage.setItem('flash', JSON.stringify({ message, type }));
        window.location.href = url;
    },

    showFlash() {
        const raw = sessionStorage.getItem('flash');
        if (!raw) return;
        sessionStorage.removeItem('flash');
        try {
            const { message, type } = JSON.parse(raw);
            this.toast(message, type || 'info');
        } catch {
            // Ignore malformed flash data.
        }
    },

    badgeClass(status) {
        if (status === 'available') return 'available';
        if (status === 'borrowed') return 'checked-out';
        return 'maintenance';
    },

    formatDate(value) {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
    },

    getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name) || '';
    },

    getPage() {
        return Math.max(1, parseInt(this.getQueryParam('page'), 10) || 1);
    },

    setPageParam(page) {
        const url = new URL(window.location.href);
        if (page <= 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        window.history.replaceState({}, '', url);
    },

    buildApiQuery(params = {}) {
        const query = new URLSearchParams();
        const page = params.page ?? this.getPage();

        if (page > 1) query.set('page', page);
        if (params.search) query.set('search', params.search);
        if (params.status) query.set('status', params.status);
        if (params.limit) query.set('limit', params.limit);

        const qs = query.toString();
        return qs ? `?${qs}` : '';
    },

    renderPagination(containerId, pagination, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container || !pagination) return;

        const { page, totalPages, total, from, to, hasPrev, hasNext } = pagination;

        if (total === 0) {
            container.innerHTML = '';
            return;
        }

        const pageButtons = [];
        for (let i = 1; i <= totalPages; i++) {
            const showPage = i === 1 || i === totalPages || Math.abs(i - page) <= 1;
            const showEllipsis = !showPage && (i === page - 2 || i === page + 2);

            if (showPage) {
                pageButtons.push(`<button type="button" class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`);
            } else if (showEllipsis) {
                pageButtons.push('<span class="pagination-ellipsis">…</span>');
            }
        }

        container.innerHTML = `
            <div class="pagination-bar">
                <p class="pagination-summary">Showing ${from}–${to} of ${total}</p>
                <div class="pagination-controls">
                    <button type="button" class="btn btn-secondary pagination-nav" data-page="${page - 1}" ${hasPrev ? '' : 'disabled'}>Previous</button>
                    ${pageButtons.join('')}
                    <button type="button" class="btn btn-secondary pagination-nav" data-page="${page + 1}" ${hasNext ? '' : 'disabled'}>Next</button>
                </div>
            </div>
        `;

        container.querySelectorAll('[data-page]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const nextPage = Number(btn.dataset.page);
                if (btn.disabled || nextPage < 1 || nextPage > totalPages) return;
                onPageChange(nextPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
};

function renderNav() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    const user = Auth.getUser();
    let html = '<li><a href="/books/index.html" class="nav-link">Books Catalog</a></li>';

    if (user) {
        html += '<li><a href="/authors/index.html" class="nav-link">Author Index</a></li>';
        if (user.role === 'admin') {
            html += '<li><a href="/books/admin-dashboard.html" class="nav-link" style="color:#facc15;">Admin Panel</a></li>';
            html += '<li><a href="/admin/user-requests.html" class="nav-link">Access Requests</a></li>';
            html += '<li><a href="/borrow/admin-records.html" class="nav-link">Audit Logs</a></li>';
        } else {
            html += '<li><a href="/borrow/history.html" class="nav-link">My Borrows</a></li>';
        }
        html += `<li><span class="nav-link">Hello, <strong>${user.username}</strong> (${user.role})</span></li>`;
        html += '<li><button id="logout-btn" class="btn btn-secondary" style="padding:0.4rem 0.8rem;">Logout</button></li>';
    } else {
        html += '<li><a href="/auth/login.html" class="nav-link">Sign In</a></li>';
        html += '<li><a href="/auth/register.html" class="nav-link nav-auth-btn">Register</a></li>';
    }

    navMenu.innerHTML = html;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await API.post('/auth/logout', {});
            } catch {
                // Clear local session even if server call fails.
            }
            Auth.clearSession();
            UI.flashRedirect('/auth/login.html', 'You have been signed out.', 'success');
        });
    }
}

function requireAuth(options = {}) {
    if (!Auth.isLoggedIn()) {
        UI.flashRedirect('/auth/login.html', 'Please sign in to continue.', 'error');
        return false;
    }
    if (options.admin && !Auth.isAdmin()) {
        UI.flashRedirect('/books/index.html', 'Administrator access is required for that page.', 'error');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    UI.showFlash();
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
