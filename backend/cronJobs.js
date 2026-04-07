import cron from "node-cron";
import nodemailer from "nodemailer";
import ReviewSchedule from "./models/ReviewSchedule.js";
import UserModel from "./models/user.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

cron.schedule("0 8 * * *", async () => {
  try {
    const result = await ReviewSchedule.updateMany(
      {
        nextReviewDate: { $lte: new Date() },
        status: { $ne: "mastered" },
      },
      { $set: { status: "due" } },
    );

    const count = result.modifiedCount || 0;
    console.log(`[CRON 8AM] Marked ${count} review schedules as due`);
  } catch (err) {
    console.error("[CRON 8AM] Failed to update due schedules:", err.message);
  }
});

cron.schedule("0 9 * * *", async () => {
  try {
    const dueSchedules = await ReviewSchedule.find({ status: "due" }).sort({ user: 1, topic: 1 });

    const groupedByUser = new Map();
    for (const schedule of dueSchedules) {
      const userId = String(schedule.user);
      if (!groupedByUser.has(userId)) groupedByUser.set(userId, []);
      groupedByUser.get(userId).push(schedule.topic);
    }

    for (const [userId, topics] of groupedByUser.entries()) {
      const user = await UserModel.findById(userId).select("name email");
      if (!user?.email) {
        console.log(`[CRON 9AM] Skipping user ${userId} (no email)`);
        continue;
      }

      const uniqueTopics = [...new Set(topics)];
      const topicsHtml = uniqueTopics.map((topic) => `<li>${topic}</li>`).join("");

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 8px;">Hi ${user.name || "Learner"},</h2>
          <p>You have revision topics due today:</p>
          <ul>${topicsHtml}</ul>
          <p style="margin-top: 20px;">
            <a href="http://localhost:5173/reviews" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">
              Start Today's Reviews
            </a>
          </p>
          <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">
            Keep your memory strong with spaced repetition.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "📚 Your revision topics for today",
        html,
      });

      console.log(`[CRON 9AM] Reminder email sent to ${user.email}`);
    }
  } catch (err) {
    console.error("[CRON 9AM] Failed to send reminder emails:", err.message);
  }
});
