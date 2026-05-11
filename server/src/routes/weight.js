const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/weight?days=30
router.get('/', requireAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.weightLog.findMany({
      where: { userId: req.user.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weight logs: ' + err.message });
  }
});

// POST /api/weight
router.post('/', requireAuth, async (req, res) => {
  try {
    const { weightKg, notes } = req.body;
    if (!weightKg) return res.status(400).json({ error: 'weightKg is required' });

    const log = await prisma.weightLog.create({
      data: {
        userId: req.user.id,
        weightKg: parseFloat(weightKg),
        notes: notes || null,
      },
    });

    // Also update the user's current weight
    await prisma.user.update({
      where: { id: req.user.id },
      data: { weightKg: parseFloat(weightKg) },
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log weight: ' + err.message });
  }
});

module.exports = router;
