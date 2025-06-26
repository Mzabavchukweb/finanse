// Index page interactions - replacing onclick handlers
document.addEventListener('DOMContentLoaded', function() {
    // User authentication check
    checkUserLogin();
    
    // Logout button handler
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // Search focus from mobile nav
    const navSearchBtn = document.getElementById('nav-search');
    if (navSearchBtn) {
        navSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
            return false;
        });
    }
    
    // Scroll animations setup
    setupScrollAnimations();
    
    // Newsletter form handling
    setupNewsletterForm();
    
    // Vehicle search form
    setupVehicleSearch();
    
    // Mobile menu handling
    setupMobileMenu();
});

// User authentication functions
function checkUserLogin() {
    const token = localStorage.getItem('authToken') || 
                 localStorage.getItem('token') || 
                 localStorage.getItem('adminToken') ||
                 sessionStorage.getItem('authToken') ||
                 sessionStorage.getItem('token') ||
                 sessionStorage.getItem('adminToken');
    
    const user = JSON.parse(localStorage.getItem('user') || 'null') ||
                JSON.parse(sessionStorage.getItem('user') || 'null') ||
                JSON.parse(localStorage.getItem('adminUser') || 'null') ||
                JSON.parse(sessionStorage.getItem('adminUser') || 'null');
    
    const userGreeting = document.getElementById('userGreeting');
    const defaultActions = document.getElementById('defaultActions');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const accountBtn = document.getElementById('accountBtn');
    const catalogBtn = document.getElementById('catalogBtn');
    
    // Check if admin
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'admin') {
                setupAdminInterface(userGreeting, defaultActions, welcomeMessage, accountBtn, catalogBtn);
                return;
            }
        } catch (e) {
            console.log('Could not parse token', e);
        }
    }
    
    if (token && user) {
        setupUserInterface(user, userGreeting, defaultActions, welcomeMessage, accountBtn, catalogBtn);
    } else {
        setupGuestInterface(userGreeting, defaultActions, welcomeMessage, accountBtn);
    }
}

function setupAdminInterface(userGreeting, defaultActions, welcomeMessage, accountBtn, catalogBtn) {
    if (userGreeting) {
        document.getElementById('userName').textContent = 'Administrator';
        const userIconLink = userGreeting.querySelector('.user-icon-link');
        if (userIconLink) {
            userIconLink.href = 'pages/admin.html';
            userIconLink.title = 'Panel administratora';
        }
        userGreeting.style.display = 'flex';
    }
    if (defaultActions) defaultActions.style.display = 'none';
    if (welcomeMessage) welcomeMessage.textContent = 'Witaj z powrotem, Administrator!';
    if (accountBtn) {
        accountBtn.style.display = 'inline-flex';
        accountBtn.href = 'pages/admin.html';
        accountBtn.innerHTML = '<i class="fas fa-cog" aria-hidden="true"></i> Panel administratora';
    }
    if (catalogBtn) catalogBtn.textContent = 'Zarządzaj katalogiem';
}

function setupUserInterface(user, userGreeting, defaultActions, welcomeMessage, accountBtn, catalogBtn) {
    if (userGreeting) {
        const userName = user.firstName || user.email?.split('@')[0] || 'Użytkowniku';
        document.getElementById('userName').textContent = userName;
        const userIconLink = userGreeting.querySelector('.user-icon-link');
        if (userIconLink) {
            userIconLink.href = 'pages/account.html';
            userIconLink.title = 'Panel użytkownika';
        }
        userGreeting.style.display = 'flex';
    }
    if (defaultActions) defaultActions.style.display = 'none';
    if (welcomeMessage) welcomeMessage.textContent = `Witaj z powrotem, ${user.firstName || 'Użytkowniku'}!`;
    if (accountBtn) {
        accountBtn.style.display = 'inline-flex';
        accountBtn.href = 'pages/account.html';
        accountBtn.innerHTML = '<i class="fas fa-user-circle" aria-hidden="true"></i> Moje konto';
    }
    if (catalogBtn) catalogBtn.textContent = 'Przeglądaj katalog z cenami';
}

function setupGuestInterface(userGreeting, defaultActions, welcomeMessage, accountBtn) {
    if (userGreeting) userGreeting.style.display = 'none';
    if (defaultActions) defaultActions.style.display = 'flex';
    if (welcomeMessage) welcomeMessage.textContent = 'Witaj w Cartechstore';
    if (accountBtn) accountBtn.style.display = 'none';
}

function logoutUser() {
    // Clear all user data completely
    localStorage.clear();
    sessionStorage.clear();
    
    // Specifically remove known keys
    ['user', 'token', 'authToken', 'adminUser', 'adminToken', 'cartItems', 'wishlistItems'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Refresh page to show logged out state
    window.location.reload();
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observe all animated elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
    
    // Staggered animation for features
    const features = document.querySelectorAll('.feature.animate-on-scroll');
    features.forEach((feature, index) => {
        feature.style.transitionDelay = `${index * 0.1}s`;
    });
}

function setupNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            if (email) {
                // Here you would typically send to backend
                console.log('Newsletter signup:', email);
                alert('Dziękujemy za zapisanie się do newslettera!');
                form.reset();
            }
        });
    });
}

function setupVehicleSearch() {
    const searchForm = document.querySelector('.vehicle-search .search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(searchForm);
            // Handle vehicle search logic here
            console.log('Vehicle search submitted');
        });
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navOverlay = document.querySelector('.nav-overlay');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && navOverlay && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('nav-open');
        });
        
        navOverlay.addEventListener('click', function() {
            mainNav.classList.remove('nav-open');
        });
    }
} 