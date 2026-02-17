const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: { require: true, rejectUnauthorized: false },
    } : {},
  });
} else {
  // Local development: use SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false,
  });
}

const User = require('./User')(sequelize);
const Assessment = require('./Assessment')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Notification = require('./Notification')(sequelize);

// Associations
User.hasMany(Assessment, { foreignKey: 'assessorId', as: 'assessments' });
Assessment.belongsTo(User, { foreignKey: 'assessorId', as: 'assessor' });

Assessment.hasMany(AuditLog, { foreignKey: 'assessmentId', as: 'auditLogs' });
AuditLog.belongsTo(Assessment, { foreignKey: 'assessmentId' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditActions' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Assessment.hasMany(Notification, { foreignKey: 'assessmentId' });
Notification.belongsTo(Assessment, { foreignKey: 'assessmentId' });

Assessment.belongsTo(User, { foreignKey: 'lockedBy', as: 'approver' });

Assessment.belongsTo(Assessment, { foreignKey: 'amendedFromId', as: 'originalAssessment' });
Assessment.hasMany(Assessment, { foreignKey: 'amendedFromId', as: 'amendments' });

module.exports = { sequelize, User, Assessment, AuditLog, Notification };
