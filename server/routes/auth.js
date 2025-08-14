// --- ESM 版 ---
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';          // ← .js を付ける
import auth from '../middleware/auth.js';      // ← .js を付ける

const router = Router();

// Generate JWT token
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    // 必要に応じて既存のロジックをそのまま続けてください
    return res.json({ ok: true });
  }
);

export default router; // ← これがないと「does not provide an export named 'default'」エラー
