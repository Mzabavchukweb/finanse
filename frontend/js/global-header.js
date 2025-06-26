// Global Header Management System
class GlobalHeader {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        this.init();
    }

    init() {
        // Initialize header counters on page load
        this.updateAllCounters();
        
        // Listen for storage changes (from other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart' || e.key === 'wishlist') {
                this.refreshData();
                this.updateAllCounters();
            }
        });

        // Custom event listeners for same-tab updates
        document.addEventListener('cartUpdated', () => {
            this.refreshData();
            this.updateAllCounters();
        });

        document.addEventListener('wishlistUpdated', () => {
            this.refreshData();
            this.updateAllCounters();
        });
    }

    refreshData() {
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    }

    updateAllCounters() {
        this.updateCartCounter();
        this.updateWishlistCounter();
    }

    updateCartCounter() {
        const cartCount = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const headerCartCount = document.getElementById('headerCartCount');
        
        if (headerCartCount) {
            headerCartCount.textContent = cartCount;
            headerCartCount.style.display = cartCount > 0 ? 'flex' : 'none';
            
            // Add animation for changes
            if (cartCount > 0) {
                headerCartCount.parentElement.classList.add('has-items');
                this.animateCounter(headerCartCount);
            } else {
                headerCartCount.parentElement.classList.remove('has-items');
            }
        }

        // Update mobile nav counter if exists
        const mobileCartCount = document.getElementById('cart-count');
        if (mobileCartCount) {
            mobileCartCount.textContent = cartCount;
            mobileCartCount.style.display = cartCount > 0 ? 'block' : 'none';
        }
    }

    updateWishlistCounter() {
        const wishlistCount = this.wishlist.length;
        const headerWishlistCount = document.getElementById('headerWishlistCount');
        
        if (headerWishlistCount) {
            headerWishlistCount.textContent = wishlistCount;
            headerWishlistCount.style.display = wishlistCount > 0 ? 'flex' : 'none';
            
            // Add animation for changes
            if (wishlistCount > 0) {
                headerWishlistCount.parentElement.classList.add('has-items');
                this.animateCounter(headerWishlistCount);
            } else {
                headerWishlistCount.parentElement.classList.remove('has-items');
            }
        }
    }

    animateCounter(element) {
        element.classList.remove('counter-bounce');
        void element.offsetWidth; // Force reflow
        element.classList.add('counter-bounce');
        
        setTimeout(() => {
            element.classList.remove('counter-bounce');
        }, 300);
    }

    // Helper methods for cart operations
    addToCart(product) {
        const existingIndex = this.cart.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            this.cart[existingIndex].quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        
        this.saveCart();
        this.triggerCartUpdate();
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.triggerCartUpdate();
    }

    updateCartQuantity(productId, quantity) {
        const index = this.cart.findIndex(item => item.id === productId);
        if (index > -1) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.cart[index].quantity = quantity;
                this.saveCart();
                this.triggerCartUpdate();
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.triggerCartUpdate();
    }

    // Helper methods for wishlist operations
    addToWishlist(product) {
        const exists = this.wishlist.find(item => item.id === product.id);
        if (!exists) {
            this.wishlist.push(product);
            this.saveWishlist();
            this.triggerWishlistUpdate();
            return true;
        }
        return false;
    }

    removeFromWishlist(productId) {
        this.wishlist = this.wishlist.filter(item => item.id !== productId);
        this.saveWishlist();
        this.triggerWishlistUpdate();
    }

    isInWishlist(productId) {
        return this.wishlist.some(item => item.id === productId);
    }

    // Storage operations
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    }

    // Event triggers
    triggerCartUpdate() {
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { cart: this.cart }
        }));
    }

    triggerWishlistUpdate() {
        document.dispatchEvent(new CustomEvent('wishlistUpdated', {
            detail: { wishlist: this.wishlist }
        }));
    }

    // Get current counts
    getCartCount() {
        return this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    getWishlistCount() {
        return this.wishlist.length;
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
}

// Global Header Styles
const headerStyles = `
<style>
    .header-action-button.has-items {
        animation: headerGlow 2s ease-in-out infinite alternate;
    }
    
    .counter-bounce {
        animation: counterBounce 0.3s ease-out;
    }
    
    @keyframes headerGlow {
        0% {
            box-shadow: 0 0 5px rgba(37, 99, 235, 0.3);
        }
        100% {
            box-shadow: 0 0 15px rgba(37, 99, 235, 0.6);
        }
    }
    
    @keyframes counterBounce {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }
    
    .cart-count, .wishlist-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1;
        z-index: 10;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header-action-button {
        position: relative;
    }
    
    /* Mobile navigation badge */
    .mobile-nav-link .badge {
        position: absolute;
        top: 5px;
        right: 8px;
        background: #ef4444;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 0.7rem;
        min-width: 18px;
        text-align: center;
        line-height: 1.2;
    }
</style>
`;

// Inject styles
if (!document.getElementById('global-header-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'global-header-styles';
    styleElement.innerHTML = headerStyles;
    document.head.appendChild(styleElement);
}

// Initialize global header system
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.globalHeader = new GlobalHeader();
        });
    } else {
        window.globalHeader = new GlobalHeader();
    }
    
    // Global convenience functions
    window.addToCart = (product) => {
        if (window.globalHeader) {
            return window.globalHeader.addToCart(product);
        }
        return false;
    };
    
    window.removeFromCart = (productId) => {
        if (window.globalHeader) {
            window.globalHeader.removeFromCart(productId);
        }
    };
    
    window.addToWishlist = (product) => {
        if (window.globalHeader) {
            return window.globalHeader.addToWishlist(product);
        }
        return false;
    };
    
    window.removeFromWishlist = (productId) => {
        if (window.globalHeader) {
            window.globalHeader.removeFromWishlist(productId);
        }
    };
    
    window.isInWishlist = (productId) => {
        if (window.globalHeader) {
            return window.globalHeader.isInWishlist(productId);
        }
        return false;
    };
} 