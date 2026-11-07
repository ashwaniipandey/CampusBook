import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const migrateEmailVerified = async () => {
  await connectDB();

  // 1. Set emailVerified: true for users already verified OR users signed in with Google
  const verifiedOrGoogle = await User.collection.updateMany(
    {
      $or: [
        { isVerified: true },
        { verificationStatus: 'verified' },
        { googleId: { $exists: true, $ne: null } },
      ],
    },
    {
      $set: {
        emailVerified: true,
      },
    }
  );

  // 2. Mark profile complete for existing users with state and phone, or already verified
  const profileComplete = await User.collection.updateMany(
    {
      $or: [
        { isVerified: true },
        { verificationStatus: 'verified' },
        { phone: { $exists: true, $ne: '' } },
      ],
    },
    {
      $set: {
        isProfileComplete: true,
      },
    }
  );

  console.log(`Migration complete:`);
  console.log(`- Updated ${verifiedOrGoogle.modifiedCount} user(s) to emailVerified: true.`);
  console.log(`- Updated ${profileComplete.modifiedCount} user(s) to isProfileComplete: true.`);
};

try {
  await migrateEmailVerified();
} catch (error) {
  console.error('Migration failed:', error.name || error.message || 'Unknown error');
  process.exitCode = 1;
} finally {
  await disconnectDB();
}

