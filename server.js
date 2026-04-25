
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

// Serve the static files (index.html, styles, etc.)
app.use(express.static(__dirname));

// Store users and global history in memory
let users = {};
let globalMessages = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 1. Handle Login
    socket.on('login', (name) => {
        users[socket.id] = { name: name, room: 'global' };
        socket.join('global');
        
        // Send existing messages to the new user
        socket.emit('load history', globalMessages);
        
        // Update everyone's "Who's Online" list
        io.emit('update user list', Object.values(users).map(u => u.name));
    });

    // 2. Handle Chat Messages (Global and DM)
    socket.on('chat message', (data) => {
        const msgData = {
            id: Date.now().toString(),
            name: users[socket.id]?.name || 'Anonymous',
            text: data.text,
            target: data.target // 'global' or a specific socket ID
        };

        if (data.target === 'global') {
            globalMessages.push(msgData);
            if (globalMessages.length > 100) globalMessages.shift();
            io.to('global').emit('chat message', msgData);
        } else {
            // Private DM: Send only to the target and the sender
            socket.to(data.target).emit('chat message', msgData);
            socket.emit('chat message', msgData);
        }
    });

    // 3. Handle Typing Indicator (The Fix)
    socket.on('typing', (data) => {
        // Only broadcast to the specific target (global or DM)
        socket.to(data.target).emit('display typing', { 
            name: users[socket.id]?.name, 
            isTyping: data.isTyping,
            fromRoom: data.target 
        });
    });

    // 4. Handle Delete/Unsend (The Fix that caused the crash)
    socket.on('delete message', (data) => {
        // data.msgId is the unique ID of the message to remove
        io.emit('message deleted', data.msgId);
    });

    // 5. Handle Disconnect
    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update user list', Object.values(users).map(u => u.name));
        console.log('User disconnected');
    });
});

// Use Render's port or default to 10000
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
