const mongoose = require('mongoose');
const uri = "mongodb+srv://team6:rguktn123456@cluster0.qszodk8.mongodb.net/placement-portal?retryWrites=true&w=majority";

async function run() {
  try {
    console.log("Connecting...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully!");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    process.exit();
  }
}

run();
