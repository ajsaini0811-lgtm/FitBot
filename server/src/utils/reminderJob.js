const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendWeeklyReminder } = require('./mailer');

const prisma = new PrismaClient();

// Every Sunday at 9:00 AM
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

    console.log(`📧 Sending reminders to ${users.length} user(s)...`);
    for (const user of users) {
      try {
        await sendWeeklyReminder(user.email, user.name);
        console.log(`✅ Reminder sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to send reminder to ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Reminder job failed:', err.message);
  }
});

console.log('⏰ Weekly reminder cron job scheduled (Sundays 9 AM)');
