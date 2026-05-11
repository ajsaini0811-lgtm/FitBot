const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendOtpEmail, sendPasswordResetEmail, sendAccountDeletionEmail } = require('../utils/mailer');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email },
      update: { otp, userData: { name, email, password: hashedPassword }, expiresAt },
      create: { email, otp, userData: { name, email, password: hashedPassword }, expiresAt },
    });

    await sendOtpEmail(email, name, otp);
    res.json({ step: 'verify', email, message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/verify-registration
router.post('/verify-registration', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const record = await prisma.emailVerification.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ error: 'No verification pending for this email' });
    if (new Date() > record.expiresAt) {
      await prisma.emailVerification.delete({ where: { email } });
      return res.status(400).json({ error: 'OTP expired. Please register again.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    const userData = record.userData;
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      },
    });

    await prisma.emailVerification.delete({ where: { email } });

    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond the same way to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset code has been sent.' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email },
      update: { otp, userData: { type: 'reset', email }, expiresAt },
      create: { email, otp, userData: { type: 'reset', email }, expiresAt },
    });

    await sendPasswordResetEmail(email, user.name, otp);
    res.json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reset email: ' + err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const record = await prisma.emailVerification.findUnique({ where: { email } });
    if (!record) return res.status(400).json({ error: 'No reset request found. Please request a new code.' });
    if (new Date() > record.expiresAt) {
      await prisma.emailVerification.delete({ where: { email } });
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid code. Please try again.' });
    if (record.userData?.type !== 'reset') return res.status(400).json({ error: 'Invalid reset request.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    await prisma.emailVerification.delete({ where: { email } });

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
});

// POST /api/auth/request-delete — send OTP to confirm account deletion
router.post('/request-delete', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email: user.email },
      update: { otp, userData: { type: 'delete', email: user.email }, expiresAt },
      create: { email: user.email, otp, userData: { type: 'delete', email: user.email }, expiresAt },
    });

    await sendAccountDeletionEmail(user.email, user.name, otp);
    res.json({ message: 'Deletion code sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send deletion code: ' + err.message });
  }
});

// DELETE /api/auth/account — permanently delete user after OTP verification
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'Verification code is required' });

    const user = req.user;
    const record = await prisma.emailVerification.findUnique({ where: { email: user.email } });
    if (!record) return res.status(400).json({ error: 'No deletion request found. Please request a new code.' });
    if (new Date() > record.expiresAt) {
      await prisma.emailVerification.delete({ where: { email: user.email } });
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid code. Please try again.' });
    if (record.userData?.type !== 'delete') return res.status(400).json({ error: 'Invalid deletion request.' });

    await prisma.emailVerification.delete({ where: { email: user.email } });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account: ' + err.message });
  }
});

module.exports = router;
