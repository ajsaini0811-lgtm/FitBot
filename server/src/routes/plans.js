const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/plan — user's active workout plan
router.get('/plan', requireAuth, async (req, res) => {
  try {
    const plan = await prisma.workoutPlan.findFirst({
      where: { userId: req.user.id, isActive: true },
      include: {
        coach: { select: { id: true, name: true } },
        days: {
          include: { exercises: { orderBy: { order: 'asc' } } },
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plan || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diet-plan — user's active diet plan
router.get('/diet-plan', requireAuth, async (req, res) => {
  try {
    const diet = await prisma.dietPlan.findFirst({
      where: { userId: req.user.id, isActive: true },
      include: {
        coach: { select: { id: true, name: true } },
        meals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(diet || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
