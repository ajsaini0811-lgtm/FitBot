const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/chat?limit=50
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat: ' + err.message });
  }
});

// POST /api/chat — save one message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { role, content, metadata } = req.body;
    if (!role || !content) return res.status(400).json({ error: 'role and content are required' });

    const msg = await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        role,
        content,
        metadata: metadata || null,
      },
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message: ' + err.message });
  }
});

// DELETE /api/chat — clear all chat history for user
router.delete('/', requireAuth, async (req, res) => {
  try {
    await prisma.chatMessage.deleteMany({ where: { userId: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat: ' + err.message });
  }
});

module.exports = router;
