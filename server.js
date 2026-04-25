const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

app.use(express.static(__dirname));

let users = {}; 
let globalMessages = [];

io.on('connection', (socket) => {
    socket.on('login', (name) => {
        // Store both name and ID so we can route DMs
        users[socket.id] = { name: name, id: socket.id };
        socket.join('global');
        socket.emit('load history', globalMessages);
        
        // Send everyone the updated list of users (including their IDs)
        io.emit('update user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        const msgData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: users[socket.id]?.name || 'User',
            text: data.text,
            target: data.target // This is either 'global' or a specific socket.id
        };

        if (data.target === 'global') {
            globalMessages.push(msgData);
            if (globalMessages.length > 50) globalMessages.shift();
            io.to('global').emit('chat message', msgData);
        } else {
            // PRIVATE DM: Send only to the target ID and back to the sender
            io.to(data.target).emit('chat message', msgData);
            socket.emit('chat message', msgData);
        }
    });

    socket.on('delete message', (data) => {
        globalMessages = globalMessages.filter(m => m.id !== data.msgId);
        io.emit('message deleted', data.msgId);
    });

    socket.on('typing', (data) => {
        if (data.target === 'global') {
            socket.to('global').emit('display typing', { name: users[socket.id]?.name, isTyping: data.isTyping, fromRoom: 'global' });
        } else {
            socket.to(data.target).emit('display typing', { name: users[socket.id]?.name, isTyping: data.isTyping, fromRoom: socket.id });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update user list', Object.values(users));
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server live on ${PORT}`));
