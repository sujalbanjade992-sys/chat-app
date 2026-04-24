const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user joined Sujal Networks');

  // Handle sending messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Handle the "is typing..." signal
  socket.on('typing', (data) => {
    // broadcast sends it to everyone EXCEPT the person typing
    socket.broadcast.emit('display typing', data);
  });

  socket.on('disconnect', () => {
    console.log('A user left Sujal Networks');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
