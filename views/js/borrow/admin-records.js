async function forceReturn(recordId) {
    try {
        const data = await API.post(`/borrow/return/${recordId}`, {});
        UI.success(data.message);
        loadRecords(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

function renderRecords(records) {
    const tbody = document.getElementById('records-body');

    if (!records.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No transactional records found.</div></td></tr>';
        return;
    }

    tbody.innerHTML = records.map((rec) => {
        const action = rec.status === 'borrowed'
            ? `<button class="btn btn-danger force-return-btn" data-id="${rec.id}" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Force Return</button>`
            : '<span class="badge badge-available">Settled</span>';

        return `
            <tr>
                <td style="font-weight:600;">${rec.user_username}</td>
                <td>${rec.book_title}</td>
                <td>${UI.formatDate(rec.borrow_date)}</td>
                <td>${UI.formatDate(rec.return_date)}</td>
                <td><span class="badge badge-${UI.badgeClass(rec.status)}">${rec.status}</span></td>
                <td>${action}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.force-return-btn').forEach((btn) => {
        btn.addEventListener('click', () => forceReturn(btn.dataset.id));
    });
}

async function loadRecords(page = UI.getPage()) {
    UI.setPageParam(page);
    const query = UI.buildApiQuery({ page });
    const data = await API.get(`/borrow/all-records${query}`);
    renderRecords(data.records);
    UI.renderPagination('pagination', data.pagination, loadRecords);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth({ admin: true })) return;
    loadRecords().catch((err) => UI.handleError(err));
});
