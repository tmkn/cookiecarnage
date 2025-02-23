function hashStringToSeed(input: string): number {
    let hash = 2166136261;
    const data = new TextEncoder().encode(input);
    for (let byte of data) {
        hash ^= byte;
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

class Mulberry32 {
    private state: number;

    constructor(seed: number) {
        this.state = seed | 0;
    }

    next(): number {
        this.state |= 0;
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return (t ^ (t >>> 14)) >>> 0; // Ensures a positive 32-bit integer
    }

    nextInRange(min: number, max: number): number {
        return min + (this.next() % (max - min + 1)); // Ensure it falls within range
    }
}

// create a deterministic RNG based on the URL
export function createRNG(url: string): Mulberry32 {
    return new Mulberry32(hashStringToSeed(url));
}
