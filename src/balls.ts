import { Vec } from './vec';
import { RADIUS, BallState, GameState, gameState, canvas, ctx } from './core';


const randColor = () => '#' + Math.floor((Math.random() * 0.9 + 0.1) * 16777215).toString(16);

function randomVelocity(mag: number): Vec {
    let x = 0;
    let y = 0;
    while (Math.abs(x) <= 0.1) { x = Math.random() - 0.5 };
    while (Math.abs(y) <= 0.1) { y = Math.random() - 0.5 };
    return new Vec(x, y).withMag(mag);
}

function randomPosition(width: number, height: number, radius: number): Vec {
    let pos = new Vec(width / 2, height / 2);
    const center = new Vec(width / 2, height / 2);
    while (pos.sub(center).mag() < 2 * radius) {
        pos = new Vec(Math.random() * width, Math.random() * height);
    }
    return pos;
}

export class Ball {
    constructor(
        public pos: Vec = new Vec(0, 0),
        public vel: Vec = new Vec(0, 0),
        public radius: number = RADIUS,
        public color: string = randColor(),
        public name: string = '',
        public state: BallState = BallState.ACTIVE) {
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.color = color;
        this.name = name;
        this.state = state;
    };

    reset(gameState: GameState) {
        this.state = BallState.ACTIVE;
        this.pos = randomPosition(gameState.width, gameState.height, RADIUS);
        this.vel = randomVelocity(7 * gameState.scale);
        this.radius = RADIUS;
    }

    collide(other: Ball) {
        if (other == this || this.state !== BallState.ACTIVE || other.state !== BallState.ACTIVE) {
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
        if (this.state === BallState.WINNER) {
            this.vel = this.pos.sub(new Vec(gameState.width / 2, gameState.height / 2)).withMag(2);
            return;
        }
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
    }

    gone() {
        let center = new Vec(gameState.width / 2, gameState.height / 2);
        let relative = center.sub(this.pos);
        let dist = relative.mag() - this.radius * 2 - 5;
        this.state = dist < 0 ? BallState.DEAD : this.state;
    }

    render(size: number) {
        const epsilon = 0.4;
        if (!ctx) return;
        if (!canvas) return;
        let fontSize = 20 / RADIUS * this.radius * size * gameState.scale;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5 * size * gameState.scale;
        if (this.state === BallState.DEAD) {
            this.radius = this.radius < 3 ? 0 : this.radius * 0.975;
            if (this.radius < 3) {
                fontSize = 0;
            } else
                fontSize *= 0.975;
        }
        ctx.beginPath();
        ctx.arc(
            this.pos.x,
            this.pos.y,
            this.radius * size * gameState.scale,
            epsilon,
            Math.PI - epsilon
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(

            this.pos.x,
            this.pos.y,
            this.radius * size * gameState.scale,
            Math.PI + epsilon,
            -epsilon
        );
        ctx.stroke();
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.pos.x, this.pos.y);
    }
}