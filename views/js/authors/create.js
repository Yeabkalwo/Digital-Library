document.getElementById('create-author-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
        name: form.name.value.trim(),
        nationality: form.nationality.value.trim(),
        birth_year: form.birth_year.value || null,
        biography: form.biography.value.trim()
    };

    try {
        const data = await API.post('/authors/create', payload);
        UI.success(data.message);
        setTimeout(() => { window.location.href = '/authors/index.html'; }, 700);
    } catch (err) {
        UI.handleError(err);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth({ admin: true })) return;
});
