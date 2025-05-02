const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb+srv://ardahelblablaland:v4MWa.T_6_vr58q@blablaland.tlhdlvl.mongodb.net/?retryWrites=true&w=majority&appName=blablaland', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected ✅");
}).catch(err => {
    console.error("MongoDB error ❌", err);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String
});

const User = mongoose.model('User', userSchema);

// Routes - Inscription
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) return res.status(400).send("Pseudo et mot de passe requis.");

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send("Pseudo déjà utilisé.");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    
    await user.save();
    res.status(201).send("Compte créé !");
});

// Routes - Connexion
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send("Utilisateur introuvable.");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).send("Mot de passe incorrect.");

    res.status(200).send("Connexion réussie");
});

// Multijoueur Players Data
let players = {};

io.on('connection', socket => {
    console.log("Un joueur s'est connecté.");

    // Nouveau joueur
    socket.on('newPlayer', (pseudo) => {
        players[socket.id] = {
            pseudo: pseudo,
            x: 400,
            y: 100
        };

        io.emit('players', players);
    });

    // Déplacement
    socket.on('move', data => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('players', players);
        }
    });

    // Chat global
    socket.on('chat', message => {
        if (players[socket.id]) {
            io.emit('chat', { pseudo: players[socket.id].pseudo, message });
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
        console.log("Un joueur s'est déconnecté.");
    });
});

// Serveur ON
server.listen(process.env.PORT || 3000, () => {
    console.log("✅ Serveur lancé sur le port " + (process.env.PORT || 3000));
});
