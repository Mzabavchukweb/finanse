// Enhanced Admin Login System for Cartechstore
// Production-ready with modern UI/UX, security features, and comprehensive error handling

class AdminLoginManager {
    constructor() {
        this.apiBaseUrl = window.location.origin.includes('localhost') 
            ? 'http://localhost:3005/api' 
            : '/api';
        this.form = null;
        this.isLoading = false;
        this.twoFactorMode = false;
        this.tempToken = null;
        this.rememberMe = false;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupForm();
            this.setupEventListeners();
            this.checkExistingSession();
            this.setupPasswordToggle();
            this.preloadAssets();
        });
    }

    setupForm() {
        this.form = document.getElementById('adminLoginForm');
        if (!this.form) {
            console.error('Admin login form not found');
            return;
        }

        // Add data attribute for UI validation
        this.form.setAttribute('data-ui-form', 'true');
        this.form.setAttribute('novalidate', 'true');

        // Setup real-time validation
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Remember me checkbox
        const rememberMeCheckbox = document.getElementById('rememberMe');
        if (rememberMeCheckbox) {
            rememberMeCheckbox.addEventListener('change', (e) => {
                this.rememberMe = e.target.checked;
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.handleLogin(new Event('submit'));
            }
        });

        // Auto-focus first input
        const firstInput = this.form?.querySelector('input[type="email"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    setupRealTimeValidation() {
        const emailInput = this.form.querySelector('input[name="email"]');
        const passwordInput = this.form.querySelector('input[name="password"]');

        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateEmail(emailInput.value));
            emailInput.addEventListener('input', () => this.clearFieldError(emailInput));
        }

        if (passwordInput) {
            passwordInput.addEventListener('blur', () => this.validatePassword(passwordInput.value));
            passwordInput.addEventListener('input', () => this.clearFieldError(passwordInput));
        }
    }

    setupPasswordToggle() {
        const passwordInput = document.querySelector('input[name="password"]');
        const toggleButton = document.querySelector('.password-toggle');

        if (passwordInput && toggleButton) {
            toggleButton.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                toggleButton.innerHTML = isPassword 
                    ? '<i class="fas fa-eye-slash"></i>' 
                    : '<i class="fas fa-eye"></i>';
            });
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        const formData = new FormData(this.form);
        const loginData = {
            email: formData.get('email')?.trim(),
            password: formData.get('password'),
            rememberMe: this.rememberMe
        };

        // Validate form
        const validation = this.validateLoginForm(loginData);
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            this.setLoadingState(true);
            
            const response = await fetch(`${this.apiBaseUrl}/admin-auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                if (result.requires2FA) {
                    this.handle2FARequired(result.tempToken);
                } else {
                    this.handleLoginSuccess(result);
                }
            } else {
                this.handleLoginError(result, response.status);
            }

        } catch (error) {
            console.error('Login error:', error);
            this.handleNetworkError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    handle2FARequired(tempToken) {
        this.twoFactorMode = true;
        this.tempToken = tempToken;
        
        showToast('Wprowadź kod z aplikacji uwierzytelniającej', 'info');
        this.show2FAModal();
    }

    async show2FAModal() {
        const modalContent = this.create2FAModalContent();
        
        const modalId = await showModal({
            title: 'Uwierzytelnianie dwuskładnikowe',
            content: modalContent,
            size: 'small',
            closable: false,
            backdrop: false,
            buttons: [
                {
                    text: 'Weryfikuj',
                    type: 'primary',
                    handler: () => this.verify2FA(),
                    close: false
                },
                {
                    text: 'Anuluj',
                    type: 'secondary',
                    handler: () => {
                        this.reset2FA();
                        showToast('Logowanie anulowane', 'info');
                    }
                }
            ]
        });

        // Focus on 2FA input
        const twoFactorInput = document.getElementById('twoFactorCode');
        if (twoFactorInput) {
            setTimeout(() => {
                twoFactorInput.focus();
                this.setup2FAInputFormatting(twoFactorInput);
            }, 300);
        }
    }

    create2FAModalContent() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="2fa-modal-content">
                <div class="2fa-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                    </svg>
                </div>
                <p class="2fa-description">
                    Wprowadź 6-cyfrowy kod z aplikacji uwierzytelniającej (Google Authenticator, Authy, itp.)
                </p>
                <div class="2fa-input-container">
                    <input 
                        type="text" 
                        id="twoFactorCode" 
                        placeholder="000000" 
                        maxlength="6" 
                        class="2fa-input"
                        autocomplete="one-time-code"
                        inputmode="numeric"
                        pattern="[0-9]{6}"
                    >
                </div>
                <div class="2fa-help">
                    <small>Kod wygasa co 30 sekund</small>
                </div>
            </div>
        `;

        // Add CSS for 2FA modal
        this.inject2FAStyles();

        return container;
    }

    setup2FAInputFormatting(input) {
        input.addEventListener('input', (e) => {
            // Only allow numbers
            e.target.value = e.target.value.replace(/\D/g, '');
            
            // Auto-verify when 6 digits entered
            if (e.target.value.length === 6) {
                setTimeout(() => this.verify2FA(), 100);
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.length === 6) {
                e.preventDefault();
                this.verify2FA();
            }
        });

        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                e.target.value = value;
                
                if (value.length === 6) {
                    setTimeout(() => this.verify2FA(), 100);
                }
            }, 10);
        });
    }

    async verify2FA() {
        const codeInput = document.getElementById('twoFactorCode');
        const code = codeInput?.value?.trim();

        if (!code || code.length !== 6) {
            this.show2FAError('Wprowadź 6-cyfrowy kod');
            return;
        }

        try {
            showLoading('2fa', 'Weryfikuję kod...');
            
            const response = await fetch(`${this.apiBaseUrl}/admin-auth/verify-2fa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({
                    tempToken: this.tempToken,
                    token: code
                })
            });

            const result = await response.json();

            if (result.success) {
                hideLoading('2fa');
                closeModal(); // Close 2FA modal
                this.handleLoginSuccess(result);
            } else {
                this.show2FAError(result.message || 'Nieprawidłowy kod 2FA');
            }

        } catch (error) {
            console.error('2FA verification error:', error);
            this.show2FAError('Błąd weryfikacji. Spróbuj ponownie.');
        } finally {
            hideLoading('2fa');
        }
    }

    show2FAError(message) {
        const errorContainer = document.querySelector('.2fa-error') || this.create2FAErrorContainer();
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Shake animation
        const input = document.getElementById('twoFactorCode');
        if (input) {
            input.classList.add('shake-animation');
            setTimeout(() => input.classList.remove('shake-animation'), 500);
            input.select();
        }
    }

    create2FAErrorContainer() {
        const container = document.createElement('div');
        container.className = '2fa-error';
        container.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            text-align: center;
            display: none;
        `;
        
        const inputContainer = document.querySelector('.2fa-input-container');
        if (inputContainer) {
            inputContainer.appendChild(container);
        }
        
        return container;
    }

    reset2FA() {
        this.twoFactorMode = false;
        this.tempToken = null;
    }

    handleLoginSuccess(result) {
        // Store authentication data
        if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('adminUser', JSON.stringify(result.user));
        }

        // Store session info
        if (result.session) {
            sessionStorage.setItem('adminSession', JSON.stringify(result.session));
        }

        showToast('Zalogowano pomyślnie! Przekierowuję...', 'success');
        
        // Animate success
        this.animateLoginSuccess();
        
        // Redirect after animation
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
    }

    handleLoginError(result, status) {
        const errorMap = {
            400: 'Nieprawidłowe dane logowania',
            401: 'Nieprawidłowy email lub hasło',
            403: 'Konto jest nieaktywne lub zablokowane',
            423: 'Konto jest tymczasowo zablokowane',
            429: 'Zbyt wiele prób logowania. Spróbuj później.',
            500: 'Błąd serwera. Spróbuj ponownie.'
        };

        const message = result.message || errorMap[status] || 'Wystąpił nieoczekiwany błąd';
        
        showToast(message, 'error', {
            duration: 8000,
            actions: status === 423 ? [{
                text: 'Pomoc',
                handler: () => this.showUnlockHelp()
            }] : []
        });

        this.animateLoginError();
        this.logSecurityEvent('login_failed', { status, message: result.message });
    }

    handleNetworkError(error) {
        let message = 'Błąd połączenia z serwerem';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            message = 'Brak połączenia z internetem';
        } else if (error.name === 'AbortError') {
            message = 'Żądanie zostało przerwane';
        }

        showToast(message, 'error', {
            duration: 10000,
            actions: [{
                text: 'Spróbuj ponownie',
                handler: () => window.location.reload()
            }]
        });

        this.animateLoginError();
    }

    validateLoginForm(data) {
        const errors = {};
        let isValid = true;

        // Email validation
        if (!data.email) {
            errors.email = ['Email jest wymagany'];
            isValid = false;
        } else if (!this.isValidEmail(data.email)) {
            errors.email = ['Nieprawidłowy format email'];
            isValid = false;
        }

        // Password validation
        if (!data.password) {
            errors.password = ['Hasło jest wymagane'];
            isValid = false;
        } else if (data.password.length < 8) {
            errors.password = ['Hasło musi mieć minimum 8 znaków'];
            isValid = false;
        }

        return { isValid, errors };
    }

    validateEmail(email) {
        if (!email) return;
        
        const isValid = this.isValidEmail(email);
        const emailInput = this.form.querySelector('input[name="email"]');
        
        if (!isValid) {
            this.showFieldError(emailInput, ['Nieprawidłowy format email']);
        } else {
            this.clearFieldError(emailInput);
        }
        
        return isValid;
    }

    validatePassword(password) {
        if (!password) return;
        
        const errors = [];
        if (password.length < 8) {
            errors.push('Hasło musi mieć minimum 8 znaków');
        }
        
        const passwordInput = this.form.querySelector('input[name="password"]');
        
        if (errors.length > 0) {
            this.showFieldError(passwordInput, errors);
        } else {
            this.clearFieldError(passwordInput);
        }
        
        return errors.length === 0;
    }

    showValidationErrors(errors) {
        for (const [fieldName, fieldErrors] of Object.entries(errors)) {
            const field = this.form.querySelector(`input[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field, fieldErrors);
            }
        }
        
        // Focus first error field
        const firstErrorField = this.form.querySelector('.ui-field--error');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }

    showFieldError(field, errors) {
        this.clearFieldError(field);
        
        field.classList.add('ui-field--error');
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'ui-field-error';
        
        errors.forEach(error => {
            const errorElement = document.createElement('div');
            errorElement.className = 'ui-field-error__message';
            errorElement.textContent = error;
            errorContainer.appendChild(errorElement);
        });

        field.parentNode.insertBefore(errorContainer, field.nextSibling);
    }

    clearFieldError(field) {
        field.classList.remove('ui-field--error');
        const errorContainer = field.parentNode.querySelector('.ui-field-error');
        if (errorContainer) {
            errorContainer.remove();
        }
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const submitButton = this.form.querySelector('button[type="submit"]');
        const inputs = this.form.querySelectorAll('input');

        if (loading) {
            showLoading('login', 'Logowanie...');
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            inputs.forEach(input => input.disabled = true);
        } else {
            hideLoading('login');
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            inputs.forEach(input => input.disabled = false);
        }
    }

    animateLoginSuccess() {
        const form = this.form;
        if (form) {
            form.style.transform = 'scale(0.98)';
            form.style.opacity = '0.8';
            form.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                form.style.transform = 'scale(1)';
                form.style.opacity = '1';
            }, 200);
        }
    }

    animateLoginError() {
        const form = this.form;
        if (form) {
            form.classList.add('shake-animation');
            setTimeout(() => form.classList.remove('shake-animation'), 500);
        }
    }

    async checkExistingSession() {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/sessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.sessions.length > 0) {
                    // Valid session exists
                    showToast('Aktywna sesja wykryta. Przekierowuję...', 'info');
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 1000);
                }
            } else {
                // Invalid session, clear storage
                this.clearAuthData();
            }
        } catch (error) {
            console.error('Session check error:', error);
            this.clearAuthData();
        }
    }

    clearAuthData() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminSession');
    }

    showUnlockHelp() {
        showModal({
            title: 'Konto zablokowane',
            content: `
                <div style="text-align: center; padding: 1rem;">
                    <p style="margin-bottom: 1rem;">Twoje konto zostało tymczasowo zablokowane z powodu zbyt wielu nieudanych prób logowania.</p>
                    <p style="margin-bottom: 1rem;">Odczekaj 30 minut i spróbuj ponownie.</p>
                    <p style="font-size: 0.875rem; color: #6b7280;">
                        Jeśli problem się powtarza, skontaktuj się z administratorem systemu.
                    </p>
                </div>
            `,
            size: 'small',
            buttons: [
                {
                    text: 'Rozumiem',
                    type: 'primary'
                }
            ]
        });
    }

    preloadAssets() {
        // Preload critical assets for better UX
        const criticalAssets = [
            '/css/styles.css',
            '/js/ui-components.js'
        ];

        criticalAssets.forEach(asset => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = asset.endsWith('.css') ? 'style' : 'script';
            link.href = asset;
            document.head.appendChild(link);
        });
    }

    logSecurityEvent(event, data = {}) {
        // Security logging for analytics
        const logData = {
            event,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        };

        // Send to analytics service (implement as needed)
        console.log('Security Event:', logData);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    inject2FAStyles() {
        if (document.getElementById('2fa-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = '2fa-modal-styles';
        styles.textContent = `
            .2fa-modal-content {
                text-align: center;
                padding: 1rem 0;
            }

            .2fa-icon {
                color: #3b82f6;
                margin-bottom: 1rem;
            }

            .2fa-description {
                color: #6b7280;
                margin-bottom: 1.5rem;
                line-height: 1.5;
            }

            .2fa-input-container {
                margin-bottom: 1rem;
            }

            .2fa-input {
                width: 100%;
                max-width: 200px;
                padding: 1rem;
                font-size: 1.5rem;
                text-align: center;
                letter-spacing: 0.5rem;
                border: 2px solid #e5e7eb;
                border-radius: 0.5rem;
                font-family: 'Courier New', monospace;
                transition: all 0.3s ease;
            }

            .2fa-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .2fa-help {
                color: #9ca3af;
                font-size: 0.75rem;
            }

            .shake-animation {
                animation: shake 0.5s ease-in-out;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Initialize admin login manager
new AdminLoginManager(); 