const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOtpEmail(email, name, otp) {
  const { data, error } = await resend.emails.send({
    from: 'FitBot <hello@fitbot.life>',
    to: email,
    subject: 'Your FitBot Verification Code',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">💪 FitBot</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your Personal Fitness Companion</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">Hey ${name}! 👋</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 32px;">Use this code to verify your account. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 28px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #16a34a;">${otp}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; text-align: center;">If you didn't create a FitBot account, please ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Resend error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send email');
  }

  console.log('✅ Email sent successfully. ID:', data?.id, '| To:', email);
}

async function sendWeeklyReminder(email, name) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const { data, error } = await resend.emails.send({
    from: 'FitBot <hello@fitbot.life>',
    to: email,
    subject: '💪 Time to log your weight, ' + name + '!',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">💪 FitBot</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Weekly Progress Reminder</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">Hey ${name}! 👋</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px;">
            It's been over a week since your last weigh-in. Tracking your weight consistently is one of
            the most powerful habits you can build on your fitness journey.
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 28px; text-align: center;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">Even a single data point helps you stay on track! 📈</p>
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #15803d;">Progress is progress, no matter the number.</p>
          </div>
          <div style="text-align: center;">
            <a href="${clientUrl}/progress" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px;">
              Log My Weight Now →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin: 28px 0 0; text-align: center;">
            You're receiving this because you haven't logged your weight in 7+ days.<br/>
            Keep going — you've got this! 💚
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Reminder email error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send reminder email');
  }
  console.log('✅ Reminder email sent. ID:', data?.id, '| To:', email);
}

async function sendPasswordResetEmail(email, name, otp) {
  const { data, error } = await resend.emails.send({
    from: 'FitBot <hello@fitbot.life>',
    to: email,
    subject: '🔐 Reset your FitBot password',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">💪 FitBot</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Password Reset</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">Hey ${name}! 👋</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 32px;">We received a request to reset your password. Use this code — it expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 28px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Reset Code</p>
            <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #16a34a;">${otp}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Reset email error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send reset email');
  }
  console.log('✅ Reset email sent. ID:', data?.id, '| To:', email);
}

async function sendAccountDeletionEmail(email, name, otp) {
  const { data, error } = await resend.emails.send({
    from: 'FitBot <hello@fitbot.life>',
    to: email,
    subject: '⚠️ Confirm account deletion — FitBot',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">💪 FitBot</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Account Deletion Request</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">Hey ${name} 👋</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 16px;">We received a request to <strong>permanently delete your FitBot account</strong>. This will erase all your data including food logs, workouts, and progress — and cannot be undone.</p>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 32px;">Use this code to confirm. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; background: #fff5f5; border: 2px dashed #ef4444; border-radius: 12px; padding: 28px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Deletion Code</p>
            <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #dc2626;">${otp}</p>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; text-align: center;">If you didn't request this, your account is safe — just ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Deletion email error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send deletion email');
  }
  console.log('✅ Deletion email sent. ID:', data?.id, '| To:', email);
}

async function sendCheckinReminder(email, name, coachName) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const { data, error } = await resend.emails.send({
    from: 'FitBot <hello@fitbot.life>',
    to: email,
    subject: `📸 Check-in day! Coach ${coachName} is waiting`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">💪 FitBot</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Weekly Check-in Reminder</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">Hey ${name}! 🏅</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px;">
            It's your weekly check-in day! Coach <strong>${coachName}</strong> wants to know how you're doing.
          </p>
          <div style="background: #f0f0ff; border-radius: 12px; padding: 20px; margin-bottom: 28px; text-align: center; border-left: 4px solid #6366f1;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">Today's goals:</p>
            <p style="margin: 4px 0; font-size: 14px; color: #4f46e5;">⚖️ Log your current weight</p>
            <p style="margin: 4px 0; font-size: 14px; color: #4f46e5;">💬 Send a progress photo to your coach</p>
            <p style="margin: 4px 0; font-size: 14px; color: #4f46e5;">📝 Log today's meals & workout</p>
          </div>
          <div style="text-align: center;">
            <a href="${clientUrl}/chat/coach" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px;">
              Open Coach Chat →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin: 28px 0 0; text-align: center;">
            Consistency is the key to results. Keep going! 💚
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('❌ Check-in email error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send check-in email');
  }
  console.log('✅ Check-in email sent. ID:', data?.id, '| To:', email);
}

module.exports = { sendOtpEmail, sendWeeklyReminder, sendPasswordResetEmail, sendAccountDeletionEmail, sendCheckinReminder };
