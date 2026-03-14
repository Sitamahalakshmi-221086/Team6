const mongoose = require('mongoose');
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
    process.exit(1);
  }
};

<<<<<<< HEAD
module.exports = connectDB;
=======
module.exports = connectDB;
>>>>>>> UI
