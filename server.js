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
    time: String,
    target: String
});

app.use(express.static(path.join(__dirname)));

const users = {};

io.on('connection', async (socket) => {
    
    // Load Global History
    const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
    socket.emit('load old msgs', history);

    socket.on('login', (username) => {
        users[socket.id] = { name: username, online: true };
        io.emit('user list', users); // Update everyone's list
    });

    // --- TYPING INDICATOR LOGIC ---
    socket.on('typing', (isTyping) => {
        if (users[socket.id]) {
            socket.broadcast.emit('user typing', { 
                name: users[socket.id].name, 
                typing: isTyping 
            });
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
        if (users[socket.id]) {
            io.emit('user list', users); // Update list to show they left
            delete users[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running`));
