const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

router.use(auth);

// Client: GET my bookings
router.get('/', async (req, res) => {
  const where = req.user.role === 'COACH'
    ? { coachId: req.user.id }
    : { clientId: req.user.id };
  const data = await prisma.sessionBooking.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, email: true } },
      coach:  { select: { id: true, name: true, specialization: true } }
    },
    orderBy: { requestedAt: 'desc' }
  });
  res.json(data);
});

// Client: POST request a session
router.post('/', async (req, res) => {
  if (req.user.role === 'COACH') return res.status(403).json({ error: 'Coaches cannot book sessions' });
  const { requestedAt, durationMin, topic } = req.body;
  const client = await prisma.user.findUnique({ where: { id: req.user.id }, select: { coachId: true } });
  if (!client?.coachId) return res.status(400).json({ error: 'You have no assigned coach' });
  const b = await prisma.sessionBooking.create({
    data: { clientId: req.user.id, coachId: client.coachId, requestedAt: new Date(requestedAt), durationMin: durationMin || 60, topic },
    include: { coach: { select: { id: true, name: true } } }
  });
  res.json(b);
});

// Coach: PUT update status
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'COACH') return res.status(403).json({ error: 'Coach only' });
  const { status, coachNote } = req.body;
  const b = await prisma.sessionBooking.updateMany({
    where: { id: req.params.id, coachId: req.user.id },
    data: { status, coachNote }
  });
  res.json(b);
});

// Client: DELETE cancel booking
router.delete('/:id', async (req, res) => {
  await prisma.sessionBooking.updateMany({
    where: { id: req.params.id, clientId: req.user.id, status: 'pending' },
    data: { status: 'cancelled' }
  });
  res.json({ ok: true });
});

module.exports = router;
