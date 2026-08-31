import { Vector3 } from "@babylonjs/core";

import type { WeaponDefinition } from "./weapon.js";

export const pistolDefinition: WeaponDefinition = {
    id: "pistol",
    modelPath: "/assets/weapons/pistol.glb",

    damage: 20,
    range: 1000,
    magazineSize: 1200,
    reserveAmmo: 600000,
    roundsPerMinute: 300,

    modelPosition: new Vector3(0.2, -0.25, 0.65),
    modelRotation: new Vector3(0, Math.PI, 0),
    modelScale: Vector3.One().setAll(0.1)
};
