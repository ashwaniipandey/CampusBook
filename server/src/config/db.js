import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @returns {Promise<typeof mongoose>}
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusbook';

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true, // Build indexes automatically in dev
    });

    console.log(` MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(` Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

// Event Listeners for MongoDB Connection lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

export default connectDB;

