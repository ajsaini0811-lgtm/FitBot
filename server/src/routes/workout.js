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

// GET /api/workout/session?date=YYYY-MM-DD — sessions for a day
router.get('/session', requireAuth, async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date);
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: req.user.id, date: { gte: start, lte: end } },
      include: { exercises: { orderBy: { createdAt: 'asc' } } },
      orderBy: { date: 'asc' },
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions: ' + err.message });
  }
});

// GET /api/workout/history?limit=20
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: req.user.id },
      include: { exercises: true },
      orderBy: { date: 'desc' },
      take: limit,
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history: ' + err.message });
  }
});

// POST /api/workout/session — create a session with exercises
router.post('/session', requireAuth, async (req, res) => {
  try {
    const { name, notes, exercises, date } = req.body;
    if (!exercises || exercises.length === 0) {
      return res.status(400).json({ error: 'At least one exercise is required' });
    }

    const session = await prisma.workoutSession.create({
      data: {
        userId: req.user.id,
        date: date ? new Date(date) : new Date(),
        name: name || null,
        notes: notes || null,
        exercises: {
          create: exercises.map(ex => ({
            name: ex.name,
            category: ex.category,
            sets:       ex.sets       ? parseInt(ex.sets)       : null,
            reps:       ex.reps       ? parseInt(ex.reps)       : null,
            weightKg:   ex.weightKg   ? parseFloat(ex.weightKg) : null,
            durationMin: ex.durationMin ? parseInt(ex.durationMin) : null,
            distanceKm:  ex.distanceKm  ? parseFloat(ex.distanceKm) : null,
          })),
        },
      },
      include: { exercises: true },
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session: ' + err.message });
  }
});

// DELETE /api/workout/session/:id
router.delete('/session/:id', requireAuth, async (req, res) => {
  try {
    const session = await prisma.workoutSession.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await prisma.workoutSession.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete: ' + err.message });
  }
});

module.exports = router;
