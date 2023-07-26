import './style.css'
const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext('2d');

let width: number;
let height: number;
let scale: number;

const epsilon = 0.4;
const radius = 35;

let players: Array<string> = [];
let balls: Array<Ball> = [];
let stars: Array<{ x: number, y: number, r: number, alpha: number }> = [];

const randColor = () => '#' + Math.floor((Math.random() * 0.9 + 0.1) * 16777215).toString(16);

class Vec {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    sub(other: Vec): Vec {
        return new Vec(this.x - other.x, this.y - other.y);
    }

    add(other: Vec): Vec {
        return new Vec(this.x + other.x, this.y + other.y);
    }

    mul(s: number): Vec {
        return new Vec(s * this.x, s * this.y);
    }

    normalize(): Vec {
        let m = this.mag();
        return new Vec(this.x / m, this.y / m);
    }

    withMag(mag: number): Vec {
        const v = this.normalize();
        return new Vec(v.x * mag, v.y * mag);
    }

    dot(other: Vec): number {
        return this.x * other.x + this.y * other.y;
    }
}

class Ball {
    pos: Vec;
    vel: Vec;
    radius: number;
    color: string;
    name: string;

    constructor(
        pos: Vec,
        vel: Vec,
        radius: number,
        color: string,
        name: string) {
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.color = color;
        this.name = name;
    }


    collide(other: Ball) {
        if (other == this) {
            return;
        }
        let relative = other.pos.sub(this.pos);
        let dist = relative.mag() - (this.radius + other.radius);
        if (dist < 0) {
            const velDiff = this.vel.sub(other.vel);
            const posDiff = this.pos.sub(other.pos);
            const distSq = posDiff.dot(posDiff);
            const cosAngle = velDiff.dot(posDiff);
            this.vel = this.vel.sub(posDiff.mul(cosAngle / distSq));
            if (this.vel.mag() < 3) { this.vel = this.vel.withMag(3) };
            other.vel = other.vel.add(posDiff.mul(cosAngle / distSq));
            if (other.vel.mag() < 3) { other.vel = other.vel.withMag(3) };
        }
    }

    move() {
        this.pos = this.pos.add(this.vel);
        if (this.pos.x < this.radius) {
            this.pos.x = this.radius;
            this.vel.x = -this.vel.x;
        }
        if (this.pos.x > width - this.radius) {
            this.pos.x = width - this.radius;
            this.vel.x = -this.vel.x;
        }
        if (this.pos.y < this.radius) {
            this.pos.y = this.radius;
            this.vel.y = -this.vel.y;
        }
        if (this.pos.y > height - this.radius) {
            this.pos.y = height - this.radius;
            this.vel.y = -this.vel.y;
        }
    }

    gone(): boolean {
        let center = new Vec(width / 2, height / 2);
        let relative = center.sub(this.pos);
        let dist = relative.mag() - this.radius * 2 - 5;
        return dist < 0;
    }

    render(size: number) {
        if (!ctx) return;
        if (!canvas) return;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5 * size * scale;
        ctx.beginPath();
        ctx.arc(
            this.pos.x,
            this.pos.y,
            this.radius * size * scale,
            epsilon,
            Math.PI - epsilon
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(

            this.pos.x,
            this.pos.y,
            this.radius * size * scale,
            Math.PI + epsilon,
            -epsilon
        );
        ctx.stroke();
        ctx.font = `bold ${20 * size * scale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.pos.x, this.pos.y);
    }
}


const playerTextarea = document.getElementById('players') as HTMLInputElement | null;
playerTextarea?.addEventListener('input', function (event) {
    const target = event.target as HTMLInputElement;
    players = target.value.split(',');
    players = players.map(v => v.trim());
});

const playButton = document.getElementById('playButton');
playButton?.addEventListener('click', function handleClick(_event) {
    setup();
});

function randomVelocity(mag: number): Vec {
    let x = 0;
    let y = 0;
    while (Math.abs(x) <= 0.1) { x = Math.random() - 0.5 };
    while (Math.abs(y) <= 0.1) { y = Math.random() - 0.5 };
    return new Vec(x, y).withMag(mag);
}

function randomPosition(width: number, height: number): Vec {
    let pos = new Vec(width / 2, height / 2);
    const center = new Vec(width / 2, height / 2);
    while (pos.sub(center).mag() < 2 * radius) {
        pos = new Vec(Math.random() * width, Math.random() * height);
    }
    return pos;
}

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

function setStars(n: number) {
    for (let i = 0; i < n; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 3;
        const alpha = Math.random();
        stars.push({ x, y, r, alpha });
    }
}

function nightstars() {
    if (!ctx) { return };
    for (const star of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * star.alpha})`;
        ctx.beginPath();
        ctx.arc(
            star.x,
            star.y,
            star.r * scale,
            0,
            2 * Math.PI
        );
        ctx.fill();
    }
}

function setup() {
    if (!ctx || !canvas) { return };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    balls = [];
    const n = players.length;
    for (let i = 0; i < n; i++) {
        balls.push(
            new Ball(
                randomPosition(width, height),
                randomVelocity(5),
                radius,
                randColor(),
                players[i]
            )
        );
    }
    stars = [];
    setStars(70);
    window.requestAnimationFrame(draw);
};

function draw() {
    if (!ctx) return;
    let id = 0;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black'
    ctx.fillRect(0, 0, width, height);
    ctx.strokeRect(0, 0, width, height);
    nightstars();
    const x = width / 2;
    const y = height / 2;
    let diameter = radius;

    sun(width / 2, height / 2, 1.4 * radius * scale, 16, 0.65);

    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(255, 65, 0, 0.31)';
        ctx.beginPath();
        ctx.arc(x, y, diameter * scale, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        diameter /= 1.8;
    }

    let bs = balls.filter((e) => !e.gone());
    balls = balls.length === 1 ? balls : bs;

    for (let i = 0; i < balls.length; i++) {
        for (let j = 0; j < i; j++) {
            balls[i].collide(balls[j]);
        }
    }

    for (let i = 0; i < balls.length; i++) {
        balls[i].move();
        balls[i].render(1);
    }

    if (balls.length < 2) {
        window.cancelAnimationFrame(id)
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black'
        ctx.fillRect(0, 0, width, height);
        ctx.strokeRect(0, 0, width, height);
        nightstars();
        let ball = balls[0];
        ball.pos = new Vec(width / 2, height / 2);
        ball.render(3);
        ball.move();
    } else {
        id = window.requestAnimationFrame(draw)
    };
};

function resizeCanvas() {
    if (!canvas || !ctx) { return };
    const windowWidth = 0.75 * window.innerWidth;
    const windowHeight = 0.60 * window.innerHeight;

    canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
    canvas.height = Math.floor(windowHeight * window.devicePixelRatio);

    canvas.style.width = windowWidth + "px";
    canvas.style.height = windowHeight + "px";

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    width = windowWidth;
    height = windowHeight;
    scale = Math.max(width, height) / 1000;
}