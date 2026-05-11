const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireCoach } = require('../middleware/requireCoach');

const router = express.Router();
const prisma = new PrismaClient();

// All coach routes require auth + coach role
router.use(requireAuth, requireCoach);

// ── Clients ─────────────────────────────────────────────

// GET /api/coach/clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { coachId: req.user.id },
      select: {
        id: true, name: true, email: true, weightKg: true, goal: true,
        goalWeight: true, calorieBudget: true, setupDone: true, createdAt: true,
        weightLogs: { orderBy: { loggedAt: 'desc' }, take: 1 },
        assignedPlans: { where: { isActive: true }, select: { id: true, name: true } },
        assignedDiets: { where: { isActive: true }, select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coach/clients/:clientId
router.get('/clients/:clientId', async (req, res) => {
  try {
    const client = await prisma.user.findFirst({
      where: { id: req.params.clientId, coachId: req.user.id },
      select: {
        id: true, name: true, email: true, age: true, gender: true,
        heightCm: true, weightKg: true, goal: true, goalWeight: true,
        activityLevel: true, calorieBudget: true, proteinGoalG: true,
        carbGoalG: true, fatGoalG: true, setupDone: true,
        weightLogs: { orderBy: { loggedAt: 'desc' }, take: 30 },
        workoutSessions: {
          orderBy: { date: 'desc' }, take: 10,
          include: { exercises: true },
        },
        assignedPlans: {
          include: { days: { include: { exercises: { orderBy: { order: 'asc' } } } } },
          orderBy: { createdAt: 'desc' },
        },
        assignedDiets: {
          include: { meals: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/clients/add  { email }
router.post('/clients/add', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const client = await prisma.user.findUnique({ where: { email } });
    if (!client) return res.status(404).json({ error: 'No user found with that email' });
    if (client.role === 'COACH') return res.status(400).json({ error: 'Cannot add a coach as a client' });
    if (client.coachId) return res.status(400).json({ error: 'This user already has a coach' });
    if (client.id === req.user.id) return res.status(400).json({ error: 'You cannot add yourself as a client' });

    const updated = await prisma.user.update({
      where: { id: client.id },
      data: { coachId: req.user.id },
      select: { id: true, name: true, email: true, weightKg: true, goal: true },
    });
    res.json({ success: true, client: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coach/search-users?q=AJ  — search users by name to add as client
router.get('/search-users', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 1) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        name: { startsWith: q, mode: 'insensitive' },
        role: 'USER',
        coachId: null,          // not already assigned to a coach
        id: { not: req.user.id }, // not the coach themselves
        setupDone: true,
      },
      select: { id: true, name: true, email: true },
      take: 8,
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coach/clients/:clientId
router.delete('/clients/:clientId', async (req, res) => {
  try {
    const client = await prisma.user.findFirst({
      where: { id: req.params.clientId, coachId: req.user.id },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    await prisma.user.update({
      where: { id: client.id },
      data: { coachId: null },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Workout Plans ────────────────────────────────────────

// GET /api/coach/plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.workoutPlan.findMany({
      where: { coachId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        days: { include: { exercises: { orderBy: { order: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/plans
// Body: { userId, name, description?, days: [{ dayName, dayNumber, exercises: [...] }] }
router.post('/plans', async (req, res) => {
  try {
    const { userId, name, description, days = [] } = req.body;
    if (!userId || !name) return res.status(400).json({ error: 'userId and name are required' });

    // Verify client belongs to this coach
    const client = await prisma.user.findFirst({ where: { id: userId, coachId: req.user.id } });
    if (!client) return res.status(403).json({ error: 'This user is not your client' });

    // Deactivate previous active plans for this client
    await prisma.workoutPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        coachId: req.user.id,
        userId,
        name,
        description,
        days: {
          create: days.map(day => ({
            dayName: day.dayName,
            dayNumber: day.dayNumber,
            exercises: {
              create: (day.exercises || []).map((ex, idx) => ({
                name: ex.name,
                sets: ex.sets || null,
                reps: ex.reps || null,
                weightNote: ex.weightNote || null,
                duration: ex.duration || null,
                notes: ex.notes || null,
                order: idx,
              })),
            },
          })),
        },
      },
      include: {
        days: { include: { exercises: { orderBy: { order: 'asc' } } } },
        user: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/coach/plans/:id
router.put('/plans/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const updated = await prisma.workoutPlan.update({
      where: { id: req.params.id },
      data: { name, description, isActive },
      include: { days: { include: { exercises: true } }, user: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coach/plans/:id
router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    await prisma.workoutPlan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Diet Plans ───────────────────────────────────────────

// GET /api/coach/diets
router.get('/diets', async (req, res) => {
  try {
    const diets = await prisma.dietPlan.findMany({
      where: { coachId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        meals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(diets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/diets
// Body: { userId, name, description?, totalCalories, proteinG, carbsG, fatG, meals: [...] }
router.post('/diets', async (req, res) => {
  try {
    const { userId, name, description, totalCalories, proteinG, carbsG, fatG, meals = [] } = req.body;
    if (!userId || !name || !totalCalories) return res.status(400).json({ error: 'userId, name, and totalCalories are required' });

    const client = await prisma.user.findFirst({ where: { id: userId, coachId: req.user.id } });
    if (!client) return res.status(403).json({ error: 'This user is not your client' });

    // Deactivate previous active diets for this client
    await prisma.dietPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const diet = await prisma.dietPlan.create({
      data: {
        coachId: req.user.id,
        userId,
        name,
        description,
        totalCalories: Number(totalCalories),
        proteinG: Number(proteinG || 0),
        carbsG: Number(carbsG || 0),
        fatG: Number(fatG || 0),
        meals: {
          create: meals.map(m => ({
            mealType: m.mealType,
            foods: m.foods,
            calories: Number(m.calories),
            notes: m.notes || null,
          })),
        },
      },
      include: { meals: true, user: { select: { id: true, name: true } } },
    });
    res.status(201).json(diet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/coach/diets/:id
router.put('/diets/:id', async (req, res) => {
  try {
    const { name, description, isActive, totalCalories, proteinG, carbsG, fatG } = req.body;
    const diet = await prisma.dietPlan.findFirst({ where: { id: req.params.id, coachId: req.user.id } });
    if (!diet) return res.status(404).json({ error: 'Diet plan not found' });

    const updated = await prisma.dietPlan.update({
      where: { id: req.params.id },
      data: {
        name, description, isActive,
        totalCalories: totalCalories !== undefined ? Number(totalCalories) : undefined,
        proteinG: proteinG !== undefined ? Number(proteinG) : undefined,
        carbsG: carbsG !== undefined ? Number(carbsG) : undefined,
        fatG: fatG !== undefined ? Number(fatG) : undefined,
      },
      include: { meals: true, user: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coach/diets/:id
router.delete('/diets/:id', async (req, res) => {
  try {
    const diet = await prisma.dietPlan.findFirst({ where: { id: req.params.id, coachId: req.user.id } });
    if (!diet) return res.status(404).json({ error: 'Diet plan not found' });
    await prisma.dietPlan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Custom Exercises ─────────────────────────────────────────

// GET /api/coach/exercises — list this coach's custom exercises
router.get('/exercises', async (req, res) => {
  try {
    const exercises = await prisma.customExercise.findMany({
      where: { coachId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/exercises — create a custom exercise
router.post('/exercises', async (req, res) => {
  try {
    const { name, cat, muscle, bodyPart, difficulty, equipment, instructions, tips, defaultSets, defaultReps } = req.body;
    if (!name || !cat || !muscle || !bodyPart || !difficulty || !equipment) {
      return res.status(400).json({ error: 'Name, category, muscle, bodyPart, difficulty and equipment are required' });
    }
    const exercise = await prisma.customExercise.create({
      data: {
        coachId: req.user.id,
        name: name.trim(),
        cat,
        muscle: muscle.trim(),
        bodyPart,
        difficulty,
        equipment,
        instructions: Array.isArray(instructions) ? instructions.filter(Boolean) : [],
        tips: Array.isArray(tips) ? tips.filter(Boolean) : [],
        defaultSets: defaultSets ? Number(defaultSets) : null,
        defaultReps: defaultReps || null,
      },
    });
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/coach/exercises/:id — delete a custom exercise
router.delete('/exercises/:id', async (req, res) => {
  try {
    const ex = await prisma.customExercise.findFirst({
      where: { id: req.params.id, coachId: req.user.id },
    });
    if (!ex) return res.status(404).json({ error: 'Exercise not found' });
    await prisma.customExercise.delete({ where: { id: ex.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
