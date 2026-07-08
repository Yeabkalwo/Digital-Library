async function borrowBook(bookId) {
    try {
        const data = await API.post('/borrow/borrow', { book_id: bookId });
        UI.success(data.message);
        loadBooks(UI.getPage());
    } catch (err) {
        UI.handleError(err);
    }
}

function renderBooks(books) {
    const grid = document.getElementById('books-grid');
    const user = Auth.getUser();

    if (!books.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No matching books located in the library ledger index.</p>';
        return;
    }

    grid.innerHTML = books.map((book) => {
        let actions = '';
        if (user && user.role === 'user') {
            actions = book.status === 'available'
                ? `<button class="btn btn-primary borrow-btn" data-id="${book.id}" style="padding:0.4rem 1rem;">Borrow Book</button>`
                : '<button class="btn btn-secondary" disabled style="cursor:not-allowed;opacity:0.6;">Unavailable</button>';
        } else if (user && user.role === 'admin') {
            actions = `<a href="/books/edit.html?id=${book.id}" class="btn btn-secondary" style="padding:0.4rem 1rem;">Modify (Admin Mode)</a>`;
        } else {
            actions = '<a href="/auth/login.html" style="font-size:0.875rem;">Sign in to check out</a>';
        }

        return `
            <div class="book-card">
                <div>
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-meta-author"><strong>ISBN:</strong> <span class="isbn-tag">${book.isbn}</span></p>
                    <p class="book-meta-author"><strong>Author:</strong> ${book.author_name}</p>
                    <p class="book-meta-author"><strong>Year:</strong> ${book.publication_year || ''}</p>
                    <p class="book-description">${book.description || ''}</p>
                </div>
                <div class="book-footer-info">
                    <span class="badge badge-${UI.badgeClass(book.status)}">${book.status.toUpperCase()}</span>
                    <div class="row-actions">${actions}</div>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.borrow-btn').forEach((btn) => {
        btn.addEventListener('click', () => borrowBook(Number(btn.dataset.id)));
    });
}

async function loadBooks(page = UI.getPage()) {
    const search = UI.getQueryParam('search');
    document.getElementById('search-input').value = search;
    UI.setPageParam(page);

    try {
        const query = UI.buildApiQuery({ page, search });
        const data = await API.get(`/books${query}`);
        renderBooks(data.books);
        UI.renderPagination('pagination', data.pagination, loadBooks);
    } catch (err) {
        UI.handleError(err);
    }
}

document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const search = document.getElementById('search-input').value.trim();
    const url = search
        ? `/books/index.html?search=${encodeURIComponent(search)}`
        : '/books/index.html';
    window.location.href = url;
});

loadBooks();
