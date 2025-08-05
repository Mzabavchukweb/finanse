// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadHeaderComponent();
    loadFooterComponent();
    initializeMobileMenu();
    initializeExpandableServices();
    initializeContactForm();
    setActiveNavigation();
    initializeScrollAnimations();
    initializeRippleEffects();
    initializeParticleBackground();
    initializeCounterAnimations();
    initializeCalculator();
    initializeFAQ();
    initializeSmoothSections();
    initializeServicesTabs();
    initializeCookieConsent();
});

// Load Header Component
function loadHeaderComponent() {
    const headerElement = document.getElementById('header-component');
    if (headerElement) {
        headerElement.innerHTML = `
            <div class="container">
                <div class="header-content">
                    <a href="index.html" class="logo">
                        <div class="logo-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                                <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="logo-text">
                            <span class="logo-main">Elite Capital</span>
                            <span class="logo-sub">Management</span>
                        </div>
                    </a>
                    <div class="header-right">
                        <div class="contact-info">
                            <a href="tel:+48600494868">+48 600 494 868</a>
                            <a href="mailto:biuro@elitecapitalmanagement.pl">biuro@elitecapitalmanagement.pl</a>
                        </div>
                        <nav>
                            <ul class="nav-menu">
                                <li><a href="index.html">Home</a></li>
                                <li><a href="pages/o-nas.html">O nas</a></li>
                                <li><a href="pages/uslugi.html">Usługi</a></li>
                                <li><a href="pages/kontakt.html">Kontakt</a></li>
                            </ul>
                        </nav>
                        <button class="mobile-menu-toggle" id="mobileMenuToggle">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
                <div class="mobile-menu" id="mobileMenu">
                    <ul class="mobile-nav-menu">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="pages/o-nas.html">O nas</a></li>
                        <li><a href="pages/uslugi.html">Usługi</a></li>
                        <li><a href="pages/kontakt.html">Kontakt</a></li>
                    </ul>
                    <div class="mobile-contact-info">
                        <a href="tel:+48600494868">+48 600 494 868</a>
                        <a href="mailto:biuro@elitecapitalmanagement.pl">biuro@elitecapitalmanagement.pl</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Load Footer Component
function loadFooterComponent() {
    const footerElement = document.getElementById('footer-component');
    if (footerElement) {
        footerElement.innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>Elite Capital Management</h3>
                        <p>SP. Z O.O.</p>
                        <p>Sienna 9, 70-542 Szczecin</p>
                        <p>NIP: 7561989101</p>
                        <p>REGON: 385302808</p>
                        <p>KRS: 0000823510</p>
                    </div>
                    <div class="footer-separator"></div>
                    <div class="footer-section">
                        <h3>Kontakt</h3>
                        <p><a href="tel:+48600494868">+48 600 494 868</a></p>
                        <p><a href="mailto:biuro@elitecapitalmanagement.pl">biuro@elitecapitalmanagement.pl</a></p>
                    </div>
                    <div class="footer-separator"></div>
                    <div class="footer-section">
                        <h3>Nawigacja</h3>
                        <nav class="footer-nav">
                            <a href="index.html">Home</a>
                            <a href="pages/o-nas.html">O nas</a>
                            <a href="pages/uslugi.html">Usługi</a>
                            <a href="pages/kontakt.html">Kontakt</a>
                        </nav>
                    </div>
                    <div class="footer-separator"></div>
                    <div class="footer-section">
                        <h3>Dokumenty prawne</h3>
                        <nav class="footer-nav">
                            <a href="pages/polityka-prywatnosci.html">Polityka prywatności</a>
                            <a href="pages/regulamin.html">Regulamin usług</a>
                            <a href="#" onclick="showCookieConsent()">Ustawienia cookies</a>
                            <a href="#" onclick="showGDPRInfo()">Informacje RODO</a>
                        </nav>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} Elite Capital Management SP. Z O.O. Wszystkie prawa zastrzeżone.</p>
                    <p class="gdpr-notice">
                        <i class="fas fa-shield-alt"></i>
                        Przetwarzanie danych zgodnie z RODO. 
                        <a href="pages/polityka-prywatnosci.html">Polityka Prywatności</a> | 
                        <a href="pages/regulamin.html">Regulamin</a>
                    </p>
                </div>
            </div>
        `;
    }
}

// Initialize Mobile Menu
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close mobile menu when clicking on a link
        const mobileNavLinks = mobileMenu.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}

