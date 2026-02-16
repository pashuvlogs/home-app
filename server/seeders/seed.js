const { User } = require('../models');

const seedUsers = async () => {
  const users = [
    { username: 'sarah', password: 'password123', fullName: 'Sarah Johnson', role: 'assessor' },
    { username: 'david', password: 'password123', fullName: 'David Thompson', role: 'manager' },
    { username: 'priya', password: 'password123', fullName: 'Priya Patel', role: 'senior_manager' },
  ];

  for (const userData of users) {
    const existing = await User.findOne({ where: { username: userData.username } });
    if (!existing) {
      await User.create(userData);
      console.log(`Created user: ${userData.username} (${userData.role})`);
    } else {
      console.log(`User already exists: ${userData.username}`);
    }
  }
};

module.exports = { seedUsers };
