const socket = io();

// PRELOAD Images
const images = {};
const imageSources = {
    map1: "https://i.imgur.com/VYOacW2.png",
    map2: "https://i.imgur.com/uIQqqHn.png",
    idle: "https://i.imgur.com/jKbjaOa.png",
    walk1: "https://i.imgur.com/ioZGV8S.png",
    walk2: "https://i.imgur.com/IXTOJpw.png",
    diamond: "https://i.imgur.com/fnuCYnE.png",
    diamondBroken: "https://i.imgur.com/IVY4vuE.png"
};

let loadedImages = 0;
const totalImages = Object.keys(imageSources).length;

for (const key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = () => {
        loadedImages++;
        if (loadedImages === totalImages) startGame();
    };
}

function startGame() {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const maps = [images.map1, images.map2];
    let currentMap = 0;

    const player = {
        x: canvas.width / 2,
        y: 120,
        size: 45,
        velocityX: 0,
        velocityY: 0,
        facing: "right",
        walking: false,
        frameTimer: 0,
        frameIndex: 0,
        onGround: false,
        pseudo: localStorage.getItem("pseudo") || "Non connecté",
        money: 0,
        level: 1
    };

    const players = {};
    const gravity = 0.5;
    const friction = 0.8;
    const jumpPower = -10;
    const keys = {};
    
    let platforms = [{ x: 0, y: 380, width: canvas.width, height: canvas.height - 380 }];
    let diamonds = [{ x: Math.random() * canvas.width, y: 380, collected: false }];

    document.addEventListener("keydown", e => keys[e.key] = true);
    document.addEventListener("keyup", e => keys[e.key] = false);

    setInterval(() => {
        diamonds.forEach(d => {
            if (d.collected) {
                d.x = Math.random() * canvas.width;
                d.collected = false;
            }
        });
    }, 5000);

    setInterval(() => {
        player.level++;
    }, 10000);

    socket.emit("newPlayer", player.pseudo);

    socket.on("players", (serverPlayers) => {
        Object.assign(players, serverPlayers);
    });

    function update() {
        if (keys["ArrowLeft"]) player.velocityX = -5;
        else if (keys["ArrowRight"]) player.velocityX = 5;
        else player.velocityX *= friction;

        if (keys["ArrowUp"] && player.onGround) {
            player.velocityY = jumpPower;
            player.onGround = false;
        }

        player.x += player.velocityX;
        player.y += player.velocityY;
        player.velocityY += gravity;
        player.walking = Math.abs(player.velocityX) > 1;

        if (player.velocityX < 0) player.facing = "left";
        if (player.velocityX > 0) player.facing = "right";

        platforms.forEach(p => {
            if (player.x + player.size > p.x && player.x - player.size < p.x + p.width && player.y + player.size > p.y && player.y + player.size < p.y + 10) {
                player.y = p.y - player.size;
                player.velocityY = 0;
                player.onGround = true;
            }
        });

        if (player.x + player.size > canvas.width) {
            currentMap = (currentMap + 1) % maps.length;
            player.x = 0 + player.size;
        } else if (player.x - player.size < 0) {
            currentMap = (currentMap - 1 + maps.length) % maps.length;
            player.x = canvas.width - player.size;
        }

        const diamond = diamonds[currentMap];
        if (!diamond.collected && Math.hypot(player.x - diamond.x, player.y - diamond.y) < 50 && keys["ArrowDown"]) {
            player.money += Math.floor(Math.random() * 101) + 50;
            diamond.collected = true;
        }

        socket.emit("move", {
            x: player.x,
            y: player.y,
            facing: player.facing,
            walking: player.walking,
            pseudo: player.pseudo
        });

        document.getElementById("money").textContent = player.money;
        document.getElementById("playerMoney").textContent = player.money;
        document.getElementById("playerLevel").textContent = player.level;
        document.getElementById("playerPseudo").textContent = player.pseudo;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(maps[currentMap], 0, 0, canvas.width, canvas.height);

        for (let id in players) {
            const p = players[id];
            const img = (!p.walking) ? images.idle : (p.frameIndex % 2 === 0) ? images.walk1 : images.walk2;

            ctx.save();
            ctx.translate(p.x, p.y);
            if (p.facing === "left") ctx.scale(-1, 1);
            ctx.drawImage(img, p.facing === "left" ? -45 : -45, -65, 90, 90);
            ctx.restore();

            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText(p.pseudo, p.x, p.y - 75);
        }

        const diamond = diamonds[currentMap];
        if (!diamond.collected) ctx.drawImage(images.diamond, diamond.x - 30, diamond.y - 60, 60, 60);
        else ctx.drawImage(images.diamondBroken, diamond.x - 30, diamond.y - 60, 60, 60);
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    loop();
}

