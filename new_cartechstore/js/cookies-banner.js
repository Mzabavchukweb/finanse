// Cookie Banner Management
class CookieBanner {
    constructor() {
        this.cookieSettings = {
            necessary: true,    // Always true, cannot be disabled
            functional: false,
            analytics: false,
            marketing: false
        };
        
        this.init();
    }

    init() {
        // Check if user has already made cookie choices
        const cookieConsent = localStorage.getItem('cookieConsent');
        
        if (!cookieConsent) {
            this.createBanner();
            this.showBanner();
        } else {
            // Load saved preferences
            this.cookieSettings = JSON.parse(cookieConsent);
            this.applyCookieSettings();
        }
        
        this.createSettingsModal();
    }

    createBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.id = 'cookieBanner';
        
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <div class="cookie-banner-title">
                        <i class="fas fa-cookie-bite cookie-icon"></i>
                        Ta strona używa plików cookies
                    </div>
                    <div class="cookie-banner-description">
                        Używamy plików cookies, aby zapewnić najlepsze wrażenia z korzystania z naszej strony. 
                        Klikając "Akceptuj wszystkie", zgadzasz się na przechowywanie plików cookies na Twoim urządzeniu w celu poprawy nawigacji po stronie, analizy korzystania ze strony i wspomagania naszych działań marketingowych. 
                        <a href="/pages/cookies.html" class="cookie-banner-link">Dowiedz się więcej</a>
                    </div>
                </div>
                <div class="cookie-banner-actions">
                    <button class="cookie-btn cookie-btn-reject" data-action="reject">
                        <i class="fas fa-times"></i>
                        Odrzuć opcjonalne
                    </button>
                    <button class="cookie-btn cookie-btn-settings" data-action="settings">
                        <i class="fas fa-cog"></i>
                        Ustawienia
                    </button>
                    <button class="cookie-btn cookie-btn-accept" data-action="accept">
                        <i class="fas fa-check"></i>
                        Akceptuj wszystkie
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add event listeners
        this.setupBannerEventListeners();
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'cookie-settings-modal';
        modal.id = 'cookieSettingsModal';
        
