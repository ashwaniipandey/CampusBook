import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const migrateVerificationStatus = async () => {
  await connectDB();
  const result = await User.collection.updateMany(
    { verificationStatus: { $exists: false } },
    [
      {
        $set: {
          verificationStatus: {
            $cond: [{ $eq: ['$isVerified', true] }, 'verified', 'unverified'],
          },
        },
      },
    ],
  );
  console.log(`Updated verification status for ${result.modifiedCount} user(s).`);
};

try {
  await migrateVerificationStatus();
} catch (error) {
  console.error('Verification migration failed:', error.name || 'Unknown error');
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
