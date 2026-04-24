
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- DB CONNECTION ---
const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected"));

const Msg = mongoose.model("Msg", {
    senderName: String, text: String, time: String, target: String
});

app.use(express.static(__dirname));

const users = {}; // This tracks who is online

io.on("connection", (socket) => {
    socket.join("global");

    // --- LOGIN & ONLINE LIST ---
    socket.on("login", async (username) => {
        users[socket.id] = { name: username };
        io.emit("user list", users); // Tell everyone who is online

        const history = await Msg.find({ target: "global" }).sort({ _id: 1 }).limit(50);
        socket.emit("load old msgs", history);
    });

    // --- TYING INDICATOR ---
    socket.on("typing", (data) => {
        socket.to(data.target).emit("user typing", {
            name: users[socket.id]?.name,
            isTyping: data.isTyping
        });
    });

    // --- MESSAGE ROUTING (DMs & GLOBAL) ---
    socket.on("chat message", async (data) => {
        const savedMsg = new Msg(data);
        const result = await savedMsg.save();
        data._id = result._id;

        if (data.target === "global") {
            io.to("global").emit("chat message", data);
        } else {
            // Private DM: Send only to the target and back to sender
            socket.to(data.target).emit("chat message", data);
            socket.emit("chat message", data);
        }
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("user list", users); // Update list for everyone
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server live on ${PORT}`));
