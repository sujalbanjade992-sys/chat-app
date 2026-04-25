
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
        users[socket.id] = { name: name };
        socket.join('global');
        socket.emit('load history', globalMessages);
        io.emit('update user list', Object.values(users).map(u => u.name));
    });

    socket.on('chat message', (data) => {
        const msgData = {
            id: Date.now().toString(),
            name: users[socket.id]?.name || 'User',
            text: data.text,
            target: data.target
        };

        if (data.target === 'global') {
            globalMessages.push(msgData);
            if (globalMessages.length > 100) globalMessages.shift();
            io.to('global').emit('chat message', msgData);
        } else {
            // Send to target and sender
            socket.to(data.target).emit('chat message', msgData);
            socket.emit('chat message', msgData);
        }
    });

    socket.on('delete message', (data) => {
        // Remove from global history if it exists there
        globalMessages = globalMessages.filter(m => m.id !== data.msgId);
        io.emit('message deleted', data.msgId);
    });

    socket.on('typing', (data) => {
        socket.to(data.target).emit('display typing', { 
            name: users[socket.id]?.name, 
            isTyping: data.isTyping,
            fromRoom: data.target 
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update user list', Object.values(users).map(u => u.name));
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server live on ${PORT}`));
