const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

// Your MongoDB Connection String
const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ DATABASE CONNECTED"))
    .catch(err => console.log("❌ DB CONNECTION ERROR:", err));

// Updated Database Model to support Photos and Message Types
const Msg = mongoose.model('Msg', {
    senderName: String,
    text: String,
    image: String, // Stores the base64 photo data
    type: String,  // 'text' or 'image'
    time: String,
    target: String
});

app.use(express.static(path.join(__dirname)));

const users = {};

io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);

    // 1. Fetch Global History on Connect
    try {
        const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
        socket.emit('load old msgs', history);
    } catch (err) {
        console.log("Error loading history:", err);
    }

    // 2. User Login
    socket.on('login', (username) => {
        users[socket.id] = { name: username };
        io.emit('user list', users);
    });

    // --- TYPING INDICATOR: TARGETED ---
socket.on('typing', (data) => {
    // data now contains { isTyping: true/false, target: 'global' or id }
    if (users[socket.id]) {
        const typingData = { 
            name: users[socket.id].name, 
            typing: data.isTyping 
        };

        if (data.target === 'global') {
            // Tell everyone EXCEPT the sender in global
            socket.broadcast.emit('user typing', typingData);
        } else {
            // Tell ONLY the specific person you are DMing
            socket.to(data.target).emit('user typing', typingData);
        }
    }
});
    // 4. Handling Messages (Text, Links, and Photos)
    socket.on('chat message', async (data) => {
        data.senderId = socket.id;

        if (data.target === 'global') {
            // Save global messages to database
            const savedMsg = new Msg(data);
            await savedMsg.save();
            io.emit('chat message', data);
        } else {
            // Private DMs (Not saved to DB for speed/privacy in this version)
            io.to(data.target).emit('chat message', data);
            socket.emit('chat message', data); 
        }
    });

    // 5. Cleanup on Disconnect
    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server is live on port ${PORT}`));
