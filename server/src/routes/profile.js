const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { calcBMR, calcTDEE, calcCalorieGoal, calcMacros } = require('../utils/fitness');

const router = express.Router();
const prisma = new PrismaClient();

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// GET /api/profile
router.get('/', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

// PUT /api/profile
router.put('/', requireAuth, async (req, res) => {
  try {
    const {
      name, coachName, role, specialization, bio,
      age, gender, heightCm, weightKg, goalWeight,
      goal, activityLevel,
    } = req.body;

    // If becoming a coach — simplified setup
    if (role === 'COACH') {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          role: 'COACH',
          specialization: specialization || null,
          bio: bio || null,
          setupDone: true,
        },
      });
      return res.json(safeUser(user));
    }

    let calorieBudget = null;
    let proteinGoalG = null;
    let carbGoalG = null;
    let fatGoalG = null;

    // Recalculate if we have enough data
    if (age && gender && heightCm && weightKg && goal && activityLevel) {
      const bmr = calcBMR(parseFloat(weightKg), parseFloat(heightCm), parseInt(age), gender);
      const tdee = calcTDEE(bmr, activityLevel);
      calorieBudget = calcCalorieGoal(tdee, goal);
      const macros = calcMacros(calorieBudget);
      proteinGoalG = macros.proteinGoalG;
      carbGoalG = macros.carbGoalG;
      fatGoalG = macros.fatGoalG;
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (coachName !== undefined) updateData.coachName = coachName;
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (heightCm !== undefined) updateData.heightCm = parseFloat(heightCm);
    if (weightKg !== undefined) updateData.weightKg = parseFloat(weightKg);
    if (goalWeight !== undefined) updateData.goalWeight = goalWeight ? parseFloat(goalWeight) : null;
    if (goal !== undefined) updateData.goal = goal;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (calorieBudget !== null) {
      updateData.calorieBudget = calorieBudget;
      updateData.proteinGoalG = proteinGoalG;
      updateData.carbGoalG = carbGoalG;
      updateData.fatGoalG = fatGoalG;
      updateData.setupDone = true;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json(safeUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

module.exports = router;
