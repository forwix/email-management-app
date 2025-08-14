import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';

const router = express.Router();

// Claude API configuration
const CLAUDE_API_CONFIG = {
  baseURL: process.env.CLAUDE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01'
  }
};

// @route   POST /api/claude/generate-reply
// @desc    Generate auto-reply using Claude API
// @access  Private
router.post('/generate-reply', auth, [
  body('originalMessage')
    .notEmpty()
    .withMessage('Original message is required')
    .isLength({ max: 10000 })
    .withMessage('Original message cannot exceed 10000 characters'),
  body('context')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Context cannot exceed 1000 characters'),
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'formal', 'casual'])
    .withMessage('Tone must be one of: professional, friendly, formal, casual'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { originalMessage, context = '', tone = 'professional' } = req.body;
    const user = req.user;

    // Construct prompt for Claude
    const prompt = `
You are an AI assistant helping to generate professional email replies. Please generate a polite and appropriate email response to the following message.

Original Message:
"${originalMessage}"

Additional Context: ${context}

Tone: ${tone}

User's Signature: ${user.emailSettings.signature || ''}

Instructions:
1. Keep the reply concise and professional
2. Address the main points of the original message
3. Use an appropriate ${tone} tone
4. Include the user's signature if provided
5. Do not include any placeholder text like [Your Name] or [Company]
6. Generate only the email body content, no subject line

Reply:`;

    // Call Claude API
    const response = await axios.post(CLAUDE_API_CONFIG.baseURL, {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, CLAUDE_API_CONFIG);

    const generatedReply = response.data.content[0].text.trim();

    res.json({
      success: true,
      generatedReply,
      metadata: {
        model: 'claude-3-sonnet',
        tokens_used: response.data.usage?.output_tokens || 0,
        tone,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        message: 'Claude API authentication failed. Please check API key configuration.' 
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        message: 'Claude API rate limit exceeded. Please try again later.' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to generate reply using Claude API',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/claude/analyze-email
// @desc    Analyze email content using Claude API
// @access  Private
router.post('/analyze-email', auth, [
  body('emailContent')
    .notEmpty()
    .withMessage('Email content is required')
    .isLength({ max: 10000 })
    .withMessage('Email content cannot exceed 10000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { emailContent } = req.body;

    const prompt = `
Please analyze the following email and provide:
1. Sentiment (positive, neutral, negative)
2. Urgency level (low, medium, high)
3. Key topics/keywords (up to 5)
4. Brief summary (1-2 sentences)
5. Suggested response category (informational, action_required, urgent, marketing, personal)

Email content:
"${emailContent}"

Please respond in the following JSON format:
{
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "Brief summary of the email content",
  "category": "informational|action_required|urgent|marketing|personal"
}`;

    const response = await axios.post(CLAUDE_API_CONFIG.baseURL, {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, CLAUDE_API_CONFIG);

    let analysis;
    try {
      const responseText = response.data.content[0].text.trim();
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback if Claude doesn't return proper JSON
      analysis = {
        sentiment: 'neutral',
        urgency: 'medium',
        keywords: [],
        summary: 'Unable to analyze email content',
        category: 'informational'
      };
    }

    res.json({
      success: true,
      analysis,
      metadata: {
        model: 'claude-3-sonnet',
        tokens_used: response.data.usage?.output_tokens || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Claude analysis error:', error.response?.data || error.message);
    
    res.status(500).json({ 
      message: 'Failed to analyze email using Claude API',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/claude/health
// @desc    Check Claude API connectivity
// @access  Private
router.get('/health', auth, async (req, res) => {
  try {
    const testResponse = await axios.post(CLAUDE_API_CONFIG.baseURL, {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ]
    }, CLAUDE_API_CONFIG);

    res.json({
      status: 'healthy',
      apiKey: process.env.CLAUDE_API_KEY ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
