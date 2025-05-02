const socket = io();

// Player data
let player = {
    pseudo: "Non connecté",
    x: 400,
    y: 100,
    vx: 0,
    vy: 0,
    onGround: false,
    walking: false,
    facing: "right",
    level: 1,
    money: 0
};

// Players from server
let players = {};

// Assets
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const background = new Image();
background.src = "https://i.imgur.com/VYOacW2.png";

const idle = new Image();
idle.src = "https://i.imgur.com/jKbjaOa.png";

const walk1 = new Image();
walk1.src = "https://i.imgur.com/ioZGV8S.png";

const walk2 = new Image();
walk2.src = "https://i.imgur.com/IXTOJpw.png";

let frameTimer = 0;
let currentFrame = 0;

// Platform (ground)
const groundY = 380;

// Keys
let keys = {};
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// Login
function showForm(type) {
    const form = document.getElementById("formContainer");
    form.style.display = "block";
    document.getElementById("formTitle").innerText = type;

    form.onsubmit = (e) => {
        e.preventDefault();
        const inputs = form.querySelectorAll("input");
        const username = inputs[0].value;
        const password = inputs[1].value;

        const endpoint = type === "Connexion" ? "/api/login" : "/api/register";

        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        }).then(res => res.json())
          .then(data => {
              if (data.username) {
                  player.pseudo = data.username;
                  document.getElementById("playerPseudo").textContent = data.username;
                  socket.emit("newPlayer", data.username);
                  hideForm();
              } else {
                  alert("Erreur: " + JSON.stringify(data));
              }
          });
    }
}

function hideForm() {
    document.getElementById("formContainer").style.display = "none";
}

// Update
function update() {
    // Movement
    player.walking = false;

    if (keys["ArrowLeft"]) {
        player.vx = -3;
        player.walking = true;
        player.facing = "left";
    } else if (keys["ArrowRight"]) {
        player.vx = 3;
        player.walking = true;
        player.facing = "right";
    } else {
        player.vx *= 0.7;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    // Jump
    if (keys["ArrowUp"] && player.onGround) {
        player.vy = -10;
        player.onGround = false;
    }

    // Gravity
    player.vy += 0.5;

    player.x += player.vx;
    player.y += player.vy;

    // Ground collision
    if (player.y + 40 >= groundY) {
        player.y = groundY - 40;
        player.vy = 0;
        player.onGround = true;
    }

    // Send position to server
    socket.emit("move", { x: player.x, y: player.y });

    document.getElementById("playerMoney").textContent = player.money;
    document.getElementById("playerLevel").textContent = player.level;
}

// Draw
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Draw players
    for (const id in players) {
        const p = players[id];
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.facing === "left") ctx.scale(-1, 1);

        const sprite = p.walking ? (currentFrame === 0 ? walk1 : walk2) : idle;
        ctx.drawImage(sprite, -45, -65, 90, 90);
        ctx.restore();

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.pseudo, p.x, p.y - 75);
    }
}

function gameLoop() {
    update();
    draw();

    // Animation timer
    if (player.walking) {
        frameTimer++;
        if (frameTimer >= 10) {
            currentFrame = (currentFrame + 1) % 2;
            frameTimer = 0;
        }
    } else {
        currentFrame = 0;
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();

// Chat
function sendMessage() {
    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");

    if (input.value.trim() !== "") {
        const msg = document.createElement("div");
        msg.textContent = player.pseudo + ": " + input.value;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        input.value = "";
    }
}

// Inventory
const inventory = document.getElementById("inventory");
for (let i = 0; i < 24; i++) {
    const slot = document.createElement("div");
    slot.classList.add("inventory-slot");
    inventory.appendChild(slot);
}

// Multiplayer
socket.on("players", (data) => {
    players = data;

    if (players[socket.id]) {
        players[socket.id].pseudo = player.pseudo;
        players[socket.id].facing = player.facing;
        players[socket.id].walking = player.walking;
    }
});
