const authorId = UI.getQueryParam('id');

document.getElementById('edit-author-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
        name: form.name.value.trim(),
        nationality: form.nationality.value.trim(),
        birth_year: form.birth_year.value || null,
        biography: form.biography.value.trim()
    };

    try {
        const data = await API.post(`/authors/edit/${authorId}`, payload);
        UI.success(data.message);
        setTimeout(() => { window.location.href = '/authors/index.html'; }, 700);
    } catch (err) {
        UI.handleError(err);
    }
});

async function loadAuthor() {
    if (!authorId) {
        UI.error('Missing author id in URL.');
        return;
    }

    const data = await API.get(`/authors/edit/${authorId}`);
    const { author } = data;

    document.getElementById('form-title').textContent = `Edit Author: ${author.name}`;
    const form = document.getElementById('edit-author-form');
    form.name.value = author.name;
    form.nationality.value = author.nationality || '';
    form.birth_year.value = author.birth_year || '';
    form.biography.value = author.biography || '';
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth({ admin: true })) return;
    try {
        await loadAuthor();
    } catch (err) {
        UI.handleError(err);
    }
});
