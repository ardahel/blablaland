const socket = io();

// Joueur local
let localPlayer = {
    id: null,
    pseudo: null,
    x: 400,
    y: 100,
    money: 0,
    level: 1
};

// Autres joueurs
let players = {};

function renderPlayers() {
    const ctx = document.getElementById("game").getContext("2d");

    Object.values(players).forEach(player => {
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(player.pseudo, player.x, player.y - 70);

        ctx.fillStyle = "pink";
        ctx.beginPath();
        ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        ctx.fill();
    });
}

function gameLoop() {
    const ctx = document.getElementById("game").getContext("2d");
    ctx.clearRect(0, 0, 960, 540);

    renderPlayers();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Envoi du mouvement
document.addEventListener("keydown", (e) => {
    if (!localPlayer.id) return;

    if (e.key === "ArrowLeft") localPlayer.x -= 5;
    if (e.key === "ArrowRight") localPlayer.x += 5;
    if (e.key === "ArrowUp") localPlayer.y -= 5;
    if (e.key === "ArrowDown") localPlayer.y += 5;

    socket.emit("move", {
        x: localPlayer.x,
        y: localPlayer.y
    });
});

// Gestion des joueurs
socket.on("players", (serverPlayers) => {
    players = serverPlayers;
});

// CHAT
document.getElementById("sendButton").addEventListener("click", () => {
    const msg = document.getElementById("chatInput").value.trim();
    if (msg !== "") {
        socket.emit("chat", msg);
        document.getElementById("chatInput").value = "";
    }
});

socket.on("chat", (msg) => {
    const messages = document.getElementById("chatMessages");
    const el = document.createElement("div");
    el.textContent = msg;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
});

// INSCRIPTION
function register(pseudo, password) {
    fetch("/register", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Compte créé !");
        } else {
            alert("Erreur: " + data.message);
        }
    });
}

// CONNEXION
function login(pseudo, password) {
    fetch("/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Connecté !");
            localPlayer.pseudo = pseudo;
            localPlayer.id = data.id;

            socket.emit("newPlayer", pseudo);
        } else {
            alert("Erreur: " + data.message);
        }
    });
}

// Boutons Inscription et Connexion
document.getElementById("registerButton").addEventListener("click", () => {
    const pseudo = prompt("Pseudo:");
    const password = prompt("Mot de passe:");
    register(pseudo, password);
});

document.getElementById("loginButton").addEventListener("click", () => {
    const pseudo = prompt("Pseudo:");
    const password = prompt("Mot de passe:");
    login(pseudo, password);
});
