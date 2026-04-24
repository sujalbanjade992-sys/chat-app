const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let userCount = 0;

io.on('connection', (socket) => {
  userCount++;
  io.emit('user count', userCount); // Tell everyone how many people are online

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('display typing', data);
  });

  socket.on('disconnect', () => {
    userCount--;
    io.emit('user count', userCount); // Update count when someone leaves
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
