const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MONGODB_URI (Docker Compose), fallback to MONGO_URI, then localhost
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/magmascale';
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
