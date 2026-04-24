const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

// PLUGGING IN YOUR CREDENTIALS FROM SCREENSHOT 24
const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ DATABASE CONNECTED"))
    .catch(err => console.log("❌ DB ERROR:", err));

const MsgSchema = new mongoose.Schema({
    user: String,
    avatar: String,
    text: String,
    time: String
});
const Msg = mongoose.model('msg', MsgSchema);

app.use(express.static(path.join(__dirname)));

const users = {}; 

io.on('connection', async (socket) => {
    // 1. Load History
    try {
        const history = await Msg.find().sort({ _id: 1 }).limit(50);
        socket.emit('load old msgs', history);
    } catch (e) { console.log(e); }

    socket.on('login', (username) => {
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
        users[socket.id] = { name: username, avatar: avatar };
        io.emit('user list', users); 
    });

    socket.on('chat message', (data) => {
        // 2. SHOW ON SCREEN IMMEDIATELY (Fast UI)
        io.emit('chat message', data);
        
        // 3. SAVE TO DB LATER (No waiting)
        const newMsg = new Msg(data);
        newMsg.save().catch(err => console.log("Save Error:", err));
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server on ${PORT}`));
