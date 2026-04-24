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
    socket.join('global');

    socket.on('login', async (username) => {
        users[socket.id] = { name: username };
        io.emit('user list', users);
        const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
        socket.emit('load old msgs', history);
    });

    socket.on('typing', (data) => {
        const payload = { name: users[socket.id]?.name, typing: data.isTyping };
        if (data.target === 'global') {
            socket.to('global').emit('user typing', payload);
        } else {
            socket.to(data.target).emit('user typing', payload);
        }
    });

    socket.on('chat message', async (data) => {
        data.senderId = socket.id;
        if (data.target === 'global') {
            const savedMsg = new Msg(data);
            const result = await savedMsg.save();
            data._id = result._id; // Real DB ID for unsending
            io.to('global').emit('chat message', data);
        } else {
            data._id = "temp-" + Date.now(); // Temp ID for DMs
            socket.to(data.target).emit('chat message', data);
            socket.emit('chat message', data); 
        }
    });

    // --- NEW: UNSEND LOGIC ---
    socket.on('delete message', async (msgId) => {
        try {
            await Msg.findByIdAndDelete(msgId);
            io.emit('message deleted', msgId);
        } catch (err) {
            console.log("Delete error:", err);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server live`));
