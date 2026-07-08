const bookId = UI.getQueryParam('id');

document.getElementById('edit-book-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
        title: form.title.value.trim(),
        isbn: form.isbn.value.trim(),
        author_id: form.author_id.value,
        publication_year: form.publication_year.value || null,
        description: form.description.value.trim(),
        status: form.status.value
    };

    try {
        const data = await API.post(`/books/edit/${bookId}`, payload);
        UI.success(data.message);
        setTimeout(() => { window.location.href = '/books/admin-dashboard.html'; }, 700);
    } catch (err) {
        UI.handleError(err);
    }
});

async function loadBook() {
    if (!bookId) {
        UI.error('Missing book id in URL.');
        return;
    }

    const data = await API.get(`/books/edit/${bookId}`);
    const { book, authors } = data;

    document.getElementById('form-title').textContent = `Edit Book: ${book.title}`;
    const form = document.getElementById('edit-book-form');
    form.title.value = book.title;
    form.isbn.value = book.isbn;
    form.publication_year.value = book.publication_year || '';
    form.description.value = book.description || '';
    form.status.value = book.status;

    const select = document.getElementById('author-select');
    select.innerHTML = authors.map((author) =>
        `<option value="${author.id}" ${author.id === book.author_id ? 'selected' : ''}>${author.name}</option>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth({ admin: true })) return;
    try {
        await loadBook();
    } catch (err) {
        UI.handleError(err);
    }
});
