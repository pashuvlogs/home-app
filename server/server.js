const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { Op } = require('sequelize');
const { sequelize, Assessment, Notification, User } = require('./models');
const { seedUsers } = require('./seeders/seed');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static files in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
// SPA fallback: serve index.html for any non-API route
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await seedUsers();
    console.log('Users seeded');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Check for follow-up reminders every hour
    setInterval(async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const deferred = await Assessment.findAll({
          where: { status: 'deferred', deferralFollowUpDate: tomorrowStr, deletedAt: null },
        });

        for (const a of deferred) {
          // Check if we already sent a reminder today
          const existing = await Notification.findOne({
            where: {
              assessmentId: a.id,
              type: 'followup',
              createdAt: { [Op.gte]: new Date(new Date().toISOString().split('T')[0]) },
            },
          });
          if (existing) continue;

          await Notification.create({
            userId: a.assessorId, assessmentId: a.id, type: 'followup',
            message: `Reminder: Follow-up for ${a.applicantName} is due tomorrow (${a.deferralFollowUpDate}). Reason: ${a.deferralReason || 'Not specified'}`,
          });

          const mgrs = await User.findAll({ where: { role: ['manager', 'senior_manager'] } });
          for (const m of mgrs) {
            await Notification.create({
              userId: m.id, assessmentId: a.id, type: 'followup',
              message: `Reminder: Follow-up for ${a.applicantName} is due tomorrow (${a.deferralFollowUpDate}).`,
            });
          }
        }
        if (deferred.length > 0) console.log(`Sent follow-up reminders for ${deferred.length} assessments`);
      } catch (err) {
        console.error('Follow-up reminder check error:', err);
      }
    }, 60 * 60 * 1000); // Every hour
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
