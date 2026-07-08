async function deleteAuthor(id) {
    const confirmed = await UI.confirm(
        'Erasing this author will also remove all books linked to them. This cannot be undone.',
        { title: 'Delete author?', confirmText: 'Delete', cancelText: 'Cancel', danger: true }
    );
    if (!confirmed) return;

    try {
        const data = await API.post(`/authors/delete/${id}`, {});
        UI.success(data.message);
        loadAuthors(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

function renderAuthors(authors) {
    const grid = document.getElementById('authors-grid');
    const user = Auth.getUser();
    const isAdmin = user && user.role === 'admin';

    if (!authors.length) {
        grid.innerHTML = '<div class="empty-state">No authors found.</div>';
        return;
    }

    grid.innerHTML = authors.map((author) => {
        const adminActions = isAdmin ? `
            <div class="row-actions">
                <a href="/authors/edit.html?id=${author.id}" class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Edit</a>
                <button class="btn btn-danger delete-btn" data-id="${author.id}" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Delete</button>
            </div>
        ` : '';

        return `
            <div class="book-card" style="justify-content:flex-start; gap:0.5rem;">
                <div class="page-header-block" style="margin-bottom:0.5rem; width:100%;">
                    <h3 class="book-title" style="margin:0;">${author.name}</h3>
                    ${adminActions}
                </div>
                <p class="book-meta-author" style="margin-bottom:0.5rem;">
                    <strong>Nationality:</strong> ${author.nationality || 'Unlisted'} |
                    <strong>Born:</strong> ${author.birth_year || 'Unlisted'}
                </p>
                <p class="book-description" style="-webkit-line-clamp:4; line-clamp:4;">${author.biography || ''}</p>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => deleteAuthor(btn.dataset.id));
    });
}

async function loadAuthors(page = UI.getPage()) {
    UI.setPageParam(page);

    const query = UI.buildApiQuery({ page });
    const data = await API.get(`/authors${query}`);
    renderAuthors(data.authors);
    UI.renderPagination('pagination', data.pagination, loadAuthors);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    if (Auth.isAdmin()) {
        document.getElementById('add-author-btn').style.display = 'inline-block';
    }
    loadAuthors().catch((err) => UI.handleError(err));
});
