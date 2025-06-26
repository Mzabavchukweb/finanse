// Security utilities
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Secure token management
const TokenManager = {
    setToken(token) {
        if (token) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('tokenTimestamp', Date.now().toString());
        }
    },
    
    getToken() {
        const token = localStorage.getItem('authToken');
        const timestamp = localStorage.getItem('tokenTimestamp');
        
        if (!token || !timestamp) return null;
        
        // Check if token is older than 24 hours
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 24 * 60 * 60 * 1000) {
            this.removeToken();
            return null;
        }
        
        return token;
    },
    
    removeToken() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenTimestamp');
    }
};

// Configuration
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3005' 
        : 'https://api.cartechstore.com',
    timeout: 10000
};

window.loggedIn = !!TokenManager.getToken();

document.addEventListener('DOMContentLoaded', function() {
    // Header Hide on Scroll
    let lastScroll = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.classList.add('hide');
        } else {
            header.classList.remove('hide');
        }
        
        lastScroll = currentScroll;
    });

    // Scroll Progress Bar
    const scrollProgress = document.querySelector('.scroll-progress');
    
    window.addEventListener('scroll', () => {
        const height = document.documentElement;
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = height.scrollHeight - height.clientHeight;
        const progress = `${(scrollTop / scrollHeight) * 100}%`;
        
        scrollProgress.style.transform = `scaleX(${scrollTop / scrollHeight})`;
    });

    // Back to Top Button
    const backToTop = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Enhanced Form Interactions
    const searchInputs = document.querySelectorAll('input[type="text"], input[type="email"], select');
    
    searchInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });

    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    const navOverlay = document.querySelector('.nav-overlay');
    const body = document.body;

    function toggleMobileMenu() {
        mobileMenuBtn.classList.toggle('active');
        navList.classList.toggle('active');
        navOverlay.classList.toggle('active');
        body.style.overflow = navList.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        navList.classList.remove('active');
        navOverlay.classList.remove('active');
        body.style.overflow = '';
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-list a');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close menu on window resize if larger than mobile
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Escape key to close menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navList.classList.contains('active')) {
            closeMobileMenu();
        }
    });
});

