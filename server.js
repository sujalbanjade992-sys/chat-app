const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 1. DATABASE CONNECTION ---
// Replace this with your actual MongoDB connection string from Atlas
const mongoURI = "YOUR_MONGODB_ATLAS_CONNECTION_STRING"; 
mongoose.connect(mongoURI)
  .then(() => console.log("✅ Commercial Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// --- 2. MESSAGE SCHEMA ---
const MsgSchema = new mongoose.Schema({
  user: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Msg = mongoose.model("Msg", MsgSchema);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", async (socket) => {
  console.log("A user connected");

  // --- 3. SEND HISTORY ---
  // When a user joins, show them the last 50 messages from the database
  try {
    const history = await Msg.find().sort({ _id: 1 }).limit(50);
    socket.emit("load history", history);
  } catch (err) {
    console.log(err);
  }

  socket.on("chat message", async (msg) => {
    // Basic Sanitization: Don't allow empty messages
    if (!msg.text.trim()) return;

    // --- 4. PERSISTENCE ---
    const newMsg = new Msg(msg);
    await newMsg.save(); // Save to MongoDB

    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sujal Networks Live on port ${PORT}`);
});
