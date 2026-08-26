import { expect, test, describe } from "vitest";

import { createRNG } from "../src/rng.js";

describe(`RNG tests`, () => {
    test(`produces the same numbers for the same seed`, () => {
        const rng1 = createRNG("https://example.com");
        const rng2 = createRNG("https://example.com");

        const randomValues1 = Array.from({ length: 4 }, () => rng1.next());
        const randomValues2 = Array.from({ length: 4 }, () => rng2.next());

        expect(randomValues1).toEqual(randomValues2);
    });
});
