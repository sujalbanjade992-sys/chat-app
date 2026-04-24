
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// --- FORCE THE SERVER TO FIND INDEX.HTML ---
// This tells the server: "When someone visits the home page (/), 
// send them the index.html file that is in this exact folder."
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Also keep this for your images and CSS
app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server is live at http://localhost:${PORT}`);
});
