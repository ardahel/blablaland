
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' }});

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blablaland'
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL connected");
});

app.post('/register', (req, res) => {
    const { pseudo, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.query("INSERT INTO users (pseudo, password) VALUES (?, ?)", [pseudo, hash], (err, result) => {
        if (err) return res.sendStatus(500);
        res.json({ success: true });
    });
});

app.post('/login', (req, res) => {
    const { pseudo, password } = req.body;
    db.query("SELECT * FROM users WHERE pseudo = ?", [pseudo], (err, results) => {
        if (err || results.length == 0) return res.sendStatus(401);
        if (!bcrypt.compareSync(password, results[0].password)) return res.sendStatus(401);
        const token = jwt.sign({ id: results[0].id, pseudo: results[0].pseudo }, 'secret');
        res.json({ token });
    });
});

let players = {};

io.on('connection', socket => {
    console.log('New player connected');

    socket.on('newPlayer', pseudo => {
        players[socket.id] = { pseudo, x: 400, y: 100 };
        io.emit('players', players);
    });

    socket.on('move', data => {
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

server.listen(3000, () => console.log('Server started on http://localhost:3000'));
