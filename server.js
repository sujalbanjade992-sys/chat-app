const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname)));

const users = {}; 

io.on('connection', (socket) => {
    socket.on('login', (username) => {
        users[socket.id] = username;
        io.emit('user list', users); 
    });

    // PUBLIC MESSAGE (To Everyone)
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // PRIVATE MESSAGE (To One Person)
    socket.on('private message', (data) => {
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
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
