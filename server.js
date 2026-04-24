const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

// --- 1. DATABASE CONNECTION ---
const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Sujal's Database Connected!"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// --- 2. MESSAGE DATA MODEL ---
const MsgSchema = new mongoose.Schema({
    user: String,
    avatar: String,
    text: String,
    time: String,
    type: { type: String, default: 'public' } 
});
const Msg = mongoose.model('msg', MsgSchema);

app.use(express.static(path.join(__dirname)));

const users = {}; 

io.on('connection', async (socket) => {
    console.log('User connected to the network');

    // --- 3. LOAD HISTORY ---
    // When a user connects, send them the last 50 messages from the database
    try {
        const history = await Msg.find({ type: 'public' }).sort({ _id: 1 }).limit(50);
        socket.emit('load old msgs', history);
    } catch (err) {
        console.log("Error loading history:", err);
    }

    socket.on('login', (username) => {
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
        users[socket.id] = { name: username, avatar: avatar };
        io.emit('user list', users); 
        
        // System message for everyone
        io.emit('chat message', { 
            user: 'SYSTEM', 
            text: `${username} joined the network.`, 
            isSystem: true 
        });
    });

    // --- 4. PUBLIC MESSAGING ---
    socket.on('chat message', (data) => {
        // Save to Database so it's permanent
        const saveMsg = new Msg({
            user: data.user,
            avatar: data.avatar,
            text: data.text,
            time: data.time,
            type: 'public'
        });

        saveMsg.save().then(() => {
            io.emit('chat message', data);
        });
    });

    // --- 5. PRIVATE MESSAGING ---
    socket.on('private message', (data) => {
        if(users[socket.id]) {
            io.to(data.toId).emit('private message', {
                fromId: socket.id,
                fromName: users[socket.id].name,
                fromAvatar: users[socket.id].avatar,
                text: data.text,
                time: data.time
            });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('chat message', { 
                user: 'SYSTEM', 
                text: `${users[socket.id].name} disconnected.`, 
                isSystem: true 
            });
            delete users[socket.id];
            io.emit('user list', users);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
