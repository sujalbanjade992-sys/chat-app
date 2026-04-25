
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

// Branding Logs for Render Dashboard
console.log("-----------------------------------------");
console.log("   SUJAL NETWORKS ELITE - INITIALIZING   ");
console.log("-----------------------------------------");

app.use(express.static(__dirname));

const users = {};

io.on('connection', (socket) => {
    socket.on('login', (name) => {
        users[socket.id] = name;
        io.emit('user list', users);
        console.log(`${name} joined Sujal Networks`);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', { ...msg, id: Date.now() });
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
    console.log(`✅ Sujal Networks Elite Live on Port ${PORT}`);
});
