import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const email = process.argv[2];
const password = process.argv[3];

if (!email) {
  console.log('Usage: node src/scripts/setAdmin.js <email> [newPassword]');
  process.exit(1);
}

async function run() {
  await connectDB();
  const cleanEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: cleanEmail }).select('+password');

  if (user) {
    user.role = 'admin';
    user.isVerified = true;
    user.verificationStatus = 'verified';
    if (password) {
      user.password = password; // pre-save hook will hash it automatically
    }
    await user.save();
    console.log(`✅ User ${cleanEmail} is now an ADMIN with updated credentials!`);
  } else {
    if (!password) {
      console.log(`❌ User ${cleanEmail} not found. Please provide a password to create this admin user.`);
      process.exit(1);
    }
    user = await User.create({
      name: 'CampusBook Admin',
      email: cleanEmail,
      password,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified',
      department: 'Platform Administration',
    });
    console.log(`✅ Created brand new ADMIN account: ${cleanEmail}`);
  }

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error setting admin:', err.message);
  process.exit(1);
});
