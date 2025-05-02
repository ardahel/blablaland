// CLIENT.JS FINAL PROPRE

const socket = io("https://blablaland-server.onrender.com");

let player = {
    x: 400,
    y: 100,
    size: 45,
    money: 0,
    pseudo: "Non connecté",
    level: 1
};

let players = {};
let keys = {};
let currentMap = 0;

const maps = [
    "https://i.imgur.com/VYOacW2.png",
    "https://i.imgur.com/uIQqqHn.png"
];

const mapImage = new Image();
mapImage.src = maps[currentMap];

const diamondImage = new Image();
diamondImage.src = "https://i.imgur.com/fnuCYnE.png";

const brokenDiamondImage = new Image();
brokenDiamondImage.src = "https://i.imgur.com/IVY4vuE.png";

const playerIdle = new Image();
playerIdle.src = "https://i.imgur.com/jKbjaOa.png";

const playerWalk1 = new Image();
playerWalk1.src = "https://i.imgur.com/ioZGV8S.png";

const playerWalk2 = new Image();
playerWalk2.src = "https://i.imgur.com/IXTOJpw.png";

let diamonds = [
    { x: Math.random() * 960, y: 380, collected: false },
    { x: Math.random() * 960, y: 380, collected: false }
];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

setInterval(() => {
    diamonds.forEach(diamond => {
        if (diamond.collected) {
            diamond.x = Math.random() * 960;
            diamond.collected = false;
        }
    });
}, 5000);

setInterval(() => {
    player.level++;
}, 10000);

socket.on('players', (data) => {
    players = data;
});

function sendMove() {
    socket.emit("move", { x: player.x, y: player.y });
}

function update() {
    if (keys["ArrowLeft"]) player.x -= 5;
    if (keys["ArrowRight"]) player.x += 5;
    if (keys["ArrowUp"]) player.y -= 5;
    if (keys["ArrowDown"]) player.y += 5;

    if (player.x + player.size > canvas.width) {
        currentMap = (currentMap + 1) % maps.length;
        mapImage.src = maps[currentMap];
        player.x = 0 + player.size;
    }

    if (player.x - player.size < 0) {
        currentMap = (currentMap - 1 + maps.length) % maps.length;
        mapImage.src = maps[currentMap];
        player.x = canvas.width - player.size;
    }

    diamonds.forEach(diamond => {
        let dist = Math.hypot(player.x - diamond.x, player.y - diamond.y);
        if (dist < 50 && !diamond.collected) {
            player.money += Math.floor(Math.random() * 101) + 50;
            diamond.collected = true;
        }
    });

    document.getElementById("money").textContent = player.money;
    document.getElementById("playerMoney").textContent = player.money;
    document.getElementById("playerLevel").textContent = player.level;

    sendMove();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    for (let id in players) {
        const p = players[id];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.drawImage(playerIdle, -45, -65, 90, 90);
        ctx.restore();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.pseudo, p.x, p.y - 75);
    }

    let sprite = playerIdle;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.drawImage(sprite, -45, -65, 90, 90);
    ctx.restore();

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(player.pseudo, player.x, player.y - 75);

    diamonds.forEach(diamond => {
        if (!diamond.collected) ctx.drawImage(diamondImage, diamond.x, diamond.y - 60, 60, 60);
        else ctx.drawImage(brokenDiamondImage, diamond.x, diamond.y - 60, 60, 60);
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

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

const inventory = document.getElementById("inventory");
for (let i = 0; i < 24; i++) {
    const slot = document.createElement("div");
    slot.classList.add("inventory-slot");
    inventory.appendChild(slot);
}

// ---------------------------
// Connexion / Inscription
// ---------------------------

function showForm(type) {
    const form = document.getElementById("formContainer");
    form.style.display = "block";
    document.getElementById("formTitle").innerText = type;
}

function hideForm() {
    document.getElementById("formContainer").style.display = "none";
}

document.querySelector("#formContainer button").addEventListener("click", hideForm);

document.querySelectorAll(".topButtonImg").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const type = e.target.getAttribute("data-type");
        showForm(type);
    });
});

document.getElementById("formContainer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.querySelector("#formContainer input[type=text]").value;
    const password = document.querySelector("#formContainer input[type=password]").value;
    const type = document.getElementById("formTitle").innerText;

    if (!username || !password) return;

    const url = type === "Connexion" ? "/login" : "/register";

    const res = await fetch("https://blablaland-server.onrender.com" + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        const result = await res.json();
        player.pseudo = result.username || username;
        document.getElementById("playerPseudo").textContent = player.pseudo;
        hideForm();
        socket.emit("newPlayer", player.pseudo);
    } else {
        alert("Erreur: " + (await res.text()));
    }
});
