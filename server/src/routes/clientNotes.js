const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth } = require('../middleware/auth');
const requireCoach = require('../middleware/requireCoach');

router.use(requireAuth, requireCoach);

// GET notes for a client
router.get('/:clientId', async (req, res) => {
  const notes = await prisma.clientNote.findMany({
    where: { coachId: req.user.id, clientId: req.params.clientId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(notes);
});

// POST create note
router.post('/:clientId', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const note = await prisma.clientNote.create({
    data: { coachId: req.user.id, clientId: req.params.clientId, content: content.trim() }
  });
  res.json(note);
});

// DELETE note
router.delete('/:clientId/:noteId', async (req, res) => {
  await prisma.clientNote.deleteMany({
    where: { id: req.params.noteId, coachId: req.user.id }
  });
  res.json({ ok: true });
});

module.exports = router;
