import { Ball } from "./balls";

export const canvas = document.querySelector("canvas");
export const ctx = canvas?.getContext('2d');

export const RADIUS = 35;

export enum BallState {
    ACTIVE,
    DEAD,
    WINNER,
}

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
        public stars: Array<{ x: number, y: number, r: number, alpha: number }> = [],
        public frame: number = 0,) {
        this.width = width;
        this.height = height;
        this.status = status;
        this.scale = scale;
        this.players = players;
        this.balls = balls;
        for (let i = 0; i < 70; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const r = Math.random() * 3;
            const alpha = Math.random();
            this.stars.push({ x, y, r, alpha });
        }
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
        this.scale = Math.max(gameState.width, gameState.height) / 1000;
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
            return ball.state === BallState.ACTIVE ? acc + 1 : acc;
        }, 0);
        if (count === 1) { this.status = Status.OVER };
    }
}

export let gameState = new GameState(0.75 * window.innerWidth, 0.60 * window.innerHeight);
