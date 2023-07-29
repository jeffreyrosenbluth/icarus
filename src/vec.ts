export class Vec {
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

    unzero() {
        const m = this.mag();
        if (Math.abs(this.x) < 0.01) {
            this.x = 0.1 * m * Math.sign(this.x);
            this.y = 0.9 * m * Math.sign(this.y);
        }
        if (Math.abs(this.y) < 0.01) {
            this.x = 0.9 * m * Math.sign(this.x);
            this.y = 0.1 * m * Math.sign(this.y);
        }
    }
}