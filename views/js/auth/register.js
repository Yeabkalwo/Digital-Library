const roleSelect = document.getElementById('role-select');
const adminMessageGroup = document.getElementById('admin-message-group');
const roleHint = document.getElementById('role-hint');
const form = document.getElementById('register-form');
const submitBtn = document.getElementById('register-btn');

function updateRoleUI() {
    const wantsAdmin = roleSelect.value === 'admin';
    adminMessageGroup.hidden = !wantsAdmin;
    roleHint.textContent = wantsAdmin
        ? 'You will register as a member first. Admin access is granted only after an administrator approves your request.'
        : 'Standard members can browse and borrow books.';
}

roleSelect.addEventListener('change', updateRoleUI);
updateRoleUI();

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        role: form.role.value
    };

    if (payload.role === 'admin') {
        payload.message = form.message.value.trim();
    }

    UI.setLoading(submitBtn, true);

    try {
        const data = await API.post('/auth/register', payload);
        const toastType = data.adminRequestPending ? 'info' : 'success';
        UI.toast(data.message, toastType, { duration: 8000 });

        setTimeout(() => {
            UI.flashRedirect('/auth/login.html', data.message, toastType);
        }, data.adminRequestPending ? 2500 : 1200);
    } catch (err) {
        UI.handleError(err, 'Registration failed. Please review your details and try again.');
    } finally {
        UI.setLoading(submitBtn, false);
    }
});
