const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// トラッキングデータを保存
router.post('/track', async (req, res) => {
  try {
    const analyticsData = new Analytics({
      ...req.body,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
    
    await analyticsData.save();
    res.json({ success: true, message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// アナリティクスデータを取得
router.get('/data', async (req, res) => {
  try {
    const { limit = 100, eventType } = req.query;
    const query = eventType ? { eventType } : {};
    
    const data = await Analytics
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 統計データを取得
router.get('/stats', async (req, res) => {
  try {
    const totalPageViews = await Analytics.countDocuments({ eventType: 'pageview' });
    const uniqueSessions = await Analytics.distinct('sessionId').length;
    const recentActivity = await Analytics
      .find()
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      success: true,
      stats: {
        totalPageViews,
        uniqueSessions,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
