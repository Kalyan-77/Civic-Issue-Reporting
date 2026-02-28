const Contact = require('../Models/Contact.js');
const Notification = require('../Models/NotificationModel.js');
const { logActivity } = require('./ActivityController');

// @desc    Submit a contact form inquiry
// @access  Public
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message, recipient } = req.body;

        if (!name || !email || !subject || !message || !recipient) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newContact = new Contact({
            name,
            email,
            subject,
            message,
            recipient
        });

        await newContact.save();

        // Create notification for the admin
        const newNotification = new Notification({
            recipient: recipient,
            type: 'CONTACT_INQUIRY',
            message: `New inquiry from ${name}: ${subject}`,
            contactId: newContact._id
        });

        await newNotification.save();

        // Log Activity if user is logged in
        if (req.session && req.session.user) {
            
            await logActivity(
                req.session.user.id || req.session.user._id,
                'SEND_INQUIRY',
                {
                    contactId: newContact._id,
                    subject: subject,
                    recipient: recipient
                },
                req.ip
            );
        }

        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('Error submitting contact form:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get contact submissions for the logged-in admin (Filtered by recipient)
// @access  Private (Admin only)
exports.getContactMessages = async (req, res) => {
    try {
        // Filter contacts where the recipient matches the logged-in user's ID
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        const contacts = await Contact.find({ recipient: req.user._id.toString() }).sort({ createdAt: -1 });
        res.json({ success: true, contacts });
    } catch (err) {
        console.error('Error fetching contact messages:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// @desc    Mark a contact message as read
// @access  Private (Admin only)
exports.markAsRead = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Ensure the recipient is the one marking it as read
        if (contact.recipient !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        contact.status = 'read';
        await contact.save();

        res.json({ success: true, message: 'Message marked as read' });
    } catch (err) {
        console.error('Error marking message as read:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Mark all messages as read for the logged-in admin
// @access  Private (Admin only)
exports.markAllAsRead = async (req, res) => {
    try {
        await Contact.updateMany(
            { recipient: req.user._id.toString(), status: 'new' },
            { status: 'read' }
        );
        res.json({ success: true, message: 'All messages marked as read' });
    } catch (err) {
        console.error('Error marking all as read:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Toggle archive status of a message
// @access  Private (Admin only)
exports.toggleArchive = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (contact.recipient !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        contact.status = contact.status === 'archived' ? 'read' : 'archived';
        await contact.save();

        res.json({ success: true, message: `Message ${contact.status === 'archived' ? 'flagged' : 'unflagged'}` });
    } catch (err) {
        console.error('Error toggling archive:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
