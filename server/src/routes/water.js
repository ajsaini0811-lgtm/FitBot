const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/water/today — today's total glasses
router.get('/today', requireAuth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await prisma.waterLog.findMany({
      where: { userId: req.user.id, loggedAt: { gte: start } },
    });
    const total = logs.reduce((sum, l) => sum + l.glasses, 0);
    res.json({ total, goal: 8 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/water — log glasses { glasses: 1 }
router.post('/', requireAuth, async (req, res) => {
  try {
    const glasses = Math.max(1, Math.min(10, Number(req.body.glasses) || 1));
    const log = await prisma.waterLog.create({
      data: { userId: req.user.id, glasses },
    });

    // Return updated today total
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await prisma.waterLog.findMany({
      where: { userId: req.user.id, loggedAt: { gte: start } },
    });
    const total = logs.reduce((sum, l) => sum + l.glasses, 0);
    res.json({ total, goal: 8 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/water/undo — remove last glass logged today
router.delete('/undo', requireAuth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const last = await prisma.waterLog.findFirst({
      where: { userId: req.user.id, loggedAt: { gte: start } },
      orderBy: { loggedAt: 'desc' },
    });
    if (last) {
      if (last.glasses > 1) {
        await prisma.waterLog.update({ where: { id: last.id }, data: { glasses: last.glasses - 1 } });
      } else {
        await prisma.waterLog.delete({ where: { id: last.id } });
      }
    }
    const logs = await prisma.waterLog.findMany({
      where: { userId: req.user.id, loggedAt: { gte: start } },
    });
    const total = logs.reduce((sum, l) => sum + l.glasses, 0);
    res.json({ total, goal: 8 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
