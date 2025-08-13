const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Email = require('../models/Email');
const auth = require('../middleware/auth');
const sesService = require('../services/sesService');

const router = express.Router();

// @route   GET /api/emails
// @desc    Get user's emails with pagination and filtering
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['inbox', 'sent', 'draft', 'archive', 'trash']),
  query('isRead').optional().isBoolean(),
  query('search').optional().isLength({ max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { userId: req.user._id };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }
    
    if (req.query.search) {
      filter.$or = [
        { subject: { $regex: req.query.search, $options: 'i' } },
        { body: { $regex: req.query.search, $options: 'i' } },
        { 'from.email': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Get emails with pagination
    const emails = await Email.find(filter)
      .populate('replies')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalEmails = await Email.countDocuments(filter);

    // Get unread count
    const unreadCount = await Email.countDocuments({ 
      userId: req.user._id, 
      isRead: false,
      category: 'inbox'
    });

    res.json({
      emails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEmails / limit),
        totalEmails,
        hasNext: page < Math.ceil(totalEmails / limit),
        hasPrev: page > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ message: 'Server error fetching emails' });
  }
});

// @route   GET /api/emails/:id
// @desc    Get specific email by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('replies');

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Mark as read if it wasn't already
    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.json({ email });
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ message: 'Server error fetching email' });
  }
});

// @route   POST /api/emails
// @desc    Create new email (for demo purposes - simulate receiving)
// @access  Private
router.post('/', auth, [
  body('from.email').isEmail().withMessage('Valid from email is required'),
  body('from.name').optional().trim().isLength({ max: 100 }),
  body('subject').notEmpty().isLength({ max: 200 }).withMessage('Subject is required and cannot exceed 200 characters'),
  body('body').notEmpty().isLength({ max: 10000 }).withMessage('Body is required and cannot exceed 10000 characters'),
  body('priority').optional().isIn(['low', 'normal', 'high']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const emailData = {
      userId: req.user._id,
      from: {
        email: req.body.from.email,
        name: req.body.from.name || ''
      },
      to: {
        email: req.user.email,
        name: req.user.name
      },
      subject: req.body.subject,
      body: req.body.body,
      priority: req.body.priority || 'normal',
      category: 'inbox',
      metadata: {
        receivedDate: new Date(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    const email = new Email(emailData);
    await email.save();

    res.status(201).json({
      message: 'Email created successfully',
      email
    });
  } catch (error) {
    console.error('Create email error:', error);
    res.status(500).json({ message: 'Server error creating email' });
  }
});

// @route   POST /api/emails/:id/reply
// @desc    Send reply to email
// @access  Private
router.post('/:id/reply', auth, [
  body('body').notEmpty().isLength({ max: 10000 }).withMessage('Reply body is required and cannot exceed 10000 characters'),
  body('useClaudeGenerated').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const originalEmail = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!originalEmail) {
      return res.status(404).json({ message: 'Original email not found' });
    }

    const { body: replyBody, useClaudeGenerated = false } = req.body;

    // Create reply email record
    const replyEmail = new Email({
      userId: req.user._id,
      from: {
        email: req.user.email,
        name: req.user.name
      },
      to: originalEmail.from,
      subject: originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`,
      body: replyBody,
      category: 'sent',
      originalEmailId: originalEmail._id,
      metadata: {
        messageId: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: originalEmail.metadata.threadId || originalEmail._id
      }
    });

    await replyEmail.save();

    // Send email via AWS SES
    try {
      const sesResult = await sesService.sendReply({
        to: originalEmail.from.email,
        subject: originalEmail.subject,
        body: replyBody,
        originalEmailId: originalEmail._id,
        userSignature: req.user.emailSettings.signature
      });

      // Update reply with SES message ID
      replyEmail.metadata.sesMessageId = sesResult.messageId;
      await replyEmail.save();
    } catch (sesError) {
      console.error('SES send error:', sesError);
      // Continue even if SES fails - reply is still saved
    }

    // Mark original email as replied
    originalEmail.isReplied = true;
    await originalEmail.save();

    res.status(201).json({
      message: 'Reply sent successfully',
      reply: replyEmail,
      sesMessageId: replyEmail.metadata.sesMessageId
    });
  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({ message: 'Server error sending reply' });
  }
});

// @route   PUT /api/emails/:id
// @desc    Update email (mark as read, archive, etc.)
// @access  Private
router.put('/:id', auth, [
  body('isRead').optional().isBoolean(),
  body('category').optional().isIn(['inbox', 'sent', 'draft', 'archive', 'trash']),
  body('priority').optional().isIn(['low', 'normal', 'high']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Update allowed fields
    if (req.body.isRead !== undefined) email.isRead = req.body.isRead;
    if (req.body.category) email.category = req.body.category;
    if (req.body.priority) email.priority = req.body.priority;

    await email.save();

    res.json({
      message: 'Email updated successfully',
      email
    });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ message: 'Server error updating email' });
  }
});

// @route   DELETE /api/emails/:id
// @desc    Delete email permanently
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    await Email.deleteOne({ _id: req.params.id });

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({ message: 'Server error deleting email' });
  }
});

// @route   POST /api/emails/bulk-action
// @desc    Perform bulk actions on emails
// @access  Private
router.post('/bulk-action', auth, [
  body('emailIds').isArray().withMessage('Email IDs must be an array'),
  body('action').isIn(['read', 'unread', 'archive', 'delete', 'trash']).withMessage('Invalid action'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { emailIds, action } = req.body;

    let updateQuery = {};
    switch (action) {
      case 'read':
        updateQuery = { isRead: true };
        break;
      case 'unread':
        updateQuery = { isRead: false };
        break;
      case 'archive':
        updateQuery = { category: 'archive' };
        break;
      case 'trash':
        updateQuery = { category: 'trash' };
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    if (action === 'delete') {
      await Email.deleteMany({
        _id: { $in: emailIds },
        userId: req.user._id
      });
    } else {
      await Email.updateMany(
        {
          _id: { $in: emailIds },
          userId: req.user._id
        },
        updateQuery
      );
    }

    res.json({ message: `Bulk ${action} completed successfully` });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ message: 'Server error performing bulk action' });
  }
});

// @route   GET /api/emails/stats
// @desc    Get email statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Email.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalEmails: { $sum: 1 },
          unreadEmails: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          repliedEmails: { $sum: { $cond: ['$isReplied', 1, 0] } },
          inboxEmails: { $sum: { $cond: [{ $eq: ['$category', 'inbox'] }, 1, 0] } },
          sentEmails: { $sum: { $cond: [{ $eq: ['$category', 'sent'] }, 1, 0] } },
          archivedEmails: { $sum: { $cond: [{ $eq: ['$category', 'archive'] }, 1, 0] } },
        }
      }
    ]);

    const overview = stats[0] || {
      totalEmails: 0,
      unreadEmails: 0,
      repliedEmails: 0,
      inboxEmails: 0,
      sentEmails: 0,
      archivedEmails: 0,
    };

    res.json({ stats: overview });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;