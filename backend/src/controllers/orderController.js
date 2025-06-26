const { Order, OrderItem, Cart, CartItem, Product, User } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

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
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            const orderItem = await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            });
            
            // Include product data for email
            orderItem.product = product;
            orderItems.push(orderItem);

            // Aktualizuj stan magazynowy
            await product.update({
                stock: product.stock - item.quantity
            });
        }

        // Attach items to order for email
        order.items = orderItems;

        // Send order confirmation email
        try {
            await emailService.sendOrderConfirmation(order, req.user.email);
            console.log('✅ Order confirmation email sent to:', req.user.email);
        } catch (emailError) {
            console.error('❌ Failed to send order confirmation email:', emailError);
            // Don't fail the order creation if email fails
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

        const oldStatus = order.status;

        // Przywróć stan magazynowy
        for (const item of order.items) {
            const product = await Product.findByPk(item.productId);
            await product.update({
                stock: product.stock + item.quantity
            });
        }

        await order.update({ status: 'cancelled' });

        // Send status update email
        try {
            await emailService.sendOrderStatusUpdate(order, req.user.email, oldStatus, 'cancelled');
            console.log('✅ Order cancellation email sent to:', req.user.email);
        } catch (emailError) {
            console.error('❌ Failed to send cancellation email:', emailError);
        }

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
                { 
                    model: OrderItem, 
                    as: 'items',
                    include: [Product] 
                },
                { 
                    model: require('../models/User'), 
                    as: 'user', 
                    attributes: ['email', 'firstName', 'lastName', 'companyName'] 
                }
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
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product'
                    }]
                },
                {
                    model: require('../models/User'),
                    as: 'user',
                    attributes: ['email', 'firstName', 'lastName']
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;
        await order.update({ status });

        // Send status update email to customer
        try {
            if (order.user && order.user.email && oldStatus !== status) {
                await emailService.sendOrderStatusUpdate(order, order.user.email, oldStatus, status);
                console.log(`✅ Order status update email sent to: ${order.user.email} (${oldStatus} → ${status})`);
            }
        } catch (emailError) {
            console.error('❌ Failed to send status update email:', emailError);
        }

        console.log('Akcja: aktualizacja statusu zamówienia', {
            userId: req.user.id,
            orderId: order.id,
            oldStatus,
            newStatus: status
        });

        res.json({ 
            message: 'Order status updated successfully',
            oldStatus,
            newStatus: status 
        });
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
