// Configuration de la connexion socket.io
const socket = io("https://blablaland-server.onrender.com"); // Change ça par ton url serveur si besoin

let player = {
    pseudo: "Non connecté",
    argent: 0,
    level: 1,
    x: 400,
    y: 120,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
};

let keys = {};
let players = {};
let gravity = 0.5;
let friction = 0.8;
let jumpPower = -10;

// Canvas setup
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapImage = new Image();
mapImage.src = "https://i.imgur.com/VYOacW2.png";

const playerIdle = new Image();
playerIdle.src = "https://i.imgur.com/jKbjaOa.png";
const playerWalk1 = new Image();
playerWalk1.src = "https://i.imgur.com/ioZGV8S.png";
const playerWalk2 = new Image();
playerWalk2.src = "https://i.imgur.com/IXTOJpw.png";

let currentFrame = 0;
let frameTimer = 0;

// Input
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// Timer pour le lvl up
setInterval(() => {
    player.level++;
    updateInfo();
}, 10000);

// Chat
function sendMessage() {
    const input = document.getElementById("chatInput");
    if (input.value.trim() !== "") {
        socket.emit("chatMessage", { pseudo: player.pseudo, message: input.value });
        input.value = "";
    }
}

socket.on("chatMessage", (data) => {
    const chat = document.getElementById("chatMessages");
    const message = document.createElement("div");
    message.textContent = `${data.pseudo}: ${data.message}`;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
});

// Connexion / Inscription
function showForm(type) {
    const form = document.getElementById("formContainer");
    form.style.display = "block";
    document.getElementById("formTitle").innerText = type;
}

function hideForm() {
    document.getElementById("formContainer").style.display = "none";
}

async function submitForm() {
    const username = document.getElementById("formUsername").value;
    const password = document.getElementById("formPassword").value;
    const type = document.getElementById("formTitle").innerText;

    const endpoint = type === "Connexion" ? "/api/login" : "/api/register";
    try {
        const res = await fetch(`https://blablaland-server.onrender.com${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) throw new Error(await res.text());

        const result = await res.json();
        player.pseudo = result.username || username;
        updateInfo();
        hideForm();
        socket.emit("newPlayer", player.pseudo);

    } catch (err) {
        alert("Erreur: " + err.message);
    }
}

document.getElementById("formSubmit").addEventListener("click", submitForm);

// Inventaire
const inventory = document.getElementById("inventory");
for (let i = 0; i < 24; i++) {
    const slot = document.createElement("div");
    slot.classList.add("inventory-slot");
    inventory.appendChild(slot);
}

// Update interface info
function updateInfo() {
    document.getElementById("playerPseudo").textContent = player.pseudo;
    document.getElementById("playerMoney").textContent = player.argent;
    document.getElementById("playerLevel").textContent = player.level;
    document.getElementById("money").textContent = player.argent;
}

// Receive players
socket.on("players", (serverPlayers) => {
    players = serverPlayers;
});

// Game loop
function update() {
    player.velocityY += gravity;
    player.onGround = false;

    if (keys["ArrowLeft"]) {
        player.velocityX = -5;
        player.facing = "left";
    } else if (keys["ArrowRight"]) {
        player.velocityX = 5;
        player.facing = "right";
    }

    if (keys["ArrowUp"] && player.onGround) {
        player.velocityY = jumpPower;
    }

    player.x += player.velocityX;
    player.y += player.velocityY;
    player.velocityX *= friction;

    if (player.y >= 380) {
        player.y = 380;
        player.velocityY = 0;
        player.onGround = true;
    }

    frameTimer++;
    if (frameTimer > 10) {
        currentFrame = (currentFrame + 1) % 2;
        frameTimer = 0;
    }

    socket.emit("move", { x: player.x, y: player.y });
    updateInfo();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    for (let id in players) {
        const p = players[id];
        let sprite = playerIdle;

        if (p.x !== undefined && p.y !== undefined) {
            if (p.x !== 0) sprite = currentFrame === 0 ? playerWalk1 : playerWalk2;
            ctx.save();
            ctx.translate(p.x, p.y);
            if (p.facing === "left") ctx.scale(-1, 1);
            ctx.drawImage(sprite, -45, -65, 90, 90);
            ctx.restore();
            ctx.fillStyle = "black";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText(p.pseudo, p.x, p.y - 75);
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
