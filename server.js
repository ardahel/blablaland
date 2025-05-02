const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', authRoutes);

// MongoDB
mongoose.connect('mongodb+srv://ardahelblablaland:v4MWa.T_6_vr58q@blablaland.tlhdlvl.mongodb.net/?retryWrites=true&w=majority&appName=blablaland', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error(err));

// Multiplayer
let players = {};

io.on('connection', (socket) => {
    console.log("✅ New player connected", socket.id);

    socket.on('newPlayer', (pseudo) => {
        players[socket.id] = { pseudo, x: 400, y: 100 };
        io.emit('players', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('players', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
    });
});

// IMPORTANT POUR RENDER (sinon 502)
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("✅ Server started on PORT", PORT);
});
