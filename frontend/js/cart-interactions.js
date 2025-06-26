// Cart interactions - replacing onclick handlers
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart functionality
    initializeCart();
    setupCartEventListeners();
    loadCartItems();
    loadRecommendedProducts();
});

function setupCartEventListeners() {
    // Discount button
    const discountBtn = document.querySelector('.discount-btn');
    if (discountBtn) {
        discountBtn.addEventListener('click', applyDiscount);
    }
    
    // Clear cart button
    const clearCartBtn = document.querySelector('.btn-secondary');
    if (clearCartBtn && clearCartBtn.textContent.includes('Wyczyść')) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    // Save for later button
    const saveForLaterBtn = document.querySelector('.btn-outline');
    if (saveForLaterBtn && saveForLaterBtn.textContent.includes('Zapisz na później')) {
        saveForLaterBtn.addEventListener('click', saveForLater);
    }
    
    // Quantity controls (will be set up when items are loaded)
    setupQuantityControls();
    
    // Remove item buttons (will be set up when items are loaded)
    setupRemoveButtons();
}

function initializeCart() {
    // Get cart items from localStorage
    const cartItems = getCartItems();
    updateCartDisplay(cartItems);
    updateCartSummary(cartItems);
}

function getCartItems() {
    try {
        return JSON.parse(localStorage.getItem('cartItems') || '[]');
    } catch (e) {
        console.error('Error parsing cart items:', e);
        return [];
    }
}

function saveCartItems(items) {
    try {
        localStorage.setItem('cartItems', JSON.stringify(items));
        // Update cart count in header
        updateCartCount(items.length);
    } catch (e) {
        console.error('Error saving cart items:', e);
    }
}

function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('#cart-count, #headerCartCount');
    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        }
    });
}

function applyDiscount() {
    const discountCodeInput = document.getElementById('discountCode');
    const discountMessage = document.getElementById('discountMessage');
    
    if (!discountCodeInput || !discountMessage) return;
    
    const code = discountCodeInput.value.trim().toUpperCase();
    
    if (!code) {
        showDiscountMessage('Wprowadź kod rabatowy', 'error');
        return;
    }
    
    // Simulate discount validation
    const validCodes = {
        'WELCOME10': { discount: 10, type: 'percentage' },
        'SAVE20': { discount: 20, type: 'percentage' },
        'FIRST50': { discount: 50, type: 'fixed' }
    };
    
    if (validCodes[code]) {
        const discount = validCodes[code];
        applyDiscountToCart(discount);
        showDiscountMessage(`Kod rabatowy zastosowany! Zniżka ${discount.type === 'percentage' ? discount.discount + '%' : discount.discount + ' zł'}`, 'success');
        discountCodeInput.value = '';
    } else {
        showDiscountMessage('Nieprawidłowy kod rabatowy', 'error');
    }
}

function showDiscountMessage(message, type) {
    const discountMessage = document.getElementById('discountMessage');
    if (!discountMessage) return;
    
    discountMessage.textContent = message;
    discountMessage.className = `discount-message ${type}`;
    
    setTimeout(() => {
        discountMessage.textContent = '';
        discountMessage.className = 'discount-message';
    }, 5000);
}

function applyDiscountToCart(discount) {
    // Store discount in localStorage
    localStorage.setItem('appliedDiscount', JSON.stringify(discount));
    
    // Update cart summary
    const cartItems = getCartItems();
    updateCartSummary(cartItems);
}

function clearCart() {
    if (confirm('Czy na pewno chcesz wyczyścić koszyk?')) {
        localStorage.removeItem('cartItems');
        localStorage.removeItem('appliedDiscount');
        updateCartDisplay([]);
        updateCartSummary([]);
        updateCartCount(0);
        showToast('Koszyk został wyczyszczony', 'success');
    }
}

function saveForLater() {
    const cartItems = getCartItems();
    
    if (cartItems.length === 0) {
        showToast('Koszyk jest pusty', 'warning');
        return;
    }
    
    // Save to wishlist
    let wishlistItems = [];
    try {
        wishlistItems = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
    } catch (e) {
        console.error('Error parsing wishlist:', e);
    }
    
    // Add cart items to wishlist (avoid duplicates)
    cartItems.forEach(cartItem => {
        if (!wishlistItems.find(item => item.id === cartItem.id)) {
            wishlistItems.push({
                id: cartItem.id,
                name: cartItem.name,
                price: cartItem.price,
                category: cartItem.category,
                imageUrl: cartItem.imageUrl,
                addedDate: new Date().toISOString()
            });
        }
    });
    
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    
    // Clear cart
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedDiscount');
    updateCartDisplay([]);
    updateCartSummary([]);
    updateCartCount(0);
    
    showToast('Produkty zostały zapisane na liście życzeń', 'success');
}

function setupQuantityControls() {
    // This will be called after cart items are rendered
    document.addEventListener('click', function(e) {
        if (e.target.matches('.quantity-btn')) {
            const button = e.target;
            const quantityInput = button.parentElement.querySelector('.quantity-input');
            const cartItemElement = button.closest('.cart-item');
            
            if (!quantityInput || !cartItemElement) return;
            
            const itemId = cartItemElement.dataset.itemId;
            let currentQuantity = parseInt(quantityInput.value) || 1;
            
            if (button.textContent === '+') {
                currentQuantity++;
            } else if (button.textContent === '-' && currentQuantity > 1) {
                currentQuantity--;
            }
            
            quantityInput.value = currentQuantity;
            updateItemQuantity(itemId, currentQuantity);
        }
    });
}

function setupRemoveButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.cart-item-remove') || e.target.closest('.cart-item-remove')) {
            e.preventDefault();
            const button = e.target.matches('.cart-item-remove') ? e.target : e.target.closest('.cart-item-remove');
            const cartItemElement = button.closest('.cart-item');
            
            if (!cartItemElement) return;
            
            const itemId = cartItemElement.dataset.itemId;
            removeItemFromCart(itemId);
        }
    });
}

function updateItemQuantity(itemId, newQuantity) {
    const cartItems = getCartItems();
    const itemIndex = cartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        cartItems[itemIndex].quantity = newQuantity;
        saveCartItems(cartItems);
        updateCartSummary(cartItems);
    }
}

function removeItemFromCart(itemId) {
    if (confirm('Czy na pewno chcesz usunąć ten produkt z koszyka?')) {
        const cartItems = getCartItems();
        const filteredItems = cartItems.filter(item => item.id !== itemId);
        saveCartItems(filteredItems);
        updateCartDisplay(filteredItems);
        updateCartSummary(filteredItems);
        showToast('Produkt został usunięty z koszyka', 'success');
    }
}

function updateCartDisplay(items) {
    const cartItemsContainer = document.querySelector('.cart-items-container');
    if (!cartItemsContainer) return;
    
    if (items.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Twój koszyk jest pusty</h3>
                <p>Dodaj produkty do koszyka, aby kontynuować zakupy</p>
                <a href="catalog.html" class="btn btn-primary">Przeglądaj katalog</a>
            </div>
        `;
        return;
    }
    
    const cartHTML = items.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-details">
                <img src="${item.imageUrl || '/images/placeholder-product.jpg'}" alt="${item.name}" class="cart-item-image">
                <div>
                    <h4>${item.name}</h4>
                    <span class="product-category">${item.category || 'Części samochodowe'}</span>
                </div>
            </div>
            <div class="cart-item-price">${item.price} zł</div>
            <div class="quantity-controls">
                <button class="quantity-btn">-</button>
                <input type="number" value="${item.quantity || 1}" min="1" class="quantity-input" readonly>
                <button class="quantity-btn">+</button>
            </div>
            <div class="cart-item-total">${(item.price * (item.quantity || 1)).toFixed(2)} zł</div>
            <button class="cart-item-remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    cartItemsContainer.innerHTML = cartHTML;
}

function updateCartSummary(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    // Get applied discount
    let appliedDiscount = null;
    try {
        appliedDiscount = JSON.parse(localStorage.getItem('appliedDiscount'));
    } catch (e) {
        // No discount applied
    }
    
    let discountAmount = 0;
    if (appliedDiscount) {
        if (appliedDiscount.type === 'percentage') {
            discountAmount = subtotal * (appliedDiscount.discount / 100);
        } else {
            discountAmount = appliedDiscount.discount;
        }
    }
    
    const shipping = subtotal > 200 ? 0 : 15;
    const total = subtotal - discountAmount + shipping;
    
    // Update summary display
    const summaryElements = {
        subtotal: document.querySelector('.summary-row:nth-child(1) .summary-value'),
        discount: document.querySelector('.summary-row:nth-child(2) .summary-value'),
        shipping: document.querySelector('.summary-row:nth-child(3) .summary-value'),
        total: document.querySelector('.summary-row.total .summary-value')
    };
    
    if (summaryElements.subtotal) summaryElements.subtotal.textContent = `${subtotal.toFixed(2)} zł`;
    if (summaryElements.discount) summaryElements.discount.textContent = discountAmount > 0 ? `-${discountAmount.toFixed(2)} zł` : '0 zł';
    if (summaryElements.shipping) summaryElements.shipping.textContent = shipping === 0 ? 'Darmowa' : `${shipping} zł`;
    if (summaryElements.total) summaryElements.total.textContent = `${total.toFixed(2)} zł`;
}

function loadCartItems() {
    // This function would typically load items from the backend
    // For now, it uses localStorage data
    const cartItems = getCartItems();
    updateCartDisplay(cartItems);
}

function loadRecommendedProducts() {
    // Simulate loading recommended products
    const recommendedContainer = document.getElementById('recommendedProducts');
    if (!recommendedContainer) return;
    
    const recommendedProducts = [
        { id: 'rec1', name: 'Filtr oleju', price: 25, imageUrl: '/images/oil-filter.jpg' },
        { id: 'rec2', name: 'Klocki hamulcowe', price: 85, imageUrl: '/images/brake-pads.jpg' },
        { id: 'rec3', name: 'Świece zapłonowe', price: 45, imageUrl: '/images/spark-plugs.jpg' }
    ];
    
    const recommendedHTML = recommendedProducts.map(product => `
        <div class="recommended-item" data-product-id="${product.id}">
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="recommended-item-details">
                <div class="recommended-item-name">${product.name}</div>
                <div class="recommended-item-price">${product.price} zł</div>
            </div>
        </div>
    `).join('');
    
    recommendedContainer.innerHTML = recommendedHTML;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
} 