// Global cart state
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Clean old cart data with PLN/zł currency
cart = cart.map(item => {
    // Remove any PLN/zł text from price if it's a string
    if (typeof item.price === 'string') {
        item.price = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    return item;
});
localStorage.setItem('cart', JSON.stringify(cart));

let discountCodes = {
    'WELCOME10': { discount: 0.1, description: '10% rabatu na pierwsze zamówienie' },
    'BLACKFRIDAY': { discount: 0.2, description: '20% rabatu Black Friday' },
    'LOYALTY15': { discount: 0.15, description: '15% rabatu dla stałych klientów' }
};
let appliedDiscount = null;

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    loadRecommendedProducts();
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const token = localStorage.getItem('authToken') || 
                         localStorage.getItem('token') || 
                         localStorage.getItem('userToken') ||
                         sessionStorage.getItem('authToken') ||
                         sessionStorage.getItem('token');
            if (!token) {
                e.preventDefault();
                showToast('Musisz być zalogowany, aby przejść do płatności', 'error');
                setTimeout(() => { window.location.href = '/pages/login.html'; }, 1500);
                return;
            }
            if (!cart.length) {
                e.preventDefault();
                showToast('Twój koszyk jest pusty!', 'error');
                setTimeout(() => { window.location.href = '/pages/catalog.html'; }, 1500);
                return;
            }
            // Zawsze przekieruj na pełną ścieżkę checkout
            checkoutBtn.setAttribute('href', '/pages/checkout.html');
        });
    }
});

// Render cart items
function renderCart() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';

    cartItemsList.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-product">
                ${item.image && item.image !== 'placeholder.jpg' ? `<img src="/images/${item.category}/${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.style.display='none';">` : ''}
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="product-number">Nr kat.: ${item.number}</div>
                    <div class="product-category">${getCategoryName(item.category)}</div>
                </div>
            </div>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                <input type="number" value="${item.quantity}" min="1" max="99" class="quantity-input" onchange="updateQuantity(${index}, parseInt(this.value))">
                <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})" title="Usuń produkt">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    updateSummary();
}

// Update cart summary
function updateSummary() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.23; // VAT 23% (polskie)
    const discountAmount = appliedDiscount ? subtotal * appliedDiscount.discount : 0;
    const shipping = subtotal >= 200 ? 0 : 15.99; // Darmowa dostawa od 200 PLN
    const total = subtotal + vat + shipping - discountAmount;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('vat').textContent = formatPrice(vat);
    document.getElementById('total').textContent = formatPrice(total);

    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    if (appliedDiscount) {
        discountRow.style.display = 'flex';
        document.getElementById('discount').textContent = formatPrice(-discountAmount);
    } else {
        discountRow.style.display = 'none';
    }

    // Update shipping (free for orders over 200 PLN)
    const shippingElement = document.getElementById('shipping');
    if (subtotal >= 200) {
        shippingElement.textContent = 'Darmowa';
        shippingElement.className = 'free-shipping';
    } else {
        shippingElement.textContent = formatPrice(shipping);
        shippingElement.className = '';
    }

    // Trigger global header update
    if (window.globalHeader) {
        window.globalHeader.refreshData();
        window.globalHeader.updateAllCounters();
    }
}

// Update quantity
function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }

    if (newQuantity > 99) {
        showToast('Maksymalna ilość to 99 sztuk', 'error');
        return;
    }

    cart[index].quantity = newQuantity;
    saveCart();
    renderCart();
    showToast('Zaktualizowano ilość produktu', 'success');
}

// Remove item from cart
function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCart();
    renderCart();
    showToast(`Usunięto ${item.name} z koszyka`, 'success');
}

// Clear entire cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Czy na pewno chcesz wyczyścić koszyk?')) {
        cart = [];
        appliedDiscount = null;
        saveCart();
        renderCart();
        showToast('Koszyk został wyczyszczony', 'success');
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Trigger custom event for global header
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

