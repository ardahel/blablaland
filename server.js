const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Autorise tout pour le moment
    }
});

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Sert les fichiers HTML/JS/CSS du dossier public

// MongoDB setup
mongoose.connect('mongodb+srv://ardahelblablaland:v4MWa.T_6_vr58q@blablaland.tlhdlvl.mongodb.net/?retryWrites=true&w=majority&appName=blablaland', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model("User", userSchema);

// API routes

// Inscription
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const exists = await User.findOne({ username });

    if (exists) return res.status(400).send("Username already exists");

    const hashed = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();

    res.send({ message: "User registered" });
});

// Connexion
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(400).send("User not found");

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).send("Invalid password");

    res.send({ username });
});

// Serveur HTML index.html par défaut (IMPORTANT pour Render)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Multijoueur system
let players = {};

io.on('connection', (socket) => {
    console.log("New player connected:", socket.id);

    // Nouveau joueur
    socket.on('newPlayer', (pseudo) => {
        players[socket.id] = { pseudo, x: 400, y: 100 };
        io.emit('players', players);
    });

    // Mouvement du joueur
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('players', players);
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
