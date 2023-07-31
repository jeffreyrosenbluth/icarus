// A 2d vector class.  This is used for the position and velocity of the ball.
export class Vec {
    constructor(public x: number, public y: number) {
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

    // Create a new vector with the same direction as this one, but with the given magnitude.
    withMag(mag: number): Vec {
        const v = this.normalize();
        return new Vec(v.x * mag, v.y * mag);
    }

    dot(other: Vec): number {
        return this.x * other.x + this.y * other.y;
    }

    distance(other: Vec): number {
        return this.sub(other).mag();
    }


    // If the vector is very small in either direction, make it a little bigger.
    // This is used to prevent the ball from moving parallel to an axis.
    unzero() {
        const m = this.mag();
        if (Math.abs(this.x) < 0.1) {
            this.x = 0.1 * m * Math.sign(this.x);
            this.y = 0.9 * m * Math.sign(this.y);
        }
        if (Math.abs(this.y) < 0.05) {
            this.x = 0.9 * m * Math.sign(this.x);
            this.y = 0.1 * m * Math.sign(this.y);
        }
    }
}