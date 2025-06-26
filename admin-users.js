// admin-users.js

document.addEventListener('DOMContentLoaded', () => {
    const usersTableBody = document.querySelector('#users-table tbody');
    const loader = document.getElementById('users-loader');
    const messageDiv = document.getElementById('users-message');

    function showLoader(show) {
        loader.style.display = show ? 'block' : 'none';
    }
    function showMessage(msg, type = 'success') {
        messageDiv.textContent = msg;
        messageDiv.style.color = type === 'success' ? 'green' : 'red';
        setTimeout(() => { messageDiv.textContent = ''; }, 4000);
    }

    function statusBadge(status) {
        const map = {
            pending_email_verification: 'badge bg-warning text-dark',
            pending_admin_approval: 'badge bg-info text-dark',
            active: 'badge bg-success',
            rejected: 'badge bg-danger',
        };
        const labels = {
            pending_email_verification: 'Oczekuje na weryfikację email',
            pending_admin_approval: 'Oczekuje na zatwierdzenie',
            active: 'Aktywny',
            rejected: 'Odrzucony',
        };
        return `<span class="${map[status] || 'badge bg-secondary'}">${labels[status] || status}</span>`;
    }

    async function fetchUsers() {
        showLoader(true);
        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            const users = await res.json();
            renderUsers(users);
        } catch (e) {
            showMessage('Błąd ładowania użytkowników', 'error');
        } finally {
            showLoader(false);
        }
    }

    function renderUsers(users) {
        usersTableBody.innerHTML = '';
        if (!users.length) {
            usersTableBody.innerHTML = '<tr><td colspan="6">Brak użytkowników</td></tr>';
            return;
        }
        users.forEach(user => {
            usersTableBody.innerHTML += `
                <tr>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.email}</td>
                    <td>${user.companyName}</td>
                    <td>${user.nip}</td>
                    <td>${statusBadge(user.status)}</td>
                    <td>
                        ${user.status === 'pending_admin_approval' ? `<button class="btn btn-primary" data-approve="${user._id}">Zatwierdź</button>` : ''}
                        ${user.status === 'pending_admin_approval' ? `<button class="btn btn-danger" data-reject="${user._id}">Odrzuć</button>` : ''}
                        <button class="btn btn-danger" data-delete="${user._id}">Usuń</button>
                    </td>
                </tr>
            `;
        });
    }

    usersTableBody.addEventListener('click', async (e) => {
        const approveId = e.target.getAttribute('data-approve');
        const rejectId = e.target.getAttribute('data-reject');
        const deleteId = e.target.getAttribute('data-delete');
        if (approveId) {
            if (confirm('Na pewno zatwierdzić tego użytkownika?')) {
                await userAction(approveId, 'approve');
            }
        }
        if (rejectId) {
            if (confirm('Na pewno odrzucić tego użytkownika?')) {
                await userAction(rejectId, 'reject');
            }
        }
        if (deleteId) {
            if (confirm('Na pewno usunąć tego użytkownika?')) {
                await userAction(deleteId, 'delete');
            }
        }
    });

    async function userAction(id, action) {
        showLoader(true);
        let url = `/api/users/${id}`;
        let method = 'DELETE';
        if (action === 'approve') { url += '/approve'; method = 'PATCH'; }
        if (action === 'reject') { url += '/reject'; method = 'PATCH'; }
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Błąd akcji');
            showMessage(data.message, 'success');
            await fetchUsers();
        } catch (e) {
            showMessage(e.message, 'error');
        } finally {
            showLoader(false);
        }
    }

    fetchUsers();
});
