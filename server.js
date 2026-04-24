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
    // Join the global room by default
    socket.join('global');

    socket.on('login', async (username) => {
        users[socket.id] = { name: username };
        io.emit('user list', users);
        
        // Send history only on login so it doesn't duplicate
        const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
        socket.emit('load old msgs', history);
    });

    socket.on('typing', (data) => {
        const payload = { name: users[socket.id]?.name, typing: data.isTyping };
        if (data.target === 'global') {
            socket.to('global').emit('user typing', payload);
        } else {
            // Only send to the specific person's ID
            socket.to(data.target).emit('user typing', payload);
        }
    });

    socket.on('chat message', async (data) => {
        data.senderId = socket.id;
        if (data.target === 'global') {
            const savedMsg = new Msg(data);
            await savedMsg.save();
            io.to('global').emit('chat message', data);
        } else {
            // Private DM: Send to target and sender only
            socket.to(data.target).emit('chat message', data);
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
