import { Vec } from './vec';
import { RADIUS, BallState, GameState, gameState, canvas, ctx, Status } from './core';

const EPSILON = 0.4;
const FADE = 0.95;

function randomVelocity(mag: number): Vec {
    let x = 0;
    let y = 0;
    while (Math.abs(x) <= 0.1) { x = Math.random() - 0.5 };
    while (Math.abs(y) <= 0.1) { y = Math.random() - 0.5 };
    let vel = new Vec(x, y).withMag(mag);
    vel.unzero();
    return vel;
}

function randomPosition(width: number, height: number, radius: number): Vec {
    let pos = new Vec(width / 2, height / 2);
    const center = new Vec(width / 2, height / 2);
    while (pos.sub(center).mag() < 2 * radius) {
        pos = new Vec(Math.random() * width, Math.random() * height);
    }
    return pos;
}

export class Rgba {
    constructor(
        public r: number = 0,
        public g: number = 0,
        public b: number = 0,
        public a: number = 1) {
    }

    color() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    setAlpha(a: number) {
        this.a = a;
    }

    random() {
        this.r = Math.floor(Math.random() * 200 + 55);
        this.g = Math.floor(Math.random() * 200 + 55);
        this.b = Math.floor(Math.random() * 200 + 55);
    }
}

export class Ball {
    constructor(
        public radius: number,
        public id: number = 0,
        public pos: Vec = new Vec(0, 0),
        public vel: Vec = new Vec(0, 0),
        public color: Rgba = new Rgba(),
        public name: string = '',
        public state: BallState = BallState.ALIVE) {
        color.random();
        this.color = color;
    };

    reset(gameState: GameState) {
        this.state = BallState.ALIVE;
        this.pos = randomPosition(gameState.width, gameState.height, RADIUS * gameState.scale);
        this.vel = randomVelocity(7 * gameState.scale);
        this.radius = RADIUS * gameState.scale;
        this.color.setAlpha(1);
    }

    collide(other: Ball) {
        if (other == this || this.state !== BallState.ALIVE || other.state !== BallState.ALIVE) {
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
        if (this.state === BallState.DEAD) {
            this.vel = this.vel.mul(-0.95);
        }
        this.pos = this.pos.add(this.vel);
        if (this.pos.x < this.radius) {
            this.pos.x = this.radius;
            this.vel.x = -this.vel.x;
        }
        if (this.pos.x > gameState.width - this.radius) {
            this.pos.x = gameState.width - this.radius;
            this.vel.x = -this.vel.x;
        }
        if (this.pos.y < this.radius) {
            this.pos.y = this.radius;
            this.vel.y = -this.vel.y;
        }
        if (this.pos.y > gameState.height - this.radius) {
            this.pos.y = gameState.height - this.radius;
            this.vel.y = -this.vel.y;
        }
        this.vel.unzero();
    }

    gone() {
        let center = new Vec(gameState.width / 2, gameState.height / 2);
        let relative = center.sub(this.pos);
        let dist = relative.mag() - this.radius * 2 - 5;
        if (dist < 0 && gameState.status as Status !== Status.OVER) {
            this.state = BallState.DEAD;
            gameState.runnerUp = this.id;
        }
    }

    render(size: number) {
        if (!ctx) return;
        if (!canvas) return;
        let fontSize = 20 / RADIUS * this.radius * size * gameState.scale;
        ctx.strokeStyle = this.color.color();
        ctx.lineWidth = 5 * size * gameState.scale;
        if (this.state === BallState.DEAD) {
            this.radius = this.radius < 3 ? 0 : this.radius * FADE;
            if (this.radius < 3) {
                fontSize = 0;
            } else {
                fontSize *= FADE;
            }
            this.color.setAlpha(FADE * this.radius / RADIUS);
        }
        ctx.beginPath();
        ctx.arc(
            this.pos.x,
            this.pos.y,
            this.radius * size,
            EPSILON,
            Math.PI - EPSILON
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
            this.pos.x,
            this.pos.y,
            this.radius * size,
            Math.PI + EPSILON,
            -EPSILON
        );
        ctx.stroke();
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = this.color.color();
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.pos.x, this.pos.y);
    }
}