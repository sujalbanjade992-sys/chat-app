
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// Fix: Direct root to handle 'Cannot GET'
app.use(express.static(__dirname));

const users = {};

io.on('connection', (socket) => {
    socket.on('login', (name) => {
        users[socket.id] = name;
        io.emit('user list', users);
    });

    socket.on('chat message', (msg) => {
        // Broadcast immediately for smooth performance
        io.emit('chat message', {
            ...msg,
            id: Date.now() // Unique ID for animations
        });
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('display typing', data);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("===============================");
    console.log("   SUJAL NETWORKS ELITE V2     ");
    console.log("===============================");
});
