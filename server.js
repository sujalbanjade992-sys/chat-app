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
    target: String // 'global' or a specific socket.id
});

app.use(express.static(path.join(__dirname)));
const users = {};

io.on('connection', async (socket) => {
    // Load Global History ONLY
    const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
    socket.emit('load old msgs', history);

    socket.on('login', (username) => {
        users[socket.id] = { name: username };
        io.emit('user list', users);
    });

    // TYPING INDICATOR: Sends to everyone EXCEPT the person typing
    socket.on('typing', (isTyping) => {
        socket.broadcast.emit('user typing', { 
            name: users[socket.id]?.name, 
            typing: isTyping 
        });
    });

    socket.on('chat message', async (data) => {
        data.senderId = socket.id;

        if (data.target === 'global') {
            const savedMsg = new Msg(data);
            await savedMsg.save();
            io.emit('chat message', data); // Send to everyone
        } else {
            // PRIVATE DM: Only send to the target and yourself
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
http.listen(PORT, () => console.log(`Server running`));

