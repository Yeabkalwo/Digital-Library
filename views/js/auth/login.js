const form = document.getElementById('login-form');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        email: form.email.value.trim(),
        password: form.password.value
    };

    UI.setLoading(submitBtn, true);

    try {
        const data = await API.post('/auth/login', payload);
        Auth.setSession(data.token, data.user);

        if (data.adminRequest?.status === 'pending') {
            UI.info(data.adminRequest.message, { duration: 8000 });
        } else if (data.adminRequest?.status === 'rejected') {
            UI.warning(data.adminRequest.message, { duration: 8000 });
        } else {
            UI.success(data.message);
        }

        setTimeout(() => {
            window.location.href = data.redirectTo || '/books/index.html';
        }, data.adminRequest ? 1800 : 800);
    } catch (err) {
        UI.handleError(err, 'Sign-in failed. Check your email and password.');
    } finally {
        UI.setLoading(submitBtn, false);
    }
});