// Initialize Expandable Services
function initializeExpandableServices() {
    const expandableCards = document.querySelectorAll('.expandable');
    
    expandableCards.forEach(card => {
        const moreLink = card.querySelector('.service-more');
        if (moreLink) {
            moreLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Close other expanded cards
                expandableCards.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('expanded');
                        const otherMoreLink = otherCard.querySelector('.service-more');
                        if (otherMoreLink) {
                            otherMoreLink.textContent = 'Więcej';
                        }
                    }
                });
                
                // Toggle current card
                card.classList.toggle('expanded');
                if (card.classList.contains('expanded')) {
                    this.textContent = 'Mniej';
                } else {
                    this.textContent = 'Więcej';
                }
            });
        }
    });
}

// Initialize Contact Form
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Simple validation
            const requiredFields = ['name', 'email', 'phone', 'product', 'privacy-policy', 'data-sharing'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const input = this.querySelector(`[name="${field}"]`);
                if (!formObject[field] || formObject[field].trim() === '') {
                    input.style.borderColor = '#ff6b6b';
                    isValid = false;
                } else {
                    input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }
            });
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const emailInput = this.querySelector('[name="email"]');
            if (formObject.email && !emailRegex.test(formObject.email)) {
                emailInput.style.borderColor = '#ff6b6b';
                isValid = false;
            }
            
            if (isValid) {
                // Simulate form submission
                const submitButton = this.querySelector('.submit-button');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Wysyłanie...';
                submitButton.disabled = true;
                
                setTimeout(() => {
                    alert('Dziękujemy za przesłanie formularza! Skontaktujemy się z Państwem w najbliższym czasie.');
                    this.reset();
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }, 1500);
            } else {
                alert('Proszę wypełnić wszystkie wymagane pola poprawnie.');
            }
        });
    }
}

// Set Active Navigation
function setActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a, .mobile-nav-menu a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.backgroundColor = 'rgba(13, 27, 42, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.backgroundColor = '#0D1B2A';
            header.style.backdropFilter = 'none';
        }
    }
});

// Intersection Observer for animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Initialize Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for fade-in/slide-up animation
    const animatedElements = document.querySelectorAll('.service-card, .team-member, .company-description p, h1, h2, h3');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Footer fade-in animation
    const footer = document.querySelector('footer');
    if (footer) {
        const footerObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);
        
        footerObserver.observe(footer);
    }
}

