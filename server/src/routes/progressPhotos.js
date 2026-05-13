const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.use(requireAuth);

// GET photos for current user
router.get('/', async (req, res) => {
  const photos = await prisma.progressPhoto.findMany({
    where: { userId: req.user.id },
    orderBy: { takenAt: 'desc' },
    take: 50
  });
  res.json(photos);
});

// POST upload photo
router.post('/', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const b64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder: 'fitbot/progress', resource_type: 'image' });
    const photo = await prisma.progressPhoto.create({
      data: { userId: req.user.id, imageUrl: result.secure_url, caption: req.body.caption || null }
    });
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE photo
router.delete('/:id', async (req, res) => {
  const photo = await prisma.progressPhoto.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!photo) return res.status(404).json({ error: 'Not found' });
  // Extract public_id from URL and delete from Cloudinary
  try {
    const parts = photo.imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const publicId = `fitbot/progress/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch {}
  await prisma.progressPhoto.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
