import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skydrop";

if (!MONGODB_URI) {
  throw new Error("❌ Missing MongoDB URI in environment variables");
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("⚡ MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "skydrop",
    });
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};
