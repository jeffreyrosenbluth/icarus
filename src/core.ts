import { Ball } from "./balls";
import { Vec } from "./vec";

export const canvas = document.querySelector("canvas");
export const ctx = canvas?.getContext('2d');

export const RADIUS = 40;

export enum BallState {
    ALIVE,
    DEAD,
}

// A game can be paused, started, or over.
export enum Status {
    PAUSED,
    STARTED,
    OVER,
}

export class GameState {
    constructor(
        public width: number = 0,
        public height: number = 0,
        public status: Status = Status.PAUSED,
        public scale: number = 1,
        public players: Array<string> = [],
        public balls: Array<Ball> = [],
        // The position, radius and opacity of the background stars.
        public stars: Array<{ x: number, y: number, r: number, alpha: number }> = [],
        // The frame number of the animation, used to cancel the animation frame,when complete.
        public frame: number = 0,
        // The penuultimate ball.
        public runnerUp: number = 0) {
        for (let i = 0; i < 70; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const r = Math.random() * 3;
            const alpha = Math.random();
            this.stars.push({ x, y, r, alpha });
        }
    }

    // The center of the game area.
    center() {
        return new Vec(this.width / 2, this.height / 2);
    }

    reset() {
        this.resize();
        this.balls.forEach(ball => {
            ball.reset(this);
        });
        this.status = Status.PAUSED;
    }

    resize() {
        const windowWidth = 0.75 * window.innerWidth;
        const windowHeight = 0.60 * window.innerHeight;
        this.width = windowWidth;
        this.height = windowHeight;
        this.scale = Math.sqrt(gameState.width * gameState.height) / 1000;
    }

    setStars(n: number) {
        for (let i = 0; i < n; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const r = Math.random() * 3;
            const alpha = Math.random();
            this.stars.push({ x, y, r, alpha });
        }
    }

    gameOver() {
        let count = this.balls.reduce((acc, ball) => {
            return ball.state === BallState.ALIVE ? acc + 1 : acc;
        }, 0);
        if (count === 1) {
            this.status = Status.OVER;
        }
    }

    winners() {
        return this.balls.filter(ball => ball.state === BallState.ALIVE);
    }
}

export let gameState = new GameState(0.75 * window.innerWidth, 0.60 * window.innerHeight);
