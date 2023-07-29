import './style.css'
import { Ball } from './balls';
import { canvas, ctx, gameState, Status, RADIUS } from './core';


const playerTextarea = document.getElementById('players') as HTMLInputElement | null;
playerTextarea?.addEventListener('input', function (event) {
    const target = event.target as HTMLInputElement;
    const players = target.value.split(',');
    gameState.players = players.map(v => v.trim());
    gameState.balls = [];
    gameState.players.forEach((name, i) => {
        let ball = new Ball();
        ball.name = name;
        ball.id = i;
        gameState.balls.push(ball);
    });
    gameState.reset();
});

const playButton = document.getElementById('playButton');
playButton?.addEventListener('click', function handleClick(_event) {
    window.cancelAnimationFrame(gameState.frame);
    gameState.reset();
    gameState.status = Status.STARTED;
    draw();
});


function sun(x: number, y: number, r: number, n: number, inset: number) {
    if (!ctx) return;
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - r);
    for (let i = 0; i < n; i++) {
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - (r * inset));
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - r);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.fill();
    ctx.restore();
}

function nightstars() {
    if (!ctx) { return };
    for (const star of gameState.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * star.alpha})`;
        ctx.beginPath();
        ctx.arc(
            star.x,
            star.y,
            star.r * gameState.scale,
            0,
            2 * Math.PI
        );
        ctx.fill();
    }
}

function setup() {
    if (!ctx || !canvas) { return };
    gameState.reset();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    gameState.frame = window.requestAnimationFrame(draw);
};

function draw() {
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black'
    ctx.fillRect(0, 0, gameState.width, gameState.height);
    ctx.strokeRect(0, 0, gameState.width, gameState.height);
    nightstars();
    const x = gameState.width / 2;
    const y = gameState.height / 2;
    let radius = RADIUS;

    sun(gameState.width / 2, gameState.height / 2, 1.4 * radius * gameState.scale, 16, 0.65);

    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(255, 65, 0, 0.31)';
        ctx.beginPath();
        ctx.arc(x, y, radius * gameState.scale, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        radius /= 1.8;
    }

    if (gameState.status === Status.PAUSED) { return };

    for (let i = 0; i < gameState.balls.length; i++) {
        gameState.balls[i].gone();
        for (let j = 0; j < i; j++) {
            gameState.balls[i].collide(gameState.balls[j]);
        }
    }

    for (let i = 0; i < gameState.balls.length; i++) {
        gameState.balls[i].move();
        gameState.balls[i].render(1);
    }

    gameState.gameOver();
    if (gameState.status as Status === Status.OVER) {
        if (gameState.balls[gameState.runnerUp].radius < 3) {
            window.cancelAnimationFrame(gameState.frame);
            animateWinner();
            return;
        }
    }
    gameState.frame = window.requestAnimationFrame(draw)
};

function animateWinner() {
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black'
    ctx.fillRect(0, 0, gameState.width, gameState.height);
    ctx.strokeRect(0, 0, gameState.width, gameState.height);
    nightstars();

    const x = gameState.width / 2;
    const y = gameState.height / 2;
    const ball = gameState.balls[0];
    const fontSize = 20 / RADIUS * ball.radius * gameState.scale;
    const text = `${ball.name} wins!`;

    ctx.font = `bold ${fontSize}px sans-serif`;
    ball.color.setAlpha(1);
    ctx.fillStyle = ball.color.color();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);

    ball.radius += 0.5;
    if (ball.radius > 100) {
        ball.radius = 0;
        ball.reset(gameState);
        window.cancelAnimationFrame(gameState.frame);
        return;
    }
    gameState.frame = window.requestAnimationFrame(animateWinner);
}

function resizeCanvas() {
    if (!canvas || !ctx) { return };
    const windowWidth = 0.75 * window.innerWidth;
    const windowHeight = 0.60 * window.innerHeight;

    canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
    canvas.height = Math.floor(windowHeight * window.devicePixelRatio);

    canvas.style.width = windowWidth + "px";
    canvas.style.height = windowHeight + "px";

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    gameState.width = windowWidth;
    gameState.height = windowHeight;
    gameState.scale = Math.max(gameState.width, gameState.height) / 1000;
    draw();
}

setup();