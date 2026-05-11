const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireCoach } = require('../middleware/requireCoach');
const { sendWeeklyReminder } = require('../utils/mailer');

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth, requireCoach);

// GET /api/coach-analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { coachId: req.user.id },
      select: {
        id: true, name: true, email: true, goal: true, weightKg: true,
        calorieBudget: true,
        weightLogs:      { orderBy: { loggedAt: 'desc' }, take: 2 },
        foodLogs:        { where: { date: { gte: new Date(Date.now() - 7 * 86400000) } }, select: { date: true, calories: true } },
        workoutSessions: { where: { date: { gte: new Date(Date.now() - 7 * 86400000) } }, select: { date: true } },
      },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const analytics = clients.map(c => {
      const lastLog = c.foodLogs[0];
      const lastWeightLog = c.weightLogs[0];
      const daysSinceLog = lastLog
        ? Math.floor((Date.now() - new Date(lastLog.date)) / 86400000)
        : null;
      const daysSinceWeight = lastWeightLog
        ? Math.floor((Date.now() - new Date(lastWeightLog.loggedAt)) / 86400000)
        : null;

      // Weekly avg calories
      const totalCal = c.foodLogs.reduce((s, l) => s + l.calories, 0);
      const uniqueDays = new Set(c.foodLogs.map(l => new Date(l.date).toDateString())).size;
      const avgCal = uniqueDays > 0 ? Math.round(totalCal / uniqueDays) : 0;

      // Weight change
      const wChange = c.weightLogs.length >= 2
        ? +(c.weightLogs[0].weightKg - c.weightLogs[1].weightKg).toFixed(1)
        : null;

      return {
        id: c.id, name: c.name, email: c.email, goal: c.goal,
        currentWeight: lastWeightLog?.weightKg || c.weightKg,
        weightChange: wChange,
        daysSinceLog,
        daysSinceWeight,
        workoutsThisWeek: c.workoutSessions.length,
        avgDailyCalories: avgCal,
        calorieBudget: c.calorieBudget,
        inactive: daysSinceLog === null || daysSinceLog >= 3,
      };
    });

    res.json({
      totalClients: clients.length,
      inactiveClients: analytics.filter(a => a.inactive).length,
      avgWorkoutsPerClient: clients.length
        ? +(analytics.reduce((s, a) => s + a.workoutsThisWeek, 0) / clients.length).toFixed(1)
        : 0,
      clients: analytics,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach-analytics/broadcast  { subject, message }
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const clients = await prisma.user.findMany({
      where: { coachId: req.user.id },
      select: { id: true, name: true, email: true },
    });

    if (clients.length === 0) return res.status(400).json({ error: 'You have no clients to message' });

    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const coachName = req.user.name;

    let sent = 0;
    for (const client of clients) {
      // Save as a CoachMessage in DB
      await prisma.coachMessage.create({
        data: {
          senderId: req.user.id,
          receiverId: client.id,
          content: `📢 ${message}`,
        },
      });

      // Send email
      await resend.emails.send({
        from: 'FitBot <hello@fitbot.life>',
        to: client.email,
        subject: `📢 Message from Coach ${coachName}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#f9fafb;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:28px 36px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">💪 FitBot</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Message from Coach ${coachName}</p>
            </div>
            <div style="padding:32px 36px;background:white;">
              <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">Hey ${client.name}! 👋</h2>
              <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;font-size:15px;color:#111827;line-height:1.6;">
                ${message}
              </div>
              <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;text-align:center;">— Coach ${coachName}</p>
            </div>
          </div>
        `,
      }).catch(() => {});
      sent++;
    }

    res.json({ success: true, sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
