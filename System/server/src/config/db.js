const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Config Validation Utility
const validateEnv = () => {
  const required = [
    'PORT',
    'MONGODB_URI',
    'CLERK_SECRET_KEY',
    'CLERK_PUBLISHABLE_KEY',
    'CLIENT_URL'
  ];
  
  const missing = [];
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ CRITICAL CONFIGURATION ERROR: Missing environment variables:');
    missing.forEach(variable => console.error(`   - ${variable}`));
    process.exit(1);
  } else {
    console.log('✅ Configuration validation: All environment variables verified.');
  }
};

const connectDB = async () => {
  try {
    validateEnv();
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
