async function deleteBook(id) {
    const confirmed = await UI.confirm(
        'This will permanently remove the book from the catalog.',
        { title: 'Delete book?', confirmText: 'Delete', cancelText: 'Cancel', danger: true }
    );
    if (!confirmed) return;

    try {
        const data = await API.post(`/books/delete/${id}`, {});
        UI.success(data.message);
        loadBooks(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

function renderBooks(books) {
    const tbody = document.getElementById('books-table-body');

    if (!books.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No books found.</div></td></tr>';
        return;
    }

    tbody.innerHTML = books.map((book) => `
        <tr>
            <td style="font-weight:600;">${book.title}</td>
            <td><span class="isbn-tag">${book.isbn}</span></td>
            <td>${book.author_name}</td>
            <td><span class="badge badge-${UI.badgeClass(book.status)}">${book.status}</span></td>
            <td>
                <div class="row-actions">
                    <a href="/books/edit.html?id=${book.id}" class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Edit</a>
                    <button class="btn btn-danger delete-btn" data-id="${book.id}" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => deleteBook(btn.dataset.id));
    });
}

async function loadBooks(page = UI.getPage()) {
    UI.setPageParam(page);

    try {
        const query = UI.buildApiQuery({ page });
        const data = await API.get(`/books/admin-dashboard${query}`);
        renderBooks(data.books);
        UI.renderPagination('pagination', data.pagination, loadBooks);
    } catch (err) {
        UI.handleError(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth({ admin: true })) return;
    loadBooks();
});