// Apply discount code
function applyDiscount() {
    const code = document.getElementById('discountCode').value.trim().toUpperCase();
    const messageElement = document.getElementById('discountMessage');

    if (!code) {
        messageElement.textContent = 'Wprowadź kod rabatowy';
        messageElement.className = 'discount-message error';
        return;
    }

    if (discountCodes[code]) {
        appliedDiscount = discountCodes[code];
        messageElement.textContent = `Zastosowano: ${appliedDiscount.description}`;
        messageElement.className = 'discount-message success';
        updateSummary();
        showToast('Kod rabatowy został zastosowany!', 'success');
    } else {
        messageElement.textContent = 'Nieprawidłowy kod rabatowy';
        messageElement.className = 'discount-message error';
    }
}

// Save for later (move to wishlist)
function saveForLater() {
    if (cart.length === 0) return;

    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    cart.forEach(item => {
        if (!wishlist.find(w => w.id === item.id)) {
            wishlist.push({
                id: item.id || item.number,
                name: item.name,
                number: item.number,
                price: item.price,
                category: item.category,
                image: item.image
            });
        }
    });
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    clearCart();
    showToast('Produkty zostały przeniesione do listy życzeń', 'success');
}

// Load recommended products
function loadRecommendedProducts() {
    const recommendedProducts = document.getElementById('recommendedProducts');
    if (!recommendedProducts) return;
    
    const recommendations = [
        { name: 'Filtr oleju premium', price: 45.99, image: 'filter1.jpg' },
        { name: 'Klocki hamulcowe ceramic', price: 89.99, image: 'brake1.jpg' },
        { name: 'Wycieraczka hybrydowa', price: 35.50, image: 'wiper1.jpg' }
    ];

    recommendedProducts.innerHTML = recommendations.map(product => `
        <div class="recommended-item" onclick="addRecommendedToCart('${product.name}', ${product.price})">
            <img src="/images/${product.image}" alt="${product.name}" onerror="this.style.display='none'">
            <div class="recommended-item-details">
                <div class="recommended-item-name">${product.name}</div>
                <div class="recommended-item-price">${formatPrice(product.price)}</div>
            </div>
        </div>
    `).join('');
}

// Add recommended product to cart
function addRecommendedToCart(name, price) {
    const newItem = {
        id: 'REC-' + Date.now(),
        name: name,
        number: 'REC-' + Date.now(),
        price: price,
        quantity: 1,
        category: 'recommended',
        image: ''
    };

    cart.push(newItem);
    saveCart();
    renderCart();
    showToast('Dodano polecany produkt do koszyka', 'success');
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN'
    }).format(price);
}

function getCategoryName(category) {
    const categories = {
        'timing-belt': 'Zestawy Rozrządu',
        'wiper-blades': 'Wycieraczki',
        'oil-filters': 'Filtry Oleju',
        'fuel-filters': 'Filtry Paliwa',
        'recommended': 'Polecane',
        'other': 'Inne'
    };
    return categories[category] || category;
}

// Global function to add products to cart (called from other pages)
window.addToCart = function(productNumber, quantity = 1, productData = null) {
    const existingItemIndex = cart.findIndex(item => item.number === productNumber);
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        if (productData) {
            cart.push({
                id: productData.id || productNumber,
                name: productData.name,
                number: productNumber,
                price: productData.price,
                quantity: quantity,
                category: productData.category,
                image: productData.image
            });
        } else {
            // Fallback if no product data provided
            cart.push({
                id: productNumber,
                name: `Produkt ${productNumber}`,
                number: productNumber,
                price: 50.00,
                quantity: quantity,
                category: 'other',
                image: ''
            });
        }
    }
    
    saveCart();
    showToast('Produkt dodany do koszyka', 'success');
};

// Auto-save cart changes
window.addEventListener('beforeunload', saveCart); 