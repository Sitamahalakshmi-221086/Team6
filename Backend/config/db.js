const mongoose = require('mongoose');
<<<<<<< HEAD
<<<<<<< HEAD
require('dotenv').config();
=======
>>>>>>> UI

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
<<<<<<< HEAD
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
=======
    console.log('✅ MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    console.error('❌ MongoDB Error: ' + error.message);
>>>>>>> UI
=======
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
      connectTimeoutMS:         10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
>>>>>>> UI
    process.exit(1);
  }
};

<<<<<<< HEAD
<<<<<<< HEAD
module.exports = connectDB;
=======
module.exports = connectDB;
>>>>>>> UI
=======
module.exports = connectDB;
>>>>>>> UI
