// Modern UI/UX Components System for Cartechstore
// Production-ready components with accessibility and performance optimization

class UIManager {
    constructor() {
        this.activeModals = new Set();
        this.loadingStates = new Map();
        this.toastQueue = [];
        this.isProcessingToasts = false;
        this.init();
    }

    init() {
        this.createToastContainer();
        this.createLoadingOverlay();
        this.setupGlobalEventListeners();
        this.setupKeyboardNavigation();
        this.injectCSS();
    }

    // ===== TOAST NOTIFICATION SYSTEM =====
    createToastContainer() {
        if (document.getElementById('toast-container')) return;

        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'ui-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
    }

    showToast(message, type = 'info', options = {}) {
        const config = {
            duration: 5000,
            closable: true,
            actions: [],
            icon: this.getToastIcon(type),
            position: 'top-right',
            ...options
        };

        const toast = this.createToastElement(message, type, config);
        this.toastQueue.push({ toast, config });
        
        if (!this.isProcessingToasts) {
            this.processToastQueue();
        }

        return toast.id;
    }

    createToastElement(message, type, config) {
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        toast.id = toastId;
        toast.className = `ui-toast ui-toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-describedby', `${toastId}-message`);

        const progressBar = document.createElement('div');
        progressBar.className = 'ui-toast__progress';
        
        const content = document.createElement('div');
        content.className = 'ui-toast__content';

        const iconElement = document.createElement('div');
        iconElement.className = 'ui-toast__icon';
        iconElement.innerHTML = config.icon;

        const messageElement = document.createElement('div');
        messageElement.id = `${toastId}-message`;
        messageElement.className = 'ui-toast__message';
        messageElement.textContent = message;

        const actionsElement = document.createElement('div');
        actionsElement.className = 'ui-toast__actions';

        // Add action buttons
        config.actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'ui-toast__action';
            button.textContent = action.text;
            button.addEventListener('click', () => {
                action.handler();
                this.hideToast(toastId);
            });
            actionsElement.appendChild(button);
        });

        // Add close button if closable
        if (config.closable) {
            const closeButton = document.createElement('button');
            closeButton.className = 'ui-toast__close';
            closeButton.innerHTML = '×';
            closeButton.setAttribute('aria-label', 'Zamknij powiadomienie');
            closeButton.addEventListener('click', () => this.hideToast(toastId));
            actionsElement.appendChild(closeButton);
        }

        content.appendChild(iconElement);
        content.appendChild(messageElement);
        if (config.actions.length > 0 || config.closable) {
            content.appendChild(actionsElement);
        }
        
        toast.appendChild(progressBar);
        toast.appendChild(content);

        return toast;
    }

    async processToastQueue() {
        if (this.isProcessingToasts || this.toastQueue.length === 0) return;
        
        this.isProcessingToasts = true;
        const container = document.getElementById('toast-container');

        while (this.toastQueue.length > 0) {
            const { toast, config } = this.toastQueue.shift();
            
            // Add to DOM
            container.appendChild(toast);
            
            // Trigger enter animation
            await this.animateIn(toast);
            
            // Auto-hide after duration
            if (config.duration > 0) {
                this.startToastTimer(toast.id, config.duration);
            }
            
            // Small delay between toasts
            await this.delay(100);
        }
        
        this.isProcessingToasts = false;
    }

    async animateIn(toast) {
        return new Promise(resolve => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            
            requestAnimationFrame(() => {
                toast.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
                
                setTimeout(resolve, 400);
            });
        });
    }

    async animateOut(toast) {
        return new Promise(resolve => {
            toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                resolve();
            }, 300);
        });
    }

    startToastTimer(toastId, duration) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        const progressBar = toast.querySelector('.ui-toast__progress');
        if (progressBar) {
            progressBar.style.transition = `width ${duration}ms linear`;
            progressBar.style.width = '0%';
        }

        setTimeout(() => {
            this.hideToast(toastId);
        }, duration);
    }

    async hideToast(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        await this.animateOut(toast);
    }

    getToastIcon(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
            loading: '<svg viewBox="0 0 24 24" fill="currentColor" class="ui-loading-spinner"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416"><animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/></circle></svg>'
        };
        return icons[type] || icons.info;
    }

    // ===== LOADING STATES SYSTEM =====
    createLoadingOverlay() {
        if (document.getElementById('ui-loading-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'ui-loading-overlay';
        overlay.className = 'ui-loading-overlay';
        overlay.innerHTML = `
            <div class="ui-loading-content">
                <div class="ui-loading-spinner-large">
                    <svg viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="1.5s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
                <div class="ui-loading-text">Ładowanie...</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    showLoading(key = 'global', text = 'Ładowanie...') {
        this.loadingStates.set(key, true);
        
        const overlay = document.getElementById('ui-loading-overlay');
        const textElement = overlay.querySelector('.ui-loading-text');
        
        textElement.textContent = text;
        overlay.classList.add('ui-loading-overlay--visible');
        document.body.classList.add('ui-loading-active');
    }

    hideLoading(key = 'global') {
        this.loadingStates.delete(key);
        
        // Only hide if no other loading states are active
        if (this.loadingStates.size === 0) {
            const overlay = document.getElementById('ui-loading-overlay');
            overlay.classList.remove('ui-loading-overlay--visible');
            document.body.classList.remove('ui-loading-active');
        }
    }

    showElementLoading(element, text = 'Ładowanie...') {
        if (element.querySelector('.ui-element-loading')) return;

        const loading = document.createElement('div');
        loading.className = 'ui-element-loading';
        loading.innerHTML = `
            <div class="ui-element-loading__spinner">
                ${this.getToastIcon('loading')}
            </div>
            <div class="ui-element-loading__text">${text}</div>
        `;

        element.style.position = 'relative';
        element.appendChild(loading);
        element.classList.add('ui-element-loading-active');
    }

    hideElementLoading(element) {
        const loading = element.querySelector('.ui-element-loading');
        if (loading) {
            loading.remove();
        }
        element.classList.remove('ui-element-loading-active');
    }

    // ===== MODAL SYSTEM =====
    createModal(options = {}) {
        const config = {
            title: '',
            content: '',
            size: 'medium', // small, medium, large, fullscreen
            closable: true,
            backdrop: true,
            keyboard: true,
            buttons: [],
            className: '',
            ...options
        };

        const modal = document.createElement('div');
        const modalId = 'modal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        modal.id = modalId;
        modal.className = `ui-modal ui-modal--${config.size} ${config.className}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', `${modalId}-title`);
        modal.setAttribute('aria-modal', 'true');

        if (config.backdrop) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modalId);
                }
            });
        }

        const dialog = document.createElement('div');
        dialog.className = 'ui-modal__dialog';

        const content = document.createElement('div');
        content.className = 'ui-modal__content';

        // Header
        if (config.title || config.closable) {
            const header = document.createElement('div');
            header.className = 'ui-modal__header';

            if (config.title) {
                const title = document.createElement('h2');
                title.id = `${modalId}-title`;
                title.className = 'ui-modal__title';
                title.textContent = config.title;
                header.appendChild(title);
            }

            if (config.closable) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'ui-modal__close';
                closeBtn.innerHTML = '×';
                closeBtn.setAttribute('aria-label', 'Zamknij modal');
                closeBtn.addEventListener('click', () => this.closeModal(modalId));
                header.appendChild(closeBtn);
            }

            content.appendChild(header);
        }

        // Body
        const body = document.createElement('div');
        body.className = 'ui-modal__body';
        if (typeof config.content === 'string') {
            body.innerHTML = config.content;
        } else {
            body.appendChild(config.content);
        }
        content.appendChild(body);

        // Footer
        if (config.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'ui-modal__footer';

            config.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `ui-button ui-button--${button.type || 'secondary'}`;
                btn.textContent = button.text;
                btn.addEventListener('click', () => {
                    if (button.handler) {
                        button.handler();
                    }
                    if (button.close !== false) {
                        this.closeModal(modalId);
                    }
                });
                footer.appendChild(btn);
            });

            content.appendChild(footer);
        }

        dialog.appendChild(content);
        modal.appendChild(dialog);

        return { modal, modalId };
    }

    async showModal(options) {
        const { modal, modalId } = this.createModal(options);
        
        document.body.appendChild(modal);
        this.activeModals.add(modalId);
        document.body.classList.add('ui-modal-open');

        // Focus management
        this.trapFocus(modal);

        // Animate in
        await this.animateModalIn(modal);

        return modalId;
    }

    async closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        await this.animateModalOut(modal);
        
        modal.remove();
        this.activeModals.delete(modalId);

        if (this.activeModals.size === 0) {
            document.body.classList.remove('ui-modal-open');
        }
    }

    async animateModalIn(modal) {
        return new Promise(resolve => {
            modal.style.opacity = '0';
            modal.style.display = 'flex';
            
            const dialog = modal.querySelector('.ui-modal__dialog');
            dialog.style.transform = 'scale(0.9) translateY(-20px)';
            
            requestAnimationFrame(() => {
                modal.style.transition = 'opacity 0.3s ease';
                dialog.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                
                modal.style.opacity = '1';
                dialog.style.transform = 'scale(1) translateY(0)';
                
                setTimeout(resolve, 300);
            });
        });
    }

    async animateModalOut(modal) {
        return new Promise(resolve => {
            const dialog = modal.querySelector('.ui-modal__dialog');
            
            modal.style.transition = 'opacity 0.3s ease';
            dialog.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            modal.style.opacity = '0';
            dialog.style.transform = 'scale(0.9) translateY(-20px)';
            
            setTimeout(resolve, 300);
        });
    }

    // ===== FORM VALIDATION SYSTEM =====
    validateForm(form, rules = {}) {
        const errors = {};
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.ui-field-error').forEach(error => error.remove());
        form.querySelectorAll('.ui-field--error').forEach(field => {
            field.classList.remove('ui-field--error');
        });

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;

            const value = field.value.trim();
            const fieldErrors = [];

            // Required validation
            if (fieldRules.required && !value) {
                fieldErrors.push(fieldRules.required.message || 'To pole jest wymagane');
            }

            // Only validate other rules if field has value
            if (value) {
                // Min length
                if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
                    fieldErrors.push(fieldRules.minLength.message || `Minimum ${fieldRules.minLength.value} znaków`);
                }

                // Max length
                if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
                    fieldErrors.push(fieldRules.maxLength.message || `Maksimum ${fieldRules.maxLength.value} znaków`);
                }

                // Pattern
                if (fieldRules.pattern && !fieldRules.pattern.value.test(value)) {
                    fieldErrors.push(fieldRules.pattern.message || 'Nieprawidłowy format');
                }

                // Email
                if (fieldRules.email) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(value)) {
                        fieldErrors.push(fieldRules.email.message || 'Nieprawidłowy adres email');
                    }
                }

                // Custom validation
                if (fieldRules.custom) {
                    const customResult = fieldRules.custom.validator(value, form);
                    if (customResult !== true) {
                        fieldErrors.push(customResult || fieldRules.custom.message || 'Nieprawidłowa wartość');
                    }
                }
            }

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
                isValid = false;
                this.showFieldErrors(field, fieldErrors);
            }
        }

        return { isValid, errors };
    }

    showFieldErrors(field, errors) {
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

    // ===== UTILITY METHODS =====
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        firstFocusable.focus();

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    setupGlobalEventListeners() {
        // Handle Escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                const lastModal = Array.from(this.activeModals).pop();
                this.closeModal(lastModal);
            }
        });

        // Handle form submissions with loading states
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.dataset.uiForm === 'true') {
                this.handleFormSubmission(form, e);
            }
        });
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation will be added here
        document.addEventListener('keydown', (e) => {
            // Add keyboard shortcuts and navigation
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '/':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                }
            }
        });
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input, input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }

    handleFormSubmission(form, event) {
        // Will be implemented based on form requirements
        console.log('Form submission intercepted:', form);
    }

    // ===== CSS INJECTION =====
    injectCSS() {
        if (document.getElementById('ui-components-styles')) return;

        const style = document.createElement('style');
        style.id = 'ui-components-styles';
        style.textContent = `
            /* Toast Notifications */
            .ui-toast-container {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-width: 400px;
                pointer-events: none;
            }

            .ui-toast {
                background: white;
                border-radius: 0.75rem;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06);
                overflow: hidden;
                position: relative;
                pointer-events: auto;
                min-width: 300px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }

            .ui-toast--success { border-left: 4px solid #10b981; }
            .ui-toast--error { border-left: 4px solid #ef4444; }
            .ui-toast--warning { border-left: 4px solid #f59e0b; }
            .ui-toast--info { border-left: 4px solid #3b82f6; }

            .ui-toast__progress {
                position: absolute;
                top: 0;
                left: 0;
                height: 3px;
                width: 100%;
                background: linear-gradient(90deg, #3b82f6, #10b981);
            }

            .ui-toast__content {
                display: flex;
                align-items: flex-start;
                padding: 1rem;
                gap: 0.75rem;
            }

            .ui-toast__icon {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
                margin-top: 0.125rem;
            }

            .ui-toast__icon svg {
                width: 100%;
                height: 100%;
            }

            .ui-toast--success .ui-toast__icon { color: #10b981; }
            .ui-toast--error .ui-toast__icon { color: #ef4444; }
            .ui-toast--warning .ui-toast__icon { color: #f59e0b; }
            .ui-toast--info .ui-toast__icon { color: #3b82f6; }

            .ui-toast__message {
                flex: 1;
                font-size: 0.875rem;
                line-height: 1.5;
                color: #374151;
                font-weight: 500;
            }

            .ui-toast__actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }

            .ui-toast__action {
                background: #f3f4f6;
                border: none;
                border-radius: 0.375rem;
                padding: 0.25rem 0.75rem;
                font-size: 0.75rem;
                font-weight: 600;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ui-toast__action:hover {
                background: #e5e7eb;
            }

            .ui-toast__close {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0.25rem;
                transition: all 0.2s;
            }

            .ui-toast__close:hover {
                color: #374151;
                background: #f3f4f6;
            }

            /* Loading Overlay */
            .ui-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
            }

            .ui-loading-overlay--visible {
                opacity: 1;
                visibility: visible;
            }

            .ui-loading-content {
                background: white;
                border-radius: 1rem;
                padding: 2rem;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                max-width: 300px;
            }

            .ui-loading-spinner-large {
                width: 48px;
                height: 48px;
                margin: 0 auto 1rem;
                color: #3b82f6;
            }

            .ui-loading-text {
                font-size: 1rem;
                color: #374151;
                font-weight: 500;
            }

            .ui-loading-active {
                overflow: hidden;
            }

            /* Element Loading */
            .ui-element-loading {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10;
                border-radius: inherit;
                backdrop-filter: blur(2px);
            }

            .ui-element-loading__spinner {
                width: 24px;
                height: 24px;
                color: #3b82f6;
                margin-bottom: 0.5rem;
            }

            .ui-element-loading__text {
                font-size: 0.875rem;
                color: #6b7280;
            }

            /* Modal */
            .ui-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9998;
                padding: 1rem;
                backdrop-filter: blur(4px);
            }

            .ui-modal__dialog {
                background: white;
                border-radius: 1rem;
                max-height: calc(100vh - 2rem);
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            }

            .ui-modal--small .ui-modal__dialog { max-width: 400px; }
            .ui-modal--medium .ui-modal__dialog { max-width: 600px; }
            .ui-modal--large .ui-modal__dialog { max-width: 800px; }
            .ui-modal--fullscreen .ui-modal__dialog { 
                max-width: calc(100vw - 2rem); 
                max-height: calc(100vh - 2rem); 
            }

            .ui-modal__content {
                display: flex;
                flex-direction: column;
                max-height: calc(100vh - 2rem);
            }

            .ui-modal__header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem 1.5rem 0;
            }

            .ui-modal__title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
                margin: 0;
            }

            .ui-modal__close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #9ca3af;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .ui-modal__close:hover {
                color: #374151;
                background: #f3f4f6;
            }

            .ui-modal__body {
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            }

            .ui-modal__footer {
                padding: 0 1.5rem 1.5rem;
                display: flex;
                gap: 0.75rem;
                justify-content: flex-end;
            }

            /* Form Validation */
            .ui-field--error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }

            .ui-field-error {
                margin-top: 0.25rem;
            }

            .ui-field-error__message {
                font-size: 0.75rem;
                color: #ef4444;
                font-weight: 500;
            }

            /* Buttons */
            .ui-button {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                font-weight: 600;
                font-size: 0.875rem;
                border: 1px solid transparent;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
            }

            .ui-button--primary {
                background: #3b82f6;
                color: white;
            }

            .ui-button--primary:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }

            .ui-button--secondary {
                background: #f3f4f6;
                color: #374151;
                border-color: #d1d5db;
            }

            .ui-button--secondary:hover {
                background: #e5e7eb;
            }

            .ui-button--danger {
                background: #ef4444;
                color: white;
            }

            .ui-button--danger:hover {
                background: #dc2626;
            }

            /* Loading Spinner Animation */
            .ui-loading-spinner svg {
                animation: ui-spin 1s linear infinite;
            }

            @keyframes ui-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* Responsive */
            @media (max-width: 640px) {
                .ui-toast-container {
                    top: 0.5rem;
                    right: 0.5rem;
                    left: 0.5rem;
                    max-width: none;
                }

                .ui-toast {
                    min-width: auto;
                }

                .ui-modal {
                    padding: 0.5rem;
                }

                .ui-modal__dialog {
                    width: 100%;
                }

                .ui-modal__header,
                .ui-modal__body,
                .ui-modal__footer {
                    padding-left: 1rem;
                    padding-right: 1rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize UI Manager
const ui = new UIManager();

// Export for global use
window.ui = ui;

// Convenience methods
window.showToast = (message, type, options) => ui.showToast(message, type, options);
window.showLoading = (key, text) => ui.showLoading(key, text);
window.hideLoading = (key) => ui.hideLoading(key);
window.showModal = (options) => ui.showModal(options);
window.closeModal = (id) => ui.closeModal(id); 