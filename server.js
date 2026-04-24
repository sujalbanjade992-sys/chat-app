const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname)));

const users = {}; // Stores { socketId: username }

io.on('connection', (socket) => {
    // When a user logs in
    socket.on('login', (username) => {
        users[socket.id] = username;
        io.emit('user list', users); // Update everyone's sidebar
        io.emit('user count', Object.keys(users).length);
    });

    // Handle Private Message
    socket.on('private message', (data) => {
        // data = { toId: "socket_id", text: "hi", from: "Sujal", time: "10:00" }
        io.to(data.toId).emit('private message', {
            fromId: socket.id,
            fromName: users[socket.id],
            text: data.text,
            time: data.time
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
        io.emit('user count', Object.keys(users).length);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
