const mongoose = require('mongoose');
require('dotenv').config({ path: './Backend/.env' });

async function checkDB() {
  try {
    console.log("Connecting to:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connection Successful");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Found collections:", collections.map(c => c.name));
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

checkDB();
