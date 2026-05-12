const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

router.use(auth);

// GET all templates
router.get('/', async (req, res) => {
  const data = await prisma.workoutTemplate.findMany({
    where: { userId: req.user.id },
    include: { exercises: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(data);
});

// POST create template
router.post('/', async (req, res) => {
  const { name, exercises } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const t = await prisma.workoutTemplate.create({
    data: {
      userId: req.user.id, name,
      exercises: { create: (exercises || []).map((ex, i) => ({ ...ex, order: i })) }
    },
    include: { exercises: true }
  });
  res.json(t);
});

// DELETE template
router.delete('/:id', async (req, res) => {
  await prisma.workoutTemplate.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

module.exports = router;
