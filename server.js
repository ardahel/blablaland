const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load routes
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// MIDDLEWARE
app.use(express.json());
app.use(cors());

// Serve static files (for index.html and game files)
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use('/api', authRoutes);

// DATABASE
mongoose.connect('mongodb+srv://ardahelblablaland:v4MWa.T_6_vr58q@blablaland.tlhdlvl.mongodb.net/?retryWrites=true&w=majority&appName=blablaland', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// MULTIJOUEUR SYSTEM
let players = {};

io.on('connection', (socket) => {
    console.log("New user connected:", socket.id);

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

// SERVER LISTEN
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
});
