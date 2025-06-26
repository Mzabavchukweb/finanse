window.loggedIn = !!localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const statusMessage = document.getElementById('statusMessage');
    const passwordToggle = document.getElementById('passwordToggle');

    // Toggle password visibility
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset status message
            statusMessage.className = 'status-message';
            statusMessage.style.display = 'none';
            
            // Basic validation
            if (!emailInput.value || !passwordInput.value) {
                showError('Proszę wypełnić wszystkie pola.');
                return;
            }

            // Disable form during submission
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logowanie...';

            try {
                // Call real backend API
                const response = await fetch('http://localhost:3005/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    // Store auth token
                    if (result.token) {
                        localStorage.setItem('token', result.token);
                    }
                    
                    // Store user data
                    localStorage.setItem('user', JSON.stringify(result.user));
                    window.loggedIn = true;
                    
                    // Show success message
                    showSuccess('Logowanie udane! Przekierowywanie...');
                    
                    // Redirect to appropriate page
                    setTimeout(() => {
                        if (result.user.role === 'admin') {
                            window.location.href = '/pages/admin.html';
                        } else {
                            window.location.href = '/pages/account.html';
                        }
                    }, 1500);
                } else {
                    showError(result.message || 'Nieprawidłowy email lub hasło.');
                }
            } catch (error) {
                showError('Wystąpił błąd podczas logowania. Spróbuj ponownie później.');
                console.error('Login error:', error);
            } finally {
                // Re-enable form
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    // Helper functions
    function showError(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message error';
        statusMessage.style.display = 'block';
    }

    function showSuccess(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message success';
        statusMessage.style.display = 'block';
    }
}); 