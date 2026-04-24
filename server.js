const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname)));

const users = {}; 

io.on('connection', (socket) => {
    socket.on('login', (username) => {
        // Assign a random avatar based on their name
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
        users[socket.id] = { name: username, avatar: avatar };
        
        io.emit('user list', users); 
        // Notify global chat
        io.emit('chat message', { 
            user: 'SYSTEM', 
            text: `${username} joined the network.`, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true 
        });
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('private message', (data) => {
        io.to(data.toId).emit('private message', {
            fromId: socket.id,
            fromName: users[socket.id].name,
            fromAvatar: users[socket.id].avatar,
            text: data.text,
            time: data.time
        });
    });

    socket.on('disconnect', () => {
        if(users[socket.id]) {
            io.emit('chat message', { 
                user: 'SYSTEM', 
                text: `${users[socket.id].name} left the network.`, 
                isSystem: true 
            });
            delete users[socket.id];
            io.emit('user list', users);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
