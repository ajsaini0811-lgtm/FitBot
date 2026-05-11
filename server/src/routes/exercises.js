const express = require('express');
const { EXERCISES, searchExercises } = require('../utils/exerciseData');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/exercises?q=bench&bodyPart=chest&cat=strength&difficulty=beginner&equipment=barbell
router.get('/', requireAuth, (req, res) => {
  const { q, bodyPart, cat, difficulty, equipment } = req.query;
  const results = searchExercises({ q, bodyPart, cat, difficulty, equipment });
  res.json(results);
});

// GET /api/exercises/:id
router.get('/:id', requireAuth, (req, res) => {
  const exercise = EXERCISES.find(e => e.id === Number(req.params.id));
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json(exercise);
});

module.exports = router;
