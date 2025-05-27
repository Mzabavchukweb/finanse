const { Order, OrderItem, Cart, CartItem, Product, User } = require('../models');
const { Op } = require('sequelize');

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(orders);
    } catch (error) {
        console.error('Error getting user orders:', error);
        res.status(500).json({ message: 'Error retrieving orders' });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({ message: 'Error retrieving order' });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ message: 'Brak produktów w zamówieniu' });
        }

        // Sprawdź dostępność produktów
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Produkt ${product?.name || 'nieznany'} jest niedostępny w wymaganej ilości`
                });
            }
        }

        // Utwórz zamówienie
        const order = await Order.create({
            userId: req.user.id,
            status: 'pending',
            shippingAddress
        });

        // Dodaj produkty do zamówienia
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            });

            // Aktualizuj stan magazynowy
            await product.update({
                stock: product.stock - item.quantity
            });
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Błąd tworzenia zamówienia:', error);
        res.status(500).json({ message: 'Błąd tworzenia zamówienia' });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
                status: 'pending'
            },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Zamówienie nie znalezione lub nie może być anulowane' });
        }

        // Przywróć stan magazynowy
        for (const item of order.items) {
            const product = await Product.findByPk(item.productId);
            await product.update({
                stock: product.stock + item.quantity
            });
        }

        await order.update({ status: 'cancelled' });
        res.json({ message: 'Zamówienie anulowane' });
    } catch (error) {
        res.status(500).json({ message: 'Błąd anulowania zamówienia' });
    }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: OrderItem, include: [Product] },
                { model: require('../models/User'), as: 'user', attributes: ['email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error getting all orders:', error);
        res.status(500).json({ message: 'Error retrieving orders' });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findOne({
            where: { id: req.params.id },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.update({ status });

        console.log('Akcja: aktualizacja statusu zamówienia', {
            userId: req.user.id,
            orderId: order.id,
            newStatus: status
        });

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
};

// Delete order (admin only)
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Restore product stock
        await Promise.all(
            order.items.map(async (item) => {
                const product = await Product.findByPk(item.productId);
                await product.update({
                    stock: product.stock + item.quantity
                });
            })
        );

        // Delete order items
        await OrderItem.destroy({ where: { orderId: order.id } });

        // Delete order
        await order.destroy();

        console.log('Akcja: usunięcie zamówienia', { userId: req.user.id, orderId: order.id });

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order' });
    }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [{
                model: OrderItem,
                include: [Product]
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Zamówienie nie znalezione' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Błąd pobierania zamówienia' });
    }
};
