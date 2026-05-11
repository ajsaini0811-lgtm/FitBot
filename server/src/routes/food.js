const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function dayRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
}

// GET /api/food?date=YYYY-MM-DD
router.get('/', requireAuth, async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date);
    const logs = await prisma.foodLog.findMany({
      where: { userId: req.user.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch food logs: ' + err.message });
  }
});

// POST /api/food
router.post('/', requireAuth, async (req, res) => {
  try {
    const { mealType, foodName, quantity, calories, proteinG, carbsG, fatG, date } = req.body;
    if (!mealType || !foodName || !quantity || !calories) {
      return res.status(400).json({ error: 'mealType, foodName, quantity, and calories are required' });
    }

    const log = await prisma.foodLog.create({
      data: {
        userId: req.user.id,
        date: date ? new Date(date) : new Date(),
        mealType,
        foodName,
        quantity: parseFloat(quantity),
        calories: parseFloat(calories),
        proteinG: parseFloat(proteinG) || 0,
        carbsG:   parseFloat(carbsG) || 0,
        fatG:     parseFloat(fatG) || 0,
      },
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log food: ' + err.message });
  }
});

// DELETE /api/food/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const log = await prisma.foodLog.findUnique({ where: { id: req.params.id } });
    if (!log || log.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await prisma.foodLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete: ' + err.message });
  }
});

module.exports = router;
