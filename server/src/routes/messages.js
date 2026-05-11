const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/messages — list of conversation partners (last message per partner)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique partners
    const sent     = await prisma.coachMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true, createdAt: true, content: true, read: true },
      orderBy: { createdAt: 'desc' },
    });
    const received = await prisma.coachMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true, createdAt: true, content: true, read: true },
      orderBy: { createdAt: 'desc' },
    });

    // Collect unique partner IDs
    const partnerIds = new Set([
      ...sent.map(m => m.receiverId),
      ...received.map(m => m.senderId),
    ]);

    // For each partner, get their info + last message + unread count
    const conversations = await Promise.all(
      [...partnerIds].map(async partnerId => {
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, role: true },
        });
        const lastMsg = await prisma.coachMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        const unreadCount = await prisma.coachMessage.count({
          where: { senderId: partnerId, receiverId: userId, read: false },
        });
        return { partner, lastMsg, unreadCount };
      })
    );

    res.json(conversations.sort((a, b) =>
      new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0)
    ));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:partnerId — full conversation thread
router.get('/:partnerId', requireAuth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.id;

    // Verify they have a coach-client relationship
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, role: true, coachId: true, clients: { select: { id: true } } },
    });
    if (!partner) return res.status(404).json({ error: 'User not found' });

    const isCoachOfUser   = partner.role === 'COACH' && req.user.coachId === partnerId;
    const isUserOfCoach   = req.user.role === 'COACH' && partner.coachId === req.user.id;
    if (!isCoachOfUser && !isUserOfCoach) {
      return res.status(403).json({ error: 'You are not connected with this user' });
    }

    const messages = await prisma.coachMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ partner: { id: partner.id, name: partner.name, role: partner.role }, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:receiverId — send message (text + optional image)
router.post('/:receiverId', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { content = '' } = req.body;
    const userId = req.user.id;

    if (!content && !req.file) return res.status(400).json({ error: 'Message content or image is required' });

    // Verify relationship
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, coachId: true, role: true, clients: { select: { id: true } } },
    });
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const isCoachOfUser = receiver.role === 'COACH' && req.user.coachId === receiverId;
    const isUserOfCoach = req.user.role === 'COACH' && receiver.coachId === req.user.id;
    if (!isCoachOfUser && !isUserOfCoach) {
      return res.status(403).json({ error: 'You are not connected with this user' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'fitbot/progress');
    }

    const message = await prisma.coachMessage.create({
      data: { senderId: userId, receiverId, content, imageUrl },
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/messages/read/:partnerId — mark all messages from partner as read
router.put('/read/:partnerId', requireAuth, async (req, res) => {
  try {
    await prisma.coachMessage.updateMany({
      where: { senderId: req.params.partnerId, receiverId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
