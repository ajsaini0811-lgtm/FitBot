const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireCoach } = require('../middleware/requireCoach');

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ── GET /api/groups — list groups for current user ────────
router.get('/', async (req, res) => {
  try {
    const isCoach = req.user.role === 'COACH';
    let groups;

    if (isCoach) {
      groups = await prisma.coachGroup.findMany({
        where: { coachId: req.user.id },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1,
            include: { sender: { select: { id: true, name: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      const memberships = await prisma.coachGroupMember.findMany({
        where: { userId: req.user.id },
        include: {
          group: {
            include: {
              coach: { select: { id: true, name: true } },
              members: { include: { user: { select: { id: true, name: true } } } },
              messages: { orderBy: { createdAt: 'desc' }, take: 1,
                include: { sender: { select: { id: true, name: true } } } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });
      groups = memberships.map(m => m.group);
    }

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/groups — create group (coach only) ──────────
router.post('/', requireCoach, async (req, res) => {
  try {
    const { name, description, memberIds = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });

    // Verify all memberIds are this coach's clients
    const clients = await prisma.user.findMany({
      where: { id: { in: memberIds }, coachId: req.user.id },
      select: { id: true },
    });
    const validIds = clients.map(c => c.id);

    const group = await prisma.coachGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        coachId: req.user.id,
        members: {
          create: validIds.map(userId => ({ userId })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        messages: [],
      },
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/groups/:id — update name/desc (coach only) ───
router.put('/:id', requireCoach, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await prisma.coachGroup.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const updated = await prisma.coachGroup.update({
      where: { id: group.id },
      data: { name: name || group.name, description: description ?? group.description },
      include: { members: { include: { user: { select: { id: true, name: true } } } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/groups/:id (coach only) ───────────────────
router.delete('/:id', requireCoach, async (req, res) => {
  try {
    const group = await prisma.coachGroup.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await prisma.coachGroup.delete({ where: { id: group.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/groups/:id/members  { userId } (coach only) ─
router.post('/:id/members', requireCoach, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await prisma.coachGroup.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const client = await prisma.user.findFirst({
      where: { id: userId, coachId: req.user.id },
    });
    if (!client) return res.status(400).json({ error: 'User is not your client' });

    await prisma.coachGroupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId } },
      create: { groupId: group.id, userId },
      update: {},
    });

    const updated = await prisma.coachGroup.findUnique({
      where: { id: group.id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/groups/:id/members/:userId (coach only) ───
router.delete('/:id/members/:userId', requireCoach, async (req, res) => {
  try {
    const group = await prisma.coachGroup.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    await prisma.coachGroupMember.deleteMany({
      where: { groupId: group.id, userId: req.params.userId },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/groups/:id/messages ─────────────────────────
router.get('/:id/messages', async (req, res) => {
  try {
    // Verify access: coach or member
    const group = await prisma.coachGroup.findUnique({ where: { id: req.params.id } });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = await prisma.coachGroupMember.findFirst({
      where: { groupId: group.id, userId: req.user.id },
    });
    if (group.coachId !== req.user.id && !isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const messages = await prisma.coachGroupMessage.findMany({
      where: { groupId: group.id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/groups/:id/messages  { content } ────────────
router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const group = await prisma.coachGroup.findUnique({ where: { id: req.params.id } });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = await prisma.coachGroupMember.findFirst({
      where: { groupId: group.id, userId: req.user.id },
    });
    if (group.coachId !== req.user.id && !isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const msg = await prisma.coachGroupMessage.create({
      data: { groupId: group.id, senderId: req.user.id, content: content.trim() },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    // Touch updatedAt on group for ordering
    await prisma.coachGroup.update({ where: { id: group.id }, data: { updatedAt: new Date() } });

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/groups/:id — single group detail ─────────────
router.get('/:id', async (req, res) => {
  try {
    const group = await prisma.coachGroup.findUnique({
      where: { id: req.params.id },
      include: {
        coach: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = group.members.some(m => m.userId === req.user.id);
    if (group.coachId !== req.user.id && !isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
