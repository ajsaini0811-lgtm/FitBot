const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { EXERCISES, searchExercises } = require('../utils/exerciseData');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Convert a CustomExercise DB row into the same shape as static exercises
function formatCustom(ex) {
  return {
    id: `custom_${ex.id}`,
    name: ex.name,
    cat: ex.cat,
    muscle: ex.muscle,
    bodyPart: ex.bodyPart,
    difficulty: ex.difficulty,
    equipment: ex.equipment,
    instructions: ex.instructions || [],
    tips: ex.tips || [],
    defaultSets: ex.defaultSets || 3,
    defaultReps: ex.defaultReps || '10',
    isCustom: true,
    coachId: ex.coachId,
  };
}

// GET /api/exercises?q=bench&bodyPart=chest&cat=strength&difficulty=beginner&equipment=barbell
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, bodyPart, cat, difficulty, equipment } = req.query;
    const staticResults = searchExercises({ q, bodyPart, cat, difficulty, equipment });

    // Fetch custom exercises and apply same filters
    const where = {};
    if (q)         where.name       = { contains: q, mode: 'insensitive' };
    if (bodyPart)  where.bodyPart   = bodyPart;
    if (cat)       where.cat        = cat;
    if (difficulty) where.difficulty = difficulty;
    if (equipment) where.equipment  = equipment;

    const customRaw = await prisma.customExercise.findMany({ where, orderBy: { createdAt: 'desc' } });
    const customResults = customRaw.map(formatCustom);

    res.json([...staticResults, ...customResults]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exercises/:id  (supports custom_<cuid> IDs too)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('custom_')) {
      const cuid = id.replace('custom_', '');
      const ex = await prisma.customExercise.findUnique({ where: { id: cuid } });
      if (!ex) return res.status(404).json({ error: 'Exercise not found' });
      return res.json(formatCustom(ex));
    }
    const exercise = EXERCISES.find(e => e.id === Number(id));
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
