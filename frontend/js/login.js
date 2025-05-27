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

            try {
                // Here you would typically make an API call to your backend
                // For now, we'll simulate a login check
                const response = await simulateLogin(emailInput.value, passwordInput.value);
                
                if (response.success) {
                    // Store user data in localStorage
                    localStorage.setItem('user', JSON.stringify(response.user));
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // Show success message
                    showSuccess('Logowanie udane! Przekierowywanie...');
                    
                    // Redirect to appropriate page
                    setTimeout(() => {
                        window.location.href = response.user.isAdmin ? 'admin-panel.html' : 'index.html';
                    }, 1500);
                } else {
                    showError(response.message || 'Nieprawidłowy email lub hasło.');
                }
            } catch (error) {
                showError('Wystąpił błąd podczas logowania. Spróbuj ponownie później.');
                console.error('Login error:', error);
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

    // Simulate login API call
    async function simulateLogin(email, password) {
        // This is a mock function - replace with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock user data - replace with actual user verification
                const users = {
                    'admin@example.com': { password: 'admin123', isAdmin: true },
                    'client@example.com': { password: 'client123', isAdmin: false }
                };

                const user = users[email];
                
                if (user && user.password === password) {
                    resolve({
                        success: true,
                        user: {
                            email: email,
                            isAdmin: user.isAdmin
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Nieprawidłowy email lub hasło.'
                    });
                }
            }, 1000);
        });
    }
}); 