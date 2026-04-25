
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let users = {};

io.on('connection', (socket) => {
    // 1. Handle Login
    socket.on('login', (name) => {
        users[socket.id] = { name: name, id: socket.id };
        io.emit('user list', users); 
        socket.join('global');
        console.log(`✅ ${name} connected to Sujal Networks`);
    });

    // 2. Handle Messages (DMs and Global)
    socket.on('chat message', (data) => {
        const payload = { ...data, senderId: socket.id, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        if(data.target === 'global') {
            io.to('global').emit('chat message', payload);
        } else {
            io.to(data.target).emit('chat message', payload);
            socket.emit('chat message', payload); // Send back to self for DMs
        }
    });

    // 3. Typing Indicator
    socket.on('typing', (data) => {
        socket.to(data.target).emit('display typing', { name: users[socket.id]?.name, isTyping: data.isTyping });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`🚀 Sujal Networks Elite Live on ${PORT}`));
