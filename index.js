const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const app = express();
const PORT = process.env.PORT || 5000
app.use(cors());
app.use(express.json());
dotenv.config()
// createServer
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


let players = {}; // Store players' socket IDs and their respective symbols ('X' or 'O')
let gameState = Array(9).fill(null);
let currentPlayer = 'X';

io.on('connection', (socket) => {
  console.log('user connected');
  // x,0 logic game
  if (!players['X']) {
    players['X'] = socket.id
    socket.emit('assigned', { symbol: 'X' })
  } else if (!players['0']) {
    players['0'] = socket.id
    socket.emit('assigned', { symbol: '0' })
  } else {
    socket.emit('full', { message: 'Game is full. Please wait.' });
    socket.disconnect();
    return;
  }

  socket.emit('init', { gameState, currentPlayer })
  //move game logic
  socket.on('move', (data) => {
    if (socket.id === players[currentPlayer] && gameState[data.index] === null) {
      gameState[data.index] = currentPlayer
      currentPlayer = currentPlayer === 'X' ? '0' : 'X'
      io.emit('update', { gameState, currentPlayer })
    }

  })
  // reset game logic
  socket.on('reset', () => {
    gameState = Array(9).fill(null);
    currentPlayer = 'X';
    io.emit('update', { gameState, currentPlayer });
  });

  // char logic
  socket.on('chatMessage', (message) => {
    io.emit('chatMessage', message)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (socket.id === players['X']) delete players['X'];
    if (socket.id === players['0']) delete players['0'];
  });
});


// Server port
server.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
