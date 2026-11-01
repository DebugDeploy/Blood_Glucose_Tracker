import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createUser, findUserByEmail, createPasswordResetToken, findPasswordResetToken, markTokenAsUsed, updateUserPassword } from '../db/store.js';
import { sendPasswordResetEmail } from '../utils/email.js';

const router = Router();
const jwtSecret = process.env.JWT_SECRET || 'local-development-only-change-me';
function makeToken(user) { return jwt.sign({ id: user.id, name: user.name, email: user.email }, jwtSecret, { expiresIn: '7d' }); }

router.post('/register', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name,email,passwordHash });
    res.status(201).json({ token: makeToken(user), user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const foundUser = await findUserByEmail(email);
    if (!foundUser || !(await bcrypt.compare(String(req.body.password || ''), foundUser.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const { password_hash, ...user } = foundUser;
    res.json({ token: makeToken(user), user });
  } catch (error) { next(error); }
});

// Forgot Password - Request reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    
    const user = await findUserByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    }
    
    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to database
    await createPasswordResetToken(user.id, resetToken);
    
    // Send email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send email:', emailError.message);
      // Continue anyway - don't reveal if email failed
    }
    
    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
});

// Reset Password - Verify token and set new password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    
    // Find and validate token
    const resetToken = await findPasswordResetToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Update password
    await updateUserPassword(resetToken.user_id, passwordHash);
    
    // Mark token as used
    await markTokenAsUsed(token);
    
    console.log(`✅ Password reset successful for user ${resetToken.email}`);
    
    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
});

// Verify reset token (check if valid before showing reset form)
router.get('/verify-reset-token/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const resetToken = await findPasswordResetToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired reset token.' });
    }
    
    res.json({ valid: true, email: resetToken.email });
  } catch (error) {
    next(error);
  }
});

export default router;
