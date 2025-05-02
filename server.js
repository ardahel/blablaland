const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

// Setup Express and HTTP server
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

// MongoDB Connection
mongoose.connect('mongodb+srv://ardahelblablaland:v4MWa.T_6_vr58q@blablaland.tlhdlvl.mongodb.net/?retryWrites=true&w=majority&appName=blablaland', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

// Serve static files (HTML / Client.js / CSS etc)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const exists = await User.findOne({ username });

    if (exists) return res.status(400).send("Username already exists");

    const hashed = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();

    res.send("User registered");
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(400).send("User not found");

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).send("Invalid password");

    res.send({ username });
});

// Multiplayer players list
let players = {};

io.on('connection', (socket) => {
    console.log("New user connected:", socket.id);

    // Player joins
    socket.on('newPlayer', (pseudo) => {
        players[socket.id] = { pseudo, x: 400, y: 100 };
        io.emit('players', players);
    });

    // Player movement
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('players', players);
        }
    });

    // Player disconnect
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
});
