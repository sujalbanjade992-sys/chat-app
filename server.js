
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

// --- DATABASE CONNECTION ---
const mongoURI = "mongodb+srv://sujalbanjade992_db_user:56oglUhQ9Tjv3SzI@cluster0.whaxbyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI).then(() => console.log("✅ DB Connected"));

const Msg = mongoose.model('Msg', {
    senderName: String,
    text: String,
    type: String,
    time: String,
    target: String // 'global' or a specific Socket ID for DMs
});

app.use(express.static(__dirname));

io.on('connection', async (socket) => {
    // Join the global room by default
    socket.join('global');

    socket.on('login', async (username) => {
        // Send the last 50 global messages when they log in
        const history = await Msg.find({ target: 'global' }).sort({ _id: 1 }).limit(50);
        socket.emit('load old msgs', history);
    });

    socket.on('chat message', async (data) => {
        const savedMsg = new Msg(data);
        const result = await savedMsg.save();
        data._id = result._id;

        if (data.target === 'global') {
            io.to('global').emit('chat message', data);
        } else {
            // Private DM: Send to target and back to sender
            socket.to(data.target).emit('chat message', data);
            socket.emit('chat message', data); 
        }
    });

    socket.on('delete message', async (msgId) => {
        await Msg.findByIdAndDelete(msgId);
        io.emit('message deleted', msgId);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server live on ${PORT}`));