// Initialize Ripple Effects
function initializeRippleEffects() {
    const buttons = document.querySelectorAll('.cta-button, .qualify-button, .submit-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .service-card, .team-member, .company-description p, h1, h2, h3 {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
`;
document.head.appendChild(style);

// Initialize Premium Particle Background
function initializeParticleBackground() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer || window.innerWidth < 1024) return;

    // Create fewer particles for better performance
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }

    // Create new particle less frequently
    setInterval(() => {
        if (document.querySelectorAll('.particle').length < 30) {
            createParticle(particlesContainer);
        }
    }, 4000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random horizontal position
    particle.style.left = Math.random() * 100 + '%';
    
    // Random animation delay
    particle.style.animationDelay = Math.random() * 8 + 's';
    
    // Random size variation
    const size = Math.random() * 3 + 1;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 15000);
}

// Initialize Counter Animations
function initializeCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60 FPS
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Initialize Credit Calculator
function initializeCalculator() {
    const loanAmountSlider = document.getElementById('loan-amount');
    const loanPeriodSlider = document.getElementById('loan-period');
    const interestRateSlider = document.getElementById('interest-rate');
    
    const loanAmountValue = document.getElementById('loan-amount-value');
    const loanPeriodValue = document.getElementById('loan-period-value');
    const interestRateValue = document.getElementById('interest-rate-value');
    
    const monthlyPaymentDisplay = document.getElementById('monthly-payment');
    const totalCostDisplay = document.getElementById('total-cost');
    const totalInterestDisplay = document.getElementById('total-interest');
    
    if (!loanAmountSlider || !loanPeriodSlider || !interestRateSlider) return;
    
    function formatNumber(num) {
        return new Intl.NumberFormat('pl-PL').format(Math.round(num));
    }
    
    function calculateLoan() {
        const loanAmount = parseFloat(loanAmountSlider.value);
        const loanPeriod = parseFloat(loanPeriodSlider.value);
        const interestRate = parseFloat(interestRateSlider.value) / 100;
        
        // Monthly interest rate
        const monthlyRate = interestRate / 12;
        // Total number of payments
        const totalPayments = loanPeriod * 12;
        
        // Monthly payment calculation using PMT formula
        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / totalPayments;
        } else {
            monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                           (Math.pow(1 + monthlyRate, totalPayments) - 1);
        }
        
        const totalCost = monthlyPayment * totalPayments;
        const totalInterest = totalCost - loanAmount;
        
        // Update displays
        loanAmountValue.textContent = formatNumber(loanAmount);
        loanPeriodValue.textContent = loanPeriod;
        interestRateValue.textContent = interestRate.toFixed(1);
        
        monthlyPaymentDisplay.textContent = formatNumber(monthlyPayment) + ' zł';
        totalCostDisplay.textContent = formatNumber(totalCost) + ' zł';
        totalInterestDisplay.textContent = formatNumber(totalInterest) + ' zł';
    }
    
    // Add event listeners
    loanAmountSlider.addEventListener('input', calculateLoan);
    loanPeriodSlider.addEventListener('input', calculateLoan);
    interestRateSlider.addEventListener('input', calculateLoan);
    
    // Initial calculation
    calculateLoan();
}

// Initialize FAQ
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', function() {
                // Close other open items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
                
                // Smooth scroll to item if opening
                if (item.classList.contains('active')) {
                    setTimeout(() => {
                        const rect = item.getBoundingClientRect();
                        const offset = window.pageYOffset + rect.top - 100;
                        window.scrollTo({
                            top: offset,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            });
        }
    });
}

// Initialize Smooth Sections
function initializeSmoothSections() {
    const sections = document.querySelectorAll('section:not(.hero)');
    const dividers = document.querySelectorAll('.floating-divider');
    
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: 0.2
    };

    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
            }
        });
    }, observerOptions);

    // Observe all sections
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
    
    // Observe dividers with different settings
    const dividerObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        root: null,
        rootMargin: '-5% 0px -5% 0px',
        threshold: 0.1
    });

    // Set initial state for dividers
    dividers.forEach(divider => {
        divider.style.opacity = '0';
        divider.style.transform = 'translateY(30px)';
        divider.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        dividerObserver.observe(divider);
    });
}

// Enhanced Smooth Scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            // Add smooth easing
            const start = window.pageYOffset;
            const target = targetElement.getBoundingClientRect().top + start - 100;
            const distance = target - start;
            const duration = Math.min(Math.abs(distance) / 2, 1000); // Max 1 second
            
            let startTime = null;
            
            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = easeInOutCubic(timeElapsed, start, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }
            
            function easeInOutCubic(t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t*t + b;
                t -= 2;
                return c/2*(t*t*t + 2) + b;
            }
            
            requestAnimationFrame(animation);
        }
    }
});

// Initialize Services Tabs
function initializeServicesTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding tab content
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Smooth scroll to the content
                setTimeout(() => {
                    targetContent.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        });
    });
}

// Custom cursor removed for better UX

// GDPR Compliance Functions
function showCookieConsent() {
    const consentHtml = `
        <div id="cookieConsentModal" class="gdpr-modal">
            <div class="gdpr-modal-content">
                <div class="gdpr-modal-header">
                    <h3>Ustawienia plików cookies</h3>
                    <button onclick="closeGDPRModal('cookieConsentModal')" class="gdpr-close">&times;</button>
                </div>
                <div class="gdpr-modal-body">
                    <p>Nasza strona internetowa wykorzystuje pliki cookies w celu:</p>
                    <ul>
                        <li><strong>Niezbędne cookies:</strong> Zapewnienie prawidłowego funkcjonowania strony</li>
                        <li><strong>Analityczne cookies:</strong> Analiza ruchu na stronie i poprawa jej funkcjonalności</li>
                        <li><strong>Marketingowe cookies:</strong> Personalizacja treści reklamowych</li>
                    </ul>
                    <div class="cookie-settings">
                        <div class="cookie-option">
                            <label>
                                <input type="checkbox" checked disabled>
                                <span>Niezbędne cookies (zawsze aktywne)</span>
                            </label>
                        </div>
                        <div class="cookie-option">
                            <label>
                                <input type="checkbox" id="analyticsCookies">
                                <span>Analityczne cookies</span>
                            </label>
                        </div>
                        <div class="cookie-option">
                            <label>
                                <input type="checkbox" id="marketingCookies">
                                <span>Marketingowe cookies</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="gdpr-modal-footer">
                    <button onclick="saveCookieSettings()" class="gdpr-button">Zapisz ustawienia</button>
                    <button onclick="acceptAllCookies()" class="gdpr-button gdpr-button-primary">Akceptuj wszystkie</button>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('cookieConsentModal')) {
        document.body.insertAdjacentHTML('beforeend', consentHtml);
    }
    document.getElementById('cookieConsentModal').style.display = 'flex';
}

