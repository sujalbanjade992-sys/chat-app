const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

// --- DATABASE CONNECTION ---
const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Sujal's Database Connected!"))
    .catch(err => console.log("❌ DB Error:", err));

// --- MESSAGE DATA MODEL ---
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
    // 1. Send chat history to the user as soon as they connect
    const history = await Msg.find().sort({ _id: 1 }).limit(50);
    socket.emit('load old msgs', history);

    socket.on('login', (username) => {
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
        users[socket.id] = { name: username, avatar: avatar };
        io.emit('user list', users); 
    });

    socket.on('chat message', (data) => {
        // 2. Save message to Database
        const saveMsg = new Msg(data);
        saveMsg.save().then(() => {
            io.emit('chat message', data);
        });
    });

    socket.on('private message', (data) => {
        if(users[socket.id]) {
            io.to(data.toId).emit('private message', {
                fromId: socket.id,
                fromName: users[socket.id].name,
                fromAvatar: users[socket.id].avatar,
                text: data.text,
                time: data.time
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
