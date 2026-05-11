const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendWeeklyReminder, sendCheckinReminder } = require('./mailer');

const prisma = new PrismaClient();

// ── Weekly weight reminder — every Sunday at 9 AM ──────────
cron.schedule('0 9 * * 0', async () => {
  console.log('⏰ Running weekly weight reminder job...');
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        setupDone: true,
        role: 'USER',
        OR: [
          { weightLogs: { none: {} } },
          { weightLogs: { none: { loggedAt: { gte: sevenDaysAgo } } } },
        ],
      },
      select: { email: true, name: true },
    });

    console.log(`📧 Sending weight reminders to ${users.length} user(s)...`);
    for (const user of users) {
      try {
        await sendWeeklyReminder(user.email, user.name);
        console.log(`✅ Weight reminder sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to send weight reminder to ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Weight reminder job failed:', err.message);
  }
});

// ── Daily check-in reminders — every day at 8 AM ──────────
cron.schedule('0 8 * * *', async () => {
  const todayDay = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  console.log(`⏰ Running check-in reminders for day ${todayDay}...`);

  try {
    const users = await prisma.user.findMany({
      where: {
        setupDone: true,
        role: 'USER',
        checkinDay: todayDay,
        coachId: { not: null },
      },
      select: {
        email: true,
        name: true,
        coach: { select: { name: true } },
      },
    });

    console.log(`📧 Sending check-in reminders to ${users.length} user(s)...`);
    for (const user of users) {
      try {
        await sendCheckinReminder(user.email, user.name, user.coach?.name || 'your coach');
        console.log(`✅ Check-in reminder sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to send check-in to ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Check-in reminder job failed:', err.message);
  }
});

console.log('⏰ Cron jobs scheduled: weight reminder (Sun 9 AM) + check-in (daily 8 AM)');
