const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected"));

const Msg = mongoose.model('Msg', {
    senderName: String,
    text: String,
    image: String,
    type: String,
    time: String,
    target: String
});

app.use(express.static(path.join(__dirname)));
const users = {};

io.on('connection', async (socket) => {
    const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
    socket.emit('load old msgs', history);

    socket.on('login', (username) => {
        users[socket.id] = { name: username };
        io.emit('user list', users);
    });

    // --- FIXED TYPING LOGIC ---
    socket.on('typing', (data) => {
        const payload = { name: users[socket.id]?.name, typing: data.isTyping };
        if (data.target === 'global') {
            socket.broadcast.emit('user typing', payload);
        } else {
            socket.to(data.target).emit('user typing', payload);
        }
    });

    socket.on('chat message', async (data) => {
        data.senderId = socket.id;
        if (data.target === 'global') {
            const savedMsg = new Msg(data);
            await savedMsg.save();
            io.emit('chat message', data);
        } else {
            io.to(data.target).emit('chat message', data);
            socket.emit('chat message', data); 
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