// Enhanced fetch with security headers
async function secureFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
        const token = TokenManager.getToken();
        const response = await fetch(`${API_CONFIG.baseUrl}${url}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
            TokenManager.removeToken();
            window.loggedIn = false;
            if (window.location.pathname !== '/pages/login.html') {
                window.location.href = '/pages/login.html';
            }
            return null;
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts(); // Function to fetch and display products

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                window.showToast('Proszę wypełnić wszystkie wymagane pola', 'error');
            }
        });
    });

    // Enhanced event listener for inquire button
    document.body.addEventListener('click', async function(e) {
        if (e.target.classList.contains('inquire-btn')) {
            e.preventDefault();
            
            const productId = e.target.dataset.productId;
            const productCard = e.target.closest('.product-card');
            const productName = productCard.querySelector('.product-title')?.textContent || 'Nieznany produkt';
            
            // Check if user is logged in
            const token = TokenManager.getToken();
            if (!token) {
                window.showToast('Musisz być zalogowany, aby wysłać zapytanie.', 'error');
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 2000);
                return;
            }
            
            // Validate productId
            if (!productId || typeof productId !== 'string') {
                window.showToast('Błąd: Nieprawidłowy identyfikator produktu.', 'error');
                return;
            }
            
            try {
                e.target.disabled = true;
                e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wysyłanie...';

                const response = await secureFetch('/api/inquiries', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        productId: productId.trim(),
                        productName: productName.trim()
                    })
                });

                if (!response) return; // Request was aborted or unauthorized

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Nie udało się wysłać zapytania.');
                }

                window.showToast(`Zapytanie o "${productName}" zostało wysłane!`, 'success');
            
            } catch (error) {
                console.error('Błąd wysyłania zapytania:', error);
                const errorMessage = error.message.includes('timeout') 
                    ? 'Przekroczono czas oczekiwania. Spróbuj ponownie.'
                    : `Błąd: ${error.message}`;
                window.showToast(errorMessage, 'error');
            } finally {
                e.target.disabled = false;
                e.target.innerHTML = '<i class="fas fa-envelope"></i> Zapytaj o produkt';
            }
        }
    });
});

async function fetchProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Ładowanie produktów...</div>';

    try {
        const token = TokenManager.getToken();
        const endpoint = token ? '/api/products' : '/api/featured-products';
        
        const response = await secureFetch(endpoint);
        
        if (!response) {
            productsGrid.innerHTML = '<p class="error-message">Błąd autoryzacji. Proszę zalogować się ponownie.</p>';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const products = data.products || data;

        productsGrid.innerHTML = '';

        if (!Array.isArray(products) || products.length === 0) {
            productsGrid.innerHTML = '<p class="no-products">Nie znaleziono produktów.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        products.forEach(product => {
            try {
                const productCard = createProductCard(product);
                fragment.appendChild(productCard);
            } catch (cardError) {
                console.error('Error creating product card:', cardError, product);
            }
        });
        
        productsGrid.appendChild(fragment);

    } catch (error) {
        console.error('Error loading products:', error);
        const errorMessage = error.message.includes('timeout')
            ? 'Przekroczono czas oczekiwania. Sprawdź połączenie internetowe.'
            : 'Wystąpił błąd podczas ładowania produktów.';
        productsGrid.innerHTML = `<p class="error-message">${errorMessage}</p>`;
    }
}

function createProductCard(product) {
    const isLoggedIn = window.loggedIn;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = sanitizeHtml(product.id || product._id);

    // Secure image handling
    const defaultImage = '/images/placeholder-product.jpg';
    const productImage = product.thumbnail || product.imageUrl || defaultImage;
    
    const imageHtml = `
        <div class="product-image">
            <img src="${escapeHtml(productImage)}" 
                 alt="${escapeHtml(product.name || 'Produkt')}"
                 onerror="this.src='${defaultImage}'">
        </div>`;

    const infoHtml = `
        <div class="product-info">
            <div class="product-category">${escapeHtml(product.category || 'Brak kategorii')}</div>
            <h3 class="product-title">${escapeHtml(product.name || 'Brak nazwy')}</h3>
            <div class="product-specs">
                ${product.oemNumber ? `<span>OEM: ${escapeHtml(product.oemNumber)}</span>` : ''}
                ${product.compatibility?.brand ? `<span>Kompatybilność: ${escapeHtml(product.compatibility.brand)}</span>` : ''}
            </div>
            ${isLoggedIn && product.price ? `
            <div class="product-price">
                <span class="price-value">${parseFloat(product.price).toFixed(2)} zł</span>
            </div>
            ` : '<div class="product-price">Cena dostępna po zalogowaniu</div>'}
            ${isLoggedIn && product.availability ? `
            <div class="product-availability">
                <i class="fas fa-info-circle"></i>
                <span>Dostępność: ${escapeHtml(product.availability)}</span>
            </div>
            ` : ''}
            <button class="inquire-btn" data-product-id="${escapeHtml(product.id || product._id)}">
                <i class="fas fa-envelope"></i>
                Zapytaj o produkt
            </button>
        </div>`;

    card.innerHTML = imageHtml + infoHtml;
    return card;
}

// Add function to get real product image URLs  
function getProductImageUrl(productId) {
    const productImages = {
        '1': 'images/filtr-powietrza.jpg',
        '2': 'images/olej-castrol.jpg', 
        '3': 'images/klocki-trw.jpg',
        '4': 'images/filtr-oleju-mann.jpg',
        '5': 'images/zarowka-philips.jpg',
        '6': 'images/tlumik-bosal.jpg'
    };
    return productImages[productId] || 'images/filtr-powietrza.jpg';
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        background: var(--white);
        box-shadow: var(--shadow);
        transform: translateY(100%);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .notification.success {
        border-left: 4px solid var(--primary-color);
    }
    
    .notification.error {
        border-left: 4px solid var(--secondary-color);
    }
`;
document.head.appendChild(style);
