// Enhanced Cart and Wishlist Integration
// This file provides global cart and wishlist functionality across all pages

class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        this.wishlistQuantities = JSON.parse(localStorage.getItem('wishlistQuantities') || '{}');
        
        this.init();
    }

    init() {
        this.updateHeaderCounts();
        this.bindGlobalEvents();
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveCart();
            this.saveWishlist();
        });

        // Listen for storage changes (multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                this.cart = JSON.parse(e.newValue || '[]');
                this.updateHeaderCounts();
            }
            if (e.key === 'wishlist') {
                this.wishlist = JSON.parse(e.newValue || '[]');
                this.updateHeaderCounts();
            }
        });
    }

    // Cart Methods
    addToCart(productNumber, quantity = 1, productData = null) {
        try {
            const existingItemIndex = this.cart.findIndex(item => item.number === productNumber);
            
            if (existingItemIndex > -1) {
                this.cart[existingItemIndex].quantity += quantity;
                this.showToast(`Zwiększono ilość w koszyku`, 'success');
            } else {
                if (productData) {
                    this.cart.push({
                        name: productData.name,
                        number: productNumber,
                        price: productData.price,
                        quantity: quantity,
                        category: productData.category,
                        image: productData.image
                    });
                } else {
                    // Fallback for legacy calls
                    this.cart.push({
                        name: `Produkt ${productNumber}`,
                        number: productNumber,
                        price: 50.00,
                        quantity: quantity,
                        category: 'other',
                        image: getProductImage(productNumber) || 'filtr-powietrza.jpg'
                    });
                }
                this.showToast('Dodano do koszyka!', 'success');
            }
            
            this.saveCart();
            this.updateHeaderCounts();
            this.animateCartIcon();
            
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showToast('Błąd podczas dodawania do koszyka', 'error');
            return false;
        }
    }

    removeFromCart(productNumber) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.number !== productNumber);
        
        if (this.cart.length < initialLength) {
            this.saveCart();
            this.updateHeaderCounts();
            this.showToast('Usunięto z koszyka', 'success');
            return true;
        }
        return false;
    }

    updateCartQuantity(productNumber, newQuantity) {
        const item = this.cart.find(item => item.number === productNumber);
        if (item) {
            if (newQuantity <= 0) {
                return this.removeFromCart(productNumber);
            }
            item.quantity = Math.min(newQuantity, 99);
            this.saveCart();
            this.updateHeaderCounts();
            return true;
        }
        return false;
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateHeaderCounts();
        this.showToast('Koszyk został wyczyszczony', 'success');
    }

    // Wishlist Methods
    addToWishlist(productNumber, productData = null) {
        if (this.wishlist.includes(productNumber)) {
            this.showToast('Produkt już jest na liście życzeń', 'info');
            return false;
        }

        this.wishlist.push(productNumber);
        this.wishlistQuantities[productNumber] = 1;
        
        this.saveWishlist();
        this.updateHeaderCounts();
        this.animateWishlistIcon();
        this.showToast('Dodano do listy życzeń!', 'success');
        
        return true;
    }

    removeFromWishlist(productNumber) {
        const initialLength = this.wishlist.length;
        this.wishlist = this.wishlist.filter(num => num !== productNumber);
        delete this.wishlistQuantities[productNumber];
        
        if (this.wishlist.length < initialLength) {
            this.saveWishlist();
            this.updateHeaderCounts();
            this.showToast('Usunięto z listy życzeń', 'success');
            return true;
        }
        return false;
    }

    toggleWishlist(productNumber, productData = null) {
        if (this.wishlist.includes(productNumber)) {
            return this.removeFromWishlist(productNumber);
        } else {
            return this.addToWishlist(productNumber, productData);
        }
    }

    isInWishlist(productNumber) {
        return this.wishlist.includes(productNumber);
    }

    // Transfer Methods
    moveToCartFromWishlist(productNumber, quantity = null) {
        if (!this.wishlist.includes(productNumber)) {
            return false;
        }

        const qty = quantity || this.wishlistQuantities[productNumber] || 1;
        
        // You would need to get product data here - this is a simplified version
        const success = this.addToCart(productNumber, qty);
        
        if (success) {
            this.removeFromWishlist(productNumber);
            this.showToast('Przeniesiono do koszyka!', 'success');
            return true;
        }
        
        return false;
    }

    moveToWishlistFromCart(productNumber) {
        const cartItem = this.cart.find(item => item.number === productNumber);
        if (!cartItem) return false;

        this.addToWishlist(productNumber, {
            name: cartItem.name,
            price: cartItem.price,
            category: cartItem.category,
            image: cartItem.image
        });

        this.removeFromCart(productNumber);
        this.showToast('Przeniesiono do listy życzeń!', 'success');
        return true;
    }

    // Storage Methods
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'cart',
            newValue: JSON.stringify(this.cart)
        }));
    }

    saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
        localStorage.setItem('wishlistQuantities', JSON.stringify(this.wishlistQuantities));
        
        // Trigger storage events
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'wishlist',
            newValue: JSON.stringify(this.wishlist)
        }));
    }

    // UI Update Methods
    updateHeaderCounts() {
        const cartCount = this.getCartItemCount();
        const wishlistCount = this.wishlist.length;

        // Update cart count
        const cartCountElements = document.querySelectorAll('.cart-count, #headerCartCount');
        cartCountElements.forEach(element => {
            if (element) {
                element.textContent = cartCount;
                element.style.display = cartCount > 0 ? 'block' : 'none';
            }
        });

        // Update wishlist count
        const wishlistCountElements = document.querySelectorAll('.wishlist-count, #headerWishlistCount');
        wishlistCountElements.forEach(element => {
            if (element) {
                element.textContent = wishlistCount;
                element.style.display = wishlistCount > 0 ? 'block' : 'none';
            }
        });

        // Update page-specific elements
        if (typeof updateCartSummary === 'function') {
            updateCartSummary();
        }
        if (typeof updateWishlistSummary === 'function') {
            updateWishlistSummary();
        }
    }

    // Animation Methods
    animateCartIcon() {
        const cartIcons = document.querySelectorAll('.fa-shopping-cart');
        cartIcons.forEach(icon => {
            icon.style.transform = 'scale(1.2)';
            icon.style.color = '#10b981';
            setTimeout(() => {
                icon.style.transform = '';
                icon.style.color = '';
            }, 300);
        });
    }

    animateWishlistIcon() {
        const wishlistIcons = document.querySelectorAll('.fa-heart');
        wishlistIcons.forEach(icon => {
            icon.style.transform = 'scale(1.2)';
            icon.style.color = '#ef4444';
            setTimeout(() => {
                icon.style.transform = '';
                icon.style.color = '';
            }, 300);
        });
    }

    // Utility Methods
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        document.querySelectorAll('.toast-notification').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        // Styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb',
            color: '#ffffff',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.12)',
            zIndex: '1000',
            fontWeight: '500',
            fontSize: '0.9rem',
            maxWidth: '300px',
            animation: 'slideInRight 0.3s ease-out'
        });

        // Add animation keyframes if not exists
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Event Binding
    bindGlobalEvents() {
        // Handle add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault();
                const button = e.target.closest('.add-to-cart-btn');
                const productNumber = button.dataset.number || button.getAttribute('data-number');
                
                if (productNumber) {
                    const productElement = button.closest('[data-number]') || button.closest('.product-item');
                    const quantity = productElement?.querySelector('.qty-input')?.value || 1;
                    
                    // Try to extract product data from the DOM
                    const productData = this.extractProductDataFromDOM(productElement);
                    
                    this.addToCart(productNumber, parseInt(quantity), productData);
                }
            }

            // Handle wishlist buttons
            if (e.target.closest('.wishlist-btn')) {
                e.preventDefault();
                const button = e.target.closest('.wishlist-btn');
                const productNumber = button.dataset.number || button.getAttribute('data-number');
                
                if (productNumber) {
                    const productElement = button.closest('[data-number]') || button.closest('.product-item');
                    const productData = this.extractProductDataFromDOM(productElement);
                    
                    this.toggleWishlist(productNumber, productData);
                    
                    // Update button state
                    button.classList.toggle('active');
                }
            }
        });
    }

    extractProductDataFromDOM(element) {
        if (!element) return null;

        try {
            return {
                name: element.querySelector('.product-name')?.textContent?.trim() || 'Nieznany produkt',
                price: this.extractPriceFromText(element.querySelector('.product-price')?.textContent || '0'),
                category: element.dataset.category || 'other',
                image: element.querySelector('img')?.src?.split('/').pop() || getProductImage(element.dataset.productId) || 'filtr-powietrza.jpg'
            };
        } catch (error) {
            console.warn('Could not extract product data from DOM:', error);
            return null;
        }
    }

    extractPriceFromText(priceText) {
        const match = priceText.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(',', '.'));
        }
        return 0;
    }

    // Quick Actions
    quickAddToCart(productNumber, quantity = 1) {
        return this.addToCart(productNumber, quantity);
    }

    quickAddToWishlist(productNumber) {
        return this.addToWishlist(productNumber);
    }

    // Analytics / Tracking (placeholder for future enhancement)
    trackEvent(eventName, data = {}) {
        // This could be connected to Google Analytics, Facebook Pixel, etc.
        console.log(`Track: ${eventName}`, data);
    }

    // Export/Import functionality
    exportCart() {
        return {
            cart: this.cart,
            timestamp: new Date().toISOString(),
            total: this.getCartTotal(),
            itemCount: this.getCartItemCount()
        };
    }

    exportWishlist() {
        return {
            wishlist: this.wishlist,
            quantities: this.wishlistQuantities,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize global cart manager
window.cartManager = new CartManager();

// Backward compatibility - expose methods globally
window.addToCart = (productNumber, quantity, productData) => {
    return window.cartManager.addToCart(productNumber, quantity, productData);
};

window.addToWishlist = (productNumber, productData) => {
    return window.cartManager.addToWishlist(productNumber, productData);
};

window.removeFromCart = (productNumber) => {
    return window.cartManager.removeFromCart(productNumber);
};

window.removeFromWishlist = (productNumber) => {
    return window.cartManager.removeFromWishlist(productNumber);
};

// Enhanced product interaction utilities
window.ProductInteractionUtils = {
    // Create floating add to cart button
    createFloatingCartButton(productNumber, productData) {
        const button = document.createElement('button');
        button.className = 'floating-cart-btn';
        button.innerHTML = '<i class="fas fa-shopping-cart"></i>';
        button.title = 'Dodaj do koszyka';
        
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #2563eb;
            color: white;
            border: none;
            box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
            cursor: pointer;
            z-index: 999;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        `;

        button.addEventListener('click', () => {
            window.cartManager.addToCart(productNumber, 1, productData);
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.background = '#1e40af';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.background = '#2563eb';
        });

        return button;
    },

    // Create quick view modal
    createQuickViewModal(productData) {
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.closest('.quick-view-modal').remove()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.quick-view-modal').remove()">&times;</button>
                <div class="quick-view-content">
                    <img src="/images/${productData.category}/${productData.image}" alt="${productData.name}">
                    <div class="product-details">
                        <h3>${productData.name}</h3>
                        <p class="product-number">Nr kat.: ${productData.number}</p>
                        <p class="product-price">${productData.price?.toFixed(2)} zł</p>
                        <div class="quick-actions">
                            <button class="btn btn-primary" onclick="window.cartManager.addToCart('${productData.number}', 1, ${JSON.stringify(productData).replace(/"/g, '&quot;')})">
                                Dodaj do koszyka
                            </button>
                            <button class="btn btn-secondary" onclick="window.cartManager.addToWishlist('${productData.number}', ${JSON.stringify(productData).replace(/"/g, '&quot;')})">
                                Dodaj do listy życzeń
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        return modal;
    }
};

// Auto-update counts on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.cartManager) {
        window.cartManager.updateHeaderCounts();
    }
});

console.log('Enhanced Cart & Wishlist Integration loaded successfully!');

// Add function to get real product images
function getProductImage(productId) {
    const productImages = {
        '1': 'filtr-powietrza.jpg',
        '2': 'olej-castrol.jpg', 
        '3': 'klocki-trw.jpg',
        '4': 'filtr-oleju-mann.jpg',
        '5': 'zarowka-philips.jpg',
        '6': 'tlumik-bosal.jpg'
    };
    return productImages[productId] || 'filtr-powietrza.jpg';
} 