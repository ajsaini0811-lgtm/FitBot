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

// GET /api/stats/achievements
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [foodCount, workoutCount, weightLogs, streak] = await Promise.all([
      prisma.foodLog.count({ where: { userId: uid } }),
      prisma.workoutSession.count({ where: { userId: uid } }),
      prisma.weightLog.findMany({ where: { userId: uid }, orderBy: { loggedAt: 'asc' } }),
      // reuse streak logic inline
      (async () => {
        const since = new Date(Date.now() - 90 * 86400000);
        const [f, w] = await Promise.all([
          prisma.foodLog.findMany({ where: { userId: uid, date: { gte: since } }, select: { date: true } }),
          prisma.workoutSession.findMany({ where: { userId: uid, date: { gte: since } }, select: { date: true } }),
        ]);
        const days = new Set([...f.map(l => new Date(l.date).toDateString()), ...w.map(l => new Date(l.date).toDateString())]);
        let s = 0;
        const today = new Date();
        for (let i = 0; i < 90; i++) {
          const d = new Date(today); d.setDate(today.getDate() - i);
          if (days.has(d.toDateString())) s++; else if (i > 0) break;
        }
        return s;
      })(),
    ]);

    const startWeight = weightLogs[0]?.weightKg;
    const latestWeight = weightLogs[weightLogs.length - 1]?.weightKg;
    const weightLost = startWeight && latestWeight ? +(startWeight - latestWeight).toFixed(1) : 0;

    const all = [
      { id: 'first_log',    emoji: '🌱', title: 'First Step',       desc: 'Logged your first food entry',          earned: foodCount >= 1 },
      { id: 'log_10',       emoji: '📝', title: 'Getting Serious',  desc: 'Logged food 10 times',                  earned: foodCount >= 10 },
      { id: 'log_50',       emoji: '📊', title: 'Data Nerd',        desc: 'Logged food 50 times',                  earned: foodCount >= 50 },
      { id: 'first_workout',emoji: '💪', title: 'First Sweat',      desc: 'Completed your first workout',          earned: workoutCount >= 1 },
      { id: 'workout_10',   emoji: '🏋️', title: 'Iron Habit',       desc: 'Completed 10 workouts',                 earned: workoutCount >= 10 },
      { id: 'workout_30',   emoji: '🥇', title: 'Beast Mode',       desc: 'Completed 30 workouts',                 earned: workoutCount >= 30 },
      { id: 'streak_3',     emoji: '✨', title: 'On a Roll',        desc: '3-day logging streak',                  earned: streak >= 3 },
      { id: 'streak_7',     emoji: '🔥', title: 'Week Warrior',     desc: '7-day logging streak',                  earned: streak >= 7 },
      { id: 'streak_30',    emoji: '⚡', title: 'Unstoppable',      desc: '30-day logging streak',                 earned: streak >= 30 },
      { id: 'weight_1',     emoji: '⚖️', title: 'First Weigh-in',   desc: 'Logged your first weight',              earned: weightLogs.length >= 1 },
      { id: 'weight_5',     emoji: '📉', title: '5kg Down!',        desc: 'Lost 5kg from starting weight',         earned: weightLost >= 5 },
      { id: 'weight_10',    emoji: '🏆', title: '10kg Milestone',   desc: 'Lost 10kg from starting weight',        earned: weightLost >= 10 },
    ];

    res.json({ achievements: all, earned: all.filter(a => a.earned).length, total: all.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/meal-suggestions — smart suggestions based on remaining calories
router.get('/meal-suggestions', requireAuth, async (req, res) => {
  try {
    const { suggest } = require('../utils/mealSuggestions');
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const foodAgg = await prisma.foodLog.aggregate({
      where: { userId: req.user.id, date: { gte: start, lte: end } },
      _sum: { calories: true, proteinG: true },
    });

    const consumed = Math.round(foodAgg._sum.calories || 0);
    const consumedProtein = Math.round(foodAgg._sum.proteinG || 0);
    const budget = req.user.calorieBudget || 2000;
    const proteinGoal = req.user.proteinGoalG || 150;

    res.json(suggest({
      remainingCal: budget - consumed,
      remainingProtein: proteinGoal - consumedProtein,
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/streak — consecutive days with food OR workout logged
router.get('/streak', requireAuth, async (req, res) => {
  try {
    // Get all unique days where user logged food or workout (last 90 days)
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const [foodDays, workoutDays] = await Promise.all([
      prisma.foodLog.findMany({
        where: { userId: req.user.id, date: { gte: since } },
        select: { date: true },
      }),
      prisma.workoutSession.findMany({
        where: { userId: req.user.id, date: { gte: since } },
        select: { date: true },
      }),
    ]);

    // Collect unique date strings
    const activeDays = new Set([
      ...foodDays.map(l => new Date(l.date).toISOString().split('T')[0]),
      ...workoutDays.map(l => new Date(l.date).toISOString().split('T')[0]),
    ]);

    // Count streak backwards from today
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (activeDays.has(key)) {
        streak++;
      } else if (i > 0) {
        break; // gap found
      }
    }

    res.json({ days: streak, type: 'logging' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
