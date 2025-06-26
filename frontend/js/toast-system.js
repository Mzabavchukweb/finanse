// Global Toast Notification System
class ToastSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.createContainer();
        }
        this.container = document.getElementById('toast-container');
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.innerHTML = `
            <style>
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                }
                
                .toast {
                    background: #ffffff;
                    color: #1f2937;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    border-left: 4px solid #2563eb;
                    min-width: 300px;
                    max-width: 400px;
                    transform: translateX(120%);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: auto;
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 500;
                    position: relative;
                    overflow: hidden;
                }
                
                .toast.show {
                    transform: translateX(0);
                }
                
                .toast.success {
                    border-left-color: #10b981;
                    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
                    color: #065f46;
                }
                
                .toast.error {
                    border-left-color: #ef4444;
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    color: #991b1b;
                }
                
                .toast.warning {
                    border-left-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                    color: #92400e;
                }
                
                .toast.info {
                    border-left-color: #3b82f6;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    color: #1e40af;
                }
                
                .toast-icon {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                
                .toast-content {
                    flex: 1;
                }
                
                .toast-title {
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .toast-message {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                    flex-shrink: 0;
                }
                
                .toast-close:hover {
                    opacity: 1;
                }
                
                .toast-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: currentColor;
                    width: 100%;
                    opacity: 0.3;
                    transform-origin: left;
                    animation: toast-progress 5s linear forwards;
                }
                
                @keyframes toast-progress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                @media (max-width: 640px) {
                    .toast-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                    }
                    
                    .toast {
                        min-width: auto;
                        max-width: none;
                    }
                }
            </style>
        `;
        document.body.appendChild(container);
    }

    show(message, type = 'info', options = {}) {
        const {
            title = null,
            duration = 5000,
            closable = true,
            icon = null
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toastIcon = icon || iconMap[type] || iconMap.info;
        
        toast.innerHTML = `
            <div class="toast-icon">${toastIcon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            ${closable ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
            ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        this.container.appendChild(toast);

        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Add close functionality
        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.remove(toast));
        }

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Convenience methods with titles
    showSuccess(title, message, options = {}) {
        return this.success(message, { ...options, title });
    }

    showError(title, message, options = {}) {
        return this.error(message, { ...options, title });
    }

    showWarning(title, message, options = {}) {
        return this.warning(message, { ...options, title });
    }

    showInfo(title, message, options = {}) {
        return this.info(message, { ...options, title });
    }

    // Clear all toasts
    clear() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.remove(toast));
    }
}

// Initialize global toast system
if (typeof window !== 'undefined') {
    window.toastSystem = new ToastSystem();
    
    // Global convenience functions
    window.showToast = (message, type = 'info', options = {}) => {
        return window.toastSystem.show(message, type, options);
    };
    
    window.showSuccess = (message, options = {}) => {
        return window.toastSystem.success(message, options);
    };
    
    window.showError = (message, options = {}) => {
        return window.toastSystem.error(message, options);
    };
    
    window.showWarning = (message, options = {}) => {
        return window.toastSystem.warning(message, options);
    };
    
    window.showInfo = (message, options = {}) => {
        return window.toastSystem.info(message, options);
    };
} 