async function approveRequest(id, username) {
    const confirmed = await UI.confirm(
        `Approve librarian access for ${username}? They will gain full admin privileges after signing in again.`,
        { title: 'Approve access', confirmText: 'Approve', cancelText: 'Cancel' }
    );
    if (!confirmed) return;

    try {
        const data = await API.post(`/auth/admin-requests/${id}/approve`, {});
        UI.success(data.message);
        loadRequests(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

async function rejectRequest(id, username) {
    const confirmed = await UI.confirm(
        `Decline librarian access for ${username}? They will remain a standard library member.`,
        { title: 'Decline access', confirmText: 'Decline', cancelText: 'Cancel', danger: true }
    );
    if (!confirmed) return;

    try {
        const data = await API.post(`/auth/admin-requests/${id}/reject`, {});
        UI.success(data.message);
        loadRequests(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

function renderRequests(requests) {
    const tbody = document.getElementById('requests-body');

    if (!requests.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No pending librarian access requests right now.</div></td></tr>';
        return;
    }

    tbody.innerHTML = requests.map((req) => `
        <tr>
            <td><strong>${req.username}</strong></td>
            <td>${req.email}</td>
            <td>${UI.formatDate(req.created_at)}</td>
            <td>${req.message || ''}</td>
            <td><span class="status-pill ${req.status}">${req.status}</span></td>
            <td>
                <div class="row-actions">
                    <button class="btn btn-primary approve-btn" data-id="${req.id}" data-name="${req.username}" style="padding:0.35rem 0.75rem; font-size:0.8rem;">Approve</button>
                    <button class="btn btn-danger reject-btn" data-id="${req.id}" data-name="${req.username}" style="padding:0.35rem 0.75rem; font-size:0.8rem;">Decline</button>
                </div>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.approve-btn').forEach((btn) => {
        btn.addEventListener('click', () => approveRequest(btn.dataset.id, btn.dataset.name));
    });

    tbody.querySelectorAll('.reject-btn').forEach((btn) => {
        btn.addEventListener('click', () => rejectRequest(btn.dataset.id, btn.dataset.name));
    });
}

async function loadRequests(page = UI.getPage()) {
    UI.setPageParam(page);
    const query = UI.buildApiQuery({ page });
    const data = await API.get(`/auth/admin-requests${query}`);
    renderRequests(data.requests);

    if (!data.requests.length && page > 1) {
        loadRequests(page - 1);
        return;
    }

    UI.renderPagination('pagination', data.pagination, loadRequests);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth({ admin: true })) return;
    loadRequests().catch((err) => UI.handleError(err, 'Could not load access requests.'));
});
