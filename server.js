
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

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
// ... (keep your existing setup at the top)

io.on('connection', (socket) => {
    socket.on('login', (name) => {
        users[socket.id] = { name: name };
        io.emit('user list', users);
        socket.join('global'); // Everyone is in global by default
    });

    socket.on('chat message', (data) => {
        const payload = { ...data, senderId: socket.id, time: new Date().toLocaleTimeString() };
        
        if (data.target === 'global') {
            io.to('global').emit('chat message', payload);
        } else {
            // PRIVATE DM: Only send to the target person AND back to yourself
            io.to(data.target).emit('chat message', payload);
            socket.emit('chat message', payload); 
        }
    });

    socket.on('typing', (data) => {
        // Only show typing to the specific person or the global room
        socket.to(data.target).emit('display typing', { 
            name: users[socket.id]?.name, 
            isTyping: data.isTyping,
            target: data.target // Tell the frontend WHICH room is typing
        });
    });

    // ... (rest of disconnect logic)
});
// ADD THIS TO SERVER.JS
    socket.on('delete message', (data) => {
        // Tell everyone to remove the message with this ID
        io.emit('message deleted', data.msgId);
    });
