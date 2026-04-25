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
        users[socket.id] = { name: name, id: socket.id };
        socket.join('global');
        socket.emit('load history', globalMessages);
        io.emit('update user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        const msgData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: users[socket.id]?.name || 'User',
            senderId: socket.id, // This allows the receiver to save the DM to the right folder
            text: data.text,
            target: data.target 
        };

        if (data.target === 'global') {
            globalMessages.push(msgData);
            if (globalMessages.length > 50) globalMessages.shift();
            io.to('global').emit('chat message', msgData);
        } else {
            // Private DM: Send to target and back to sender
            io.to(data.target).emit('chat message', msgData);
            socket.emit('chat message', msgData);
        }
    });

    socket.on('delete message', (data) => {
        globalMessages = globalMessages.filter(m => m.id !== data.msgId);
        io.emit('message deleted', data.msgId);
    });

    socket.on('typing', (data) => {
        const room = data.target === 'global' ? 'global' : data.target;
        socket.to(room).emit('display typing', { 
            name: users[socket.id]?.name, 
            isTyping: data.isTyping, 
            fromRoom: data.target === 'global' ? 'global' : socket.id 
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update user list', Object.values(users));
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Sujal Networks Live on ${PORT}`));
