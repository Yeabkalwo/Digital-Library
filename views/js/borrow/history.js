async function returnBook(recordId) {
    try {
        const data = await API.post(`/borrow/return/${recordId}`, {});
        UI.success(data.message);
        loadHistory(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

function renderRecords(records) {
    const tbody = document.getElementById('history-body');

    if (!records.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">You currently have no checkout history.</div></td></tr>';
        return;
    }

    tbody.innerHTML = records.map((rec) => {
        const action = rec.status === 'borrowed'
            ? `<button class="btn btn-primary return-btn" data-id="${rec.id}" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Return Book</button>`
            : '<span class="badge badge-available">Returned</span>';

        return `
            <tr>
                <td style="font-weight:600;">${rec.book_title}</td>
                <td><span class="isbn-tag">${rec.book_isbn}</span></td>
                <td>${UI.formatDate(rec.borrow_date)}</td>
                <td>${UI.formatDate(rec.return_date)}</td>
                <td><span class="badge badge-${UI.badgeClass(rec.status)}">${rec.status}</span></td>
                <td>${action}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.return-btn').forEach((btn) => {
        btn.addEventListener('click', () => returnBook(btn.dataset.id));
    });
}

async function loadHistory(page = UI.getPage()) {
    UI.setPageParam(page);
    const query = UI.buildApiQuery({ page });
    const data = await API.get(`/borrow/history${query}`);
    renderRecords(data.records);
    UI.renderPagination('pagination', data.pagination, loadHistory);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    loadHistory().catch((err) => UI.handleError(err));
});
