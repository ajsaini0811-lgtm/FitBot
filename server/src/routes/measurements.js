const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

router.use(auth);

// GET all measurements for user
router.get('/', async (req, res) => {
  const data = await prisma.bodyMeasurement.findMany({
    where: { userId: req.user.id },
    orderBy: { date: 'desc' },
    take: 50
  });
  res.json(data);
});

// POST new measurement
router.post('/', async (req, res) => {
  const { waistCm, chestCm, hipsCm, armsCm, thighsCm, noteText, date } = req.body;
  const m = await prisma.bodyMeasurement.create({
    data: { userId: req.user.id, waistCm, chestCm, hipsCm, armsCm, thighsCm, noteText, date: date ? new Date(date) : undefined }
  });
  res.json(m);
});

// DELETE measurement
router.delete('/:id', async (req, res) => {
  await prisma.bodyMeasurement.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

module.exports = router;