        modal.innerHTML = `
            <div class="cookie-settings-content">
                <div class="cookie-settings-header">
                    <h3 class="cookie-settings-title">Ustawienia plików cookies</h3>
                    <button class="cookie-close-btn" data-action="close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Niezbędne</span>
                        <div class="cookie-toggle active disabled" data-category="necessary"></div>
                    </div>
                    <div class="cookie-category-description">
                        Te pliki cookies są niezbędne do działania strony internetowej i nie można ich wyłączyć w naszych systemach. Zazwyczaj są ustawiane tylko w odpowiedzi na działania wykonane przez Ciebie, które stanowią żądanie usług.
                    </div>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Funkcjonalne</span>
                        <div class="cookie-toggle" data-category="functional"></div>
                    </div>
                    <div class="cookie-category-description">
                        Te pliki cookies umożliwiają stronie internetowej zapamiętanie wyborów, które podejmujesz (takich jak nazwa użytkownika, język lub region) i zapewnienie ulepszonych, bardziej osobistych funkcji.
                    </div>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Analityczne</span>
                        <div class="cookie-toggle" data-category="analytics"></div>
                    </div>
                    <div class="cookie-category-description">
                        Te pliki cookies pozwalają nam liczyć wizyty i źródła ruchu, dzięki czemu możemy mierzyć i poprawiać wydajność naszej strony. Pomagają nam wiedzieć, które strony są najbardziej i najmniej popularne.
                    </div>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Marketingowe</span>
                        <div class="cookie-toggle" data-category="marketing"></div>
                    </div>
                    <div class="cookie-category-description">
                        Te pliki cookies mogą być ustawiane przez naszych partnerów reklamowych za pośrednictwem naszej strony internetowej. Mogą być używane przez te firmy do tworzenia profilu Twoich zainteresowań.
                    </div>
                </div>
                
                <div class="cookie-settings-actions">
                    <button class="cookie-btn cookie-btn-reject" data-action="reject-modal">
                        Odrzuć opcjonalne
                    </button>
                    <button class="cookie-btn cookie-btn-accept" data-action="save-settings">
                        Zapisz ustawienia
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for modal
        this.setupModalEventListeners();
        
        // Update toggles based on current settings
        this.updateSettingsDisplay();
    }

    showBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            setTimeout(() => {
                banner.classList.add('show');
            }, 1000); // Show banner 1 second after page load
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 400);
        }
    }

    showSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.add('show');
            this.updateSettingsDisplay();
        }
    }

    hideSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    updateSettingsDisplay() {
        Object.keys(this.cookieSettings).forEach(category => {
            const toggle = document.querySelector(`[data-category="${category}"]`);
            if (toggle) {
                if (this.cookieSettings[category]) {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
                
                // Add click listener for toggles (except necessary)
                if (category !== 'necessary' && !toggle.classList.contains('disabled')) {
                    toggle.addEventListener('click', () => this.toggleCategory(category));
                }
            }
        });
    }

    toggleCategory(category) {
        if (category !== 'necessary') {
            this.cookieSettings[category] = !this.cookieSettings[category];
            this.updateSettingsDisplay();
        }
    }

    acceptAll() {
        this.cookieSettings = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true
        };
        
        this.saveConsent();
        this.hideBanner();
        this.hideSettings();
        this.applyCookieSettings();
    }

    rejectAll() {
        this.cookieSettings = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false
        };
        
        this.saveConsent();
        this.hideBanner();
        this.hideSettings();
        this.applyCookieSettings();
    }

    saveSettings() {
        this.saveConsent();
        this.hideBanner();
        this.hideSettings();
        this.applyCookieSettings();
    }

    saveConsent() {
        localStorage.setItem('cookieConsent', JSON.stringify(this.cookieSettings));
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        
        // Set cookie expiry (365 days)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.cookie = `cookieConsent=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    }

    applyCookieSettings() {
        // Apply functional cookies
        if (this.cookieSettings.functional) {
            this.enableFunctionalCookies();
        } else {
            this.disableFunctionalCookies();
        }
        
        // Apply analytics cookies
        if (this.cookieSettings.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        
        // Apply marketing cookies
        if (this.cookieSettings.marketing) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }
    }

    enableFunctionalCookies() {
        // Enable functional features like preferences saving
        console.log('Functional cookies enabled');
    }

    disableFunctionalCookies() {
        // Remove functional cookies
        this.removeCookiesByPattern('user_preferences');
        console.log('Functional cookies disabled');
    }

    enableAnalytics() {
        // Enable Google Analytics or other analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
        console.log('Analytics cookies enabled');
    }

    disableAnalytics() {
        // Disable analytics and remove analytics cookies
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
        this.removeCookiesByPattern('_ga');
        this.removeCookiesByPattern('_gid');
        console.log('Analytics cookies disabled');
    }

    enableMarketing() {
        // Enable marketing cookies
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'granted'
            });
        }
        console.log('Marketing cookies enabled');
    }

    disableMarketing() {
        // Disable marketing and remove marketing cookies
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'denied'
            });
        }
        this.removeCookiesByPattern('_fbp');
        console.log('Marketing cookies disabled');
    }

    removeCookiesByPattern(pattern) {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.includes(pattern)) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            }
        });
    }

    // Method to reset consent (for testing or user request)
    resetConsent() {
        localStorage.removeItem('cookieConsent');
        localStorage.removeItem('cookieConsentDate');
        document.cookie = 'cookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        location.reload();
    }

    setupBannerEventListeners() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            const rejectBtn = banner.querySelector('.cookie-btn-reject');
            const settingsBtn = banner.querySelector('.cookie-btn-settings');
            const acceptBtn = banner.querySelector('.cookie-btn-accept');

            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => this.rejectAll());
            }
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => this.showSettings());
            }
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => this.acceptAll());
            }
        }
    }

    setupModalEventListeners() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            const closeBtn = modal.querySelector('.cookie-close-btn');
            const rejectBtn = modal.querySelector('.cookie-btn-reject');
            const acceptBtn = modal.querySelector('.cookie-btn-accept');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideSettings());
            }
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => this.rejectAll());
            }
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => this.saveSettings());
            }
        }
    }
}

// Global function to open cookie settings from anywhere
function openCookieSettings() {
    if (window.cookieBanner) {
        window.cookieBanner.showSettings();
    }
}

// Initialize cookie banner when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize banner only if not already done
    if (!window.cookieBanner) {
        window.cookieBanner = new CookieBanner();
    }
});

// Listen for clicks outside modal to close it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('cookieSettingsModal');
    if (modal && modal.classList.contains('show') && event.target === modal) {
        if (window.cookieBanner) {
            window.cookieBanner.hideSettings();
        }
    }
}); 