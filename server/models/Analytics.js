const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, default: 'anonymous' },
  pageUrl: { type: String, required: true },
  referrer: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  eventType: {
    type: String,
    enum: ['pageview', 'click', 'scroll', 'session_start'],
    default: 'pageview'
  },
  metadata: mongoose.Schema.Types.Mixed
});

// インデックスを追加（検索高速化）
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