function showGDPRInfo() {
    const gdprHtml = `
        <div id="gdprInfoModal" class="gdpr-modal">
            <div class="gdpr-modal-content">
                <div class="gdpr-modal-header">
                    <h3>Informacje o ochronie danych osobowych (RODO)</h3>
                    <button onclick="closeGDPRModal('gdprInfoModal')" class="gdpr-close">&times;</button>
                </div>
                <div class="gdpr-modal-body">
                    <h4>Administrator danych:</h4>
                    <p><strong>Elite Capital Management Sp. z o.o.</strong><br>
                    Sienna 9, 70-542 Szczecin<br>
                    NIP: 7561989101 | REGON: 385302808 | KRS: 0000823510</p>
                    
                    <h4>Cele przetwarzania danych:</h4>
                    <ul>
                        <li>Świadczenie usług pośrednictwa finansowego</li>
                        <li>Kontakt w sprawie zapytań</li>
                        <li>Marketing bezpośredni (za zgodą)</li>
                        <li>Wypełnienie obowiązków prawnych</li>
                    </ul>
                    
                    <h4>Twoje prawa:</h4>
                    <ul>
                        <li>Prawo dostępu do danych</li>
                        <li>Prawo sprostowania danych</li>
                        <li>Prawo usunięcia danych</li>
                        <li>Prawo ograniczenia przetwarzania</li>
                        <li>Prawo przenoszenia danych</li>
                        <li>Prawo sprzeciwu</li>
                    </ul>
                    
                    <h4>Kontakt w sprawach RODO:</h4>
                    <p>E-mail: <a href="mailto:rodo@elitecapitalmanagement.pl">rodo@elitecapitalmanagement.pl</a><br>
                    Telefon: <a href="tel:+48600494868">+48 600 494 868</a></p>
                    
                    <p><strong>Szczegółowe informacje znajdziesz w <a href="pages/polityka-prywatnosci.html">Polityce Prywatności</a>.</strong></p>
                </div>
                <div class="gdpr-modal-footer">
                    <button onclick="closeGDPRModal('gdprInfoModal')" class="gdpr-button">Zamknij</button>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('gdprInfoModal')) {
        document.body.insertAdjacentHTML('beforeend', gdprHtml);
    }
    document.getElementById('gdprInfoModal').style.display = 'flex';
}

function closeGDPRModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveCookieSettings() {
    const analytics = document.getElementById('analyticsCookies').checked;
    const marketing = document.getElementById('marketingCookies').checked;
    
    localStorage.setItem('cookieSettings', JSON.stringify({
        analytics: analytics,
        marketing: marketing,
        timestamp: new Date().getTime()
    }));
    
    closeGDPRModal('cookieConsentModal');
    showNotification('Ustawienia cookies zostały zapisane.');
}

function acceptAllCookies() {
    localStorage.setItem('cookieSettings', JSON.stringify({
        analytics: true,
        marketing: true,
        timestamp: new Date().getTime()
    }));
    
    closeGDPRModal('cookieConsentModal');
    showNotification('Wszystkie cookies zostały zaakceptowane.');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'gdpr-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e3a8a;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add GDPR modal styles
const gdprStyles = document.createElement('style');
gdprStyles.textContent = `
    .gdpr-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    
    .gdpr-modal-content {
        background: #0D1B2A;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    
    .gdpr-modal-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .gdpr-modal-header h3 {
        margin: 0;
        color: #E5E7EB;
        font-size: 1.5rem;
    }
    
    .gdpr-close {
        background: none;
        border: none;
        color: #E5E7EB;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s;
    }
    
    .gdpr-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .gdpr-modal-body {
        padding: 20px;
        color: #E5E7EB;
    }
    
    .gdpr-modal-body h4 {
        color: #60A5FA;
        margin-top: 20px;
        margin-bottom: 10px;
    }
    
    .gdpr-modal-body ul {
        margin: 10px 0;
        padding-left: 20px;
    }
    
    .gdpr-modal-body li {
        margin: 5px 0;
    }
    
    .cookie-settings {
        margin: 20px 0;
    }
    
    .cookie-option {
        margin: 15px 0;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }
    
    .cookie-option label {
        display: flex;
        align-items: center;
        cursor: pointer;
    }
    
    .cookie-option input[type="checkbox"] {
        margin-right: 10px;
        width: 18px;
        height: 18px;
    }
    
    .gdpr-modal-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    
    .gdpr-button {
        padding: 10px 20px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: transparent;
        color: #E5E7EB;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .gdpr-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .gdpr-button-primary {
        background: #60A5FA;
        border-color: #60A5FA;
        color: white;
    }
    
    .gdpr-button-primary:hover {
        background: #3B82F6;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @media (max-width: 768px) {
        .gdpr-modal-content {
            width: 95%;
            margin: 10px;
        }
        
        .gdpr-modal-footer {
            flex-direction: column;
        }
        
        .gdpr-button {
            width: 100%;
        }
    }
`;
document.head.appendChild(gdprStyles);

// Initialize Cookie Consent Banner
function initializeCookieConsent() {
    // Check if user has already made a choice
    const cookieSettings = localStorage.getItem('cookieSettings');
    if (cookieSettings) return; // User has already made a choice
    
    // Show cookie consent banner after 2 seconds
    setTimeout(() => {
        showCookieConsentBanner();
    }, 2000);
}

function showCookieConsentBanner() {
    const bannerHtml = `
        <div id="cookieConsentBanner" class="cookie-banner">
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <h4>🍪 Używamy plików cookies</h4>
                    <p>Używamy plików cookies, aby zapewnić najlepsze doświadczenia na naszej stronie. 
                    Klikając "Akceptuję", zgadzasz się na użycie wszystkich plików cookies zgodnie z naszą 
                    <a href="pages/polityka-prywatnosci.html" target="_blank">Polityką Prywatności</a>.</p>
                </div>
                <div class="cookie-banner-buttons">
                    <button onclick="acceptAllCookiesBanner()" class="cookie-btn cookie-btn-primary">Akceptuję</button>
                    <button onclick="showCookieConsent()" class="cookie-btn cookie-btn-secondary">Ustawienia</button>
                    <button onclick="rejectCookies()" class="cookie-btn cookie-btn-secondary">Odrzuć</button>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('cookieConsentBanner')) {
        document.body.insertAdjacentHTML('beforeend', bannerHtml);
    }
}

