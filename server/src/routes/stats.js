const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/stats/today
router.get('/today', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [foodAgg, workoutCount, latestWeight] = await Promise.all([
      prisma.foodLog.aggregate({
        where: { userId: req.user.id, date: { gte: start, lte: end } },
        _sum: { calories: true, proteinG: true, carbsG: true, fatG: true },
      }),
      prisma.workoutSession.count({
        where: { userId: req.user.id, date: { gte: start, lte: end } },
      }),
      prisma.weightLog.findFirst({
        where: { userId: req.user.id },
        orderBy: { loggedAt: 'desc' },
      }),
    ]);

    res.json({
      caloriesIn:   Math.round(foodAgg._sum.calories || 0),
      proteinG:     Math.round(foodAgg._sum.proteinG || 0),
      carbsG:       Math.round(foodAgg._sum.carbsG || 0),
      fatG:         Math.round(foodAgg._sum.fatG || 0),
      workoutCount,
      calorieBudget:  req.user.calorieBudget || 2000,
      proteinGoalG:   req.user.proteinGoalG || 150,
      carbGoalG:      req.user.carbGoalG || 200,
      fatGoalG:       req.user.fatGoalG || 65,
      currentWeightKg: latestWeight?.weightKg || req.user.weightKg || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today stats: ' + err.message });
  }
});

// GET /api/stats/week — last 7 days of {date, calories, workoutCount}
router.get('/week', requireAuth, async (req, res) => {
  try {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const [foodAgg, workoutCount] = await Promise.all([
        prisma.foodLog.aggregate({
          where: { userId: req.user.id, date: { gte: start, lte: end } },
          _sum: { calories: true },
        }),
        prisma.workoutSession.count({
          where: { userId: req.user.id, date: { gte: start, lte: end } },
        }),
      ]);

      result.push({
        date: d.toISOString().split('T')[0],
        calories: Math.round(foodAgg._sum.calories || 0),
        workoutCount,
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch week stats: ' + err.message });
  }
});

module.exports = router;
