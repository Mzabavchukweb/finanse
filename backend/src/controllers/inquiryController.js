const { Inquiry, InquiryItem, Product, User } = require('../models');

// Create a new inquiry
exports.createInquiry = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, message, quantity } = req.body;

        // Validate required fields
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Please provide a valid quantity' });
        }

        // Check if product exists and is active
        const product = await Product.findOne({
            where: {
                id: productId,
                isActive: true
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found or inactive' });
        }

        // Check if user exists and is active
        const user = await User.findOne({
            where: {
                id: userId,
                status: 'active'
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or inactive' });
        }

        // Create inquiry
        const inquiry = await Inquiry.create({
            userId,
            status: 'pending',
            message
        });

        // Create inquiry item
        await InquiryItem.create({
            inquiryId: inquiry.id,
            productId,
            quantity
        });

        // Return created inquiry with related data
        const createdInquiry = await Inquiry.findByPk(inquiry.id, {
            include: [
                {
                    model: InquiryItem,
                    as: 'inquiryItems',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email', 'companyName', 'phone']
                }
            ]
        });

        res.status(201).json(createdInquiry);
    } catch (error) {
        console.error('Error creating inquiry:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while creating inquiry' });
    }
};

// Get all user inquiries
exports.getUserInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: InquiryItem,
                    as: 'inquiryItems',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email', 'companyName', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(inquiries);
    } catch (error) {
        console.error('Error getting user inquiries:', error);
        res.status(500).json({ message: 'Server error while fetching inquiries' });
    }
};

// Get inquiry by ID
exports.getInquiryById = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByPk(req.params.id, {
            include: [
                {
                    model: InquiryItem,
                    as: 'inquiryItems',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email', 'companyName', 'phone']
                }
            ]
        });

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        // Check if user is authorized to view this inquiry
        if (inquiry.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(inquiry);
    } catch (error) {
        console.error('Error getting inquiry by ID:', error);
        res.status(500).json({ message: 'Server error while fetching inquiry' });
    }
};

// Update inquiry status (admin only)
exports.updateInquiryStatus = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status } = req.body;
        const allowedStatuses = ['pending', 'responded', 'accepted', 'rejected'];

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const inquiry = await Inquiry.findByPk(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        await inquiry.update({ status });

        // Return updated inquiry with related data
        const updatedInquiry = await Inquiry.findByPk(inquiry.id, {
            include: [
                {
                    model: InquiryItem,
                    as: 'inquiryItems',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email', 'companyName', 'phone']
                }
            ]
        });

        res.json(updatedInquiry);
    } catch (error) {
        console.error('Error updating inquiry status:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while updating inquiry status' });
    }
};

// Cancel inquiry
exports.cancelInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByPk(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        // Check if user is authorized to cancel this inquiry
        if (inquiry.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only allow cancellation if inquiry is still pending
        if (inquiry.status !== 'pending') {
            return res.status(400).json({ message: 'Can only cancel pending inquiries' });
        }

        await inquiry.update({ status: 'cancelled' });

        // Return updated inquiry with related data
        const updatedInquiry = await Inquiry.findByPk(inquiry.id, {
            include: [
                {
                    model: InquiryItem,
                    as: 'inquiryItems',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email', 'companyName', 'phone']
                }
            ]
        });

        res.json(updatedInquiry);
    } catch (error) {
        console.error('Error cancelling inquiry:', error);
        res.status(500).json({ message: 'Server error while cancelling inquiry' });
    }
};

// Get all inquiries (admin only)
exports.getAllInquiries = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const inquiries = await Inquiry.findAll({
            include: [
                {
                    model: InquiryItem,
                    as: 'inquiryItems',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email', 'companyName', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(inquiries);
    } catch (error) {
        console.error('Error getting all inquiries:', error);
        res.status(500).json({ message: 'Server error while fetching inquiries' });
    }
};
