async function loadAuthors() {
    const data = await API.get('/books/create');
    const select = document.getElementById('author-select');
    select.innerHTML = '<option value="">Select an author</option>' +
        data.authors.map((author) => `<option value="${author.id}">${author.name}</option>`).join('');
}

document.getElementById('create-book-form').addEventListener('submit', async (event) => {
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
        const data = await API.post('/books/create', payload);
        UI.success(data.message);
        setTimeout(() => { window.location.href = '/books/admin-dashboard.html'; }, 700);
    } catch (err) {
        UI.handleError(err);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth({ admin: true })) return;
    try {
        await loadAuthors();
    } catch (err) {
        UI.handleError(err);
    }
});
