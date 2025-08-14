import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: {
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    name: {
      type: String,
      default: ''
    }
  },
  to: {
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    name: {
      type: String,
      default: ''
    }
  },
  subject: {
    type: String,
    required: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: true,
    maxlength: [10000, 'Email body cannot exceed 10000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isReplied: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['inbox', 'sent', 'draft', 'archive', 'trash'],
    default: 'inbox'
  },
  originalEmailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    default: null
  },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    url: String
  }],
  metadata: {
    messageId: String,
    threadId: String,
    labels: [String],
    receivedDate: {
      type: Date,
      default: Date.now
    }
  },
  autoReplyGenerated: {
    type: String,
    default: ''
  },
  claudeAnalysis: {
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    keywords: [String],
    summary: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
emailSchema.index({ userId: 1, createdAt: -1 });
emailSchema.index({ userId: 1, category: 1 });
emailSchema.index({ userId: 1, isRead: 1 });

// Virtual for reply chain
emailSchema.virtual('replies', {
  ref: 'Email',
  localField: '_id',
  foreignField: 'originalEmailId'
});

emailSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Email', emailSchema);
