const { Order, OrderItem, Cart, CartItem, Product } = require('../models');
const { Op } = require('sequelize');

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            include: [{
                model: OrderItem,
                include: [Product]
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
                include: [Product]
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
        const { shippingAddress, paymentMethod } = req.body;

        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ message: 'Shipping address and payment method are required' });
        }

        // Get user's cart
        const cart = await Cart.findOne({
            where: { userId: req.user.id },
            include: [{
                model: CartItem,
                include: [Product]
            }]
        });

        if (!cart || !cart.CartItems.length) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total amount
        const totalAmount = cart.CartItems.reduce((total, item) => {
            return total + (item.Product.price * item.quantity);
        }, 0);

        // Create order
        const order = await Order.create({
            userId: req.user.id,
            totalAmount,
            shippingAddress,
            paymentMethod,
            status: 'pending'
        });

        // Create order items
        const orderItems = await Promise.all(
            cart.CartItems.map(item =>
                OrderItem.create({
                    orderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.Product.price
                })
            )
        );

        // Clear cart
        await CartItem.destroy({
            where: { cartId: cart.id }
        });

        console.log('Akcja: utworzenie zamówienia', { userId: req.user.id, orderId: order.id });

        res.status(201).json({
            message: 'Order created successfully',
            order: {
                ...order.toJSON(),
                items: orderItems
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
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
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
        }

        order.status = 'cancelled';
        await order.save();

        console.log('Akcja: anulowanie zamówienia', { userId: req.user.id, orderId: order.id });

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Error cancelling order' });
    }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{
                model: OrderItem,
                include: [Product]
            }],
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
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        console.log('Akcja: zmiana statusu zamówienia', { userId: req.user.id, orderId: order.id });

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
};