function acceptAllCookiesBanner() {
    localStorage.setItem('cookieSettings', JSON.stringify({
        analytics: true,
        marketing: true,
        timestamp: new Date().getTime()
    }));
    
    hideCookieBanner();
    showNotification('Dziękujemy! Cookies zostały zaakceptowane.');
}

function rejectCookies() {
    localStorage.setItem('cookieSettings', JSON.stringify({
        analytics: false,
        marketing: false,
        timestamp: new Date().getTime()
    }));
    
    hideCookieBanner();
    showNotification('Cookies zostały odrzucone. Niektóre funkcje mogą być ograniczone.');
}

function hideCookieBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
        banner.style.animation = 'slideDown 0.5s ease';
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        }, 500);
    }
}

// Add cookie banner styles
const cookieBannerStyles = document.createElement('style');
cookieBannerStyles.textContent = `
    .cookie-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #0D1B2A 0%, #1e3a8a 100%);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 9999;
        animation: slideUp 0.5s ease;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .cookie-banner-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
    }
    
    .cookie-banner-text h4 {
        margin: 0 0 8px 0;
        color: #E5E7EB;
        font-size: 1.1rem;
    }
    
    .cookie-banner-text p {
        margin: 0;
        color: #D1D5DB;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .cookie-banner-text a {
        color: #60A5FA;
        text-decoration: none;
    }
    
    .cookie-banner-text a:hover {
        text-decoration: underline;
    }
    
    .cookie-banner-buttons {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }
    
    .cookie-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s;
        white-space: nowrap;
    }
    
    .cookie-btn-primary {
        background: #60A5FA;
        color: white;
    }
    
    .cookie-btn-primary:hover {
        background: #3B82F6;
        transform: translateY(-1px);
    }
    
    .cookie-btn-secondary {
        background: transparent;
        color: #E5E7EB;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .cookie-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
    }
    
    @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }
    
    @keyframes slideDown {
        from { transform: translateY(0); }
        to { transform: translateY(100%); }
    }
    
    @media (max-width: 768px) {
        .cookie-banner-content {
            flex-direction: column;
            text-align: center;
            padding: 15px;
        }
        
        .cookie-banner-buttons {
            flex-direction: column;
            width: 100%;
        }
        
        .cookie-btn {
            width: 100%;
        }
    }
    
    .gdpr-notice {
        font-size: 0.8rem;
        color: #9CA3AF;
        margin-top: 10px;
        text-align: center;
    }
    
    .gdpr-notice i {
        margin-right: 5px;
        color: #60A5FA;
    }
    
    .gdpr-notice a {
        color: #60A5FA;
        text-decoration: none;
    }
    
    .gdpr-notice a:hover {
        text-decoration: underline;
    }
`;
document.head.appendChild(cookieBannerStyles);