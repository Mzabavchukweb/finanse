const { Cart, CartItem, Product } = require('../models');

// Pobieranie koszyka
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({
            where: { userId: req.user.id },
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        if (!cart) {
            cart = await Cart.create({ userId: req.user.id });
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się pobrać koszyka' });
    }
};

// Dodawanie produktu do koszyka
exports.addItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ message: 'Podaj prawidłowy produkt i ilość' });
        }

        // Sprawdź czy produkt istnieje i jest dostępny
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Nie znaleziono produktu' });
        }

        if (!product.isActive) {
            return res.status(400).json({ message: 'Produkt jest niedostępny' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                message: `Dostępna ilość: ${product.stock} szt.`
            });
        }

        // Pobierz lub utwórz koszyk
        const [cart] = await Cart.findOrCreate({
            where: { userId: req.user.id }
        });

        // Sprawdź czy produkt już jest w koszyku
        const existingItem = await CartItem.findOne({
            where: {
                cartId: cart.id,
                productId
            }
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({
                    message: `Łączna ilość przekracza stan magazynowy (${product.stock} szt.)`
                });
            }
            await existingItem.update({ quantity: newQuantity });
            return res.json(existingItem);
        }

        // Dodaj nowy produkt do koszyka
        const cartItem = await CartItem.create({
            cartId: cart.id,
            productId,
            quantity
        });

        res.json(cartItem);
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się dodać produktu do koszyka' });
    }
};

// Usuwanie produktu z koszyka
exports.removeItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await Cart.findOne({ where: { userId: req.user.id } });

        if (!cart) {
            return res.status(404).json({ message: 'Nie znaleziono koszyka' });
        }

        const deleted = await CartItem.destroy({
            where: {
                cartId: cart.id,
                productId
            }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Nie znaleziono produktu w koszyku' });
        }

        res.json({ message: 'Produkt usunięty z koszyka' });
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się usunąć produktu z koszyka' });
    }
};

// Aktualizacja ilości produktu w koszyku
exports.updateQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Podaj prawidłową ilość' });
        }

        const cart = await Cart.findOne({ where: { userId: req.user.id } });
        if (!cart) {
            return res.status(404).json({ message: 'Nie znaleziono koszyka' });
        }

        const cartItem = await CartItem.findOne({
            where: {
                cartId: cart.id,
                productId
            },
            include: [Product]
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Nie znaleziono produktu w koszyku' });
        }

        if (cartItem.Product.stock < quantity) {
            return res.status(400).json({
                message: `Dostępna ilość: ${cartItem.Product.stock} szt.`
            });
        }

        await cartItem.update({ quantity });
        res.json(cartItem);
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się zaktualizować koszyka' });
    }
};

// Submit inquiry
exports.submitInquiry = async (req, res) => {
    try {
        const cart = await Cart.findOne({
            where: { userId: req.user.id },
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
            return res.status(400).json({ message: 'Koszyk jest pusty' });
        }

        // Tutaj możesz dodać logikę wysyłania zapytania
        // Na przykład, zmiana statusu koszyka na "pending"
        await cart.update({ status: 'pending' });

        res.json({ message: 'Zapytanie zostało wysłane', cart });
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się wysłać zapytania' });
    }
};

// Respond to inquiry
exports.respondToInquiry = async (req, res) => {
    try {
        const { cartId } = req.params;
        const { response, price } = req.body;

        const cart = await Cart.findOne({
            where: { id: cartId },
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        if (!cart) {
            return res.status(404).json({ message: 'Nie znaleziono koszyka' });
        }

        if (cart.status !== 'pending') {
            return res.status(400).json({ message: 'Koszyk nie jest w stanie oczekiwania' });
        }

        await cart.update({
            status: 'responded',
            response,
            price
        });

        res.json({ message: 'Odpowiedź została wysłana', cart });
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się wysłać odpowiedzi' });
    }
};

// Handle inquiry response (accept/reject)
exports.handleInquiryResponse = async (req, res) => {
    try {
        const { cartId } = req.params;
        const { action } = req.body; // 'accept' lub 'reject'

        const cart = await Cart.findOne({
            where: { id: cartId, userId: req.user.id },
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        if (!cart) {
            return res.status(404).json({ message: 'Nie znaleziono koszyka' });
        }

        if (cart.status !== 'responded') {
            return res.status(400).json({ message: 'Koszyk nie ma odpowiedzi do obsłużenia' });
        }

        if (action === 'accept') {
            await cart.update({ status: 'accepted' });
            // Tutaj możesz dodać logikę tworzenia zamówienia
        } else if (action === 'reject') {
            await cart.update({ status: 'rejected' });
        } else {
            return res.status(400).json({ message: 'Nieprawidłowa akcja' });
        }

        res.json({ message: `Zapytanie zostało ${action === 'accept' ? 'zaakceptowane' : 'odrzucone'}`, cart });
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się obsłużyć odpowiedzi' });
    }
};

// Update cart item quantity
exports.updateItemQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Podaj prawidłową ilość' });
        }

        const cart = await Cart.findOne({ where: { userId: req.user.id } });
        if (!cart) {
            return res.status(404).json({ message: 'Nie znaleziono koszyka' });
        }

        const cartItem = await CartItem.findOne({
            where: {
                cartId: cart.id,
                productId
            },
            include: [Product]
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Nie znaleziono produktu w koszyku' });
        }

        if (cartItem.Product.stock < quantity) {
            return res.status(400).json({
                message: `Dostępna ilość: ${cartItem.Product.stock} szt.`
            });
        }

        await cartItem.update({ quantity });
        res.json(cartItem);
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się zaktualizować ilości w koszyku' });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ where: { userId: req.user.id } });
        if (!cart) {
            return res.status(404).json({ message: 'Nie znaleziono koszyka' });
        }
        await CartItem.destroy({ where: { cartId: cart.id } });
        res.json({ message: 'Koszyk został wyczyszczony' });
    } catch (error) {
        res.status(500).json({ message: 'Nie udało się wyczyścić koszyka' });
    }
};
