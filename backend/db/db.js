const mongoose = require("mongoose");

async function db() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/greenlooop");
    console.log("database connected");
  } catch (err) {
    console.log("db is not connected", err.message);
  }
}


module.exports = db;