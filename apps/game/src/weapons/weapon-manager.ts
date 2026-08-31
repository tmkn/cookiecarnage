import type { Camera, Scene } from "@babylonjs/core";

import { Weapon, type WeaponDefinition } from "./weapon.js";

export class WeaponManager {
    private activeWeapon?: Weapon;
    private weapons: Weapon[] = [];

    constructor(
        private readonly scene: Scene,
        private readonly camera: Camera
    ) {}

    async addWeapon(definition: WeaponDefinition): Promise<void> {
        const hasWeapon = this.weapons.some(weapon => weapon.id === definition.id);

        if (hasWeapon) return;

        const weapon = new Weapon(definition);

        await weapon.load(this.scene, this.camera);

        this.weapons.push(weapon);
    }

    equip(id: string): void {
        const weapon = this.weapons.find(weapon => weapon.id === id);

        if (!weapon) return;

        this.activeWeapon?.setVisible(false);

        this.activeWeapon = weapon;
        weapon.setVisible(true);
    }

    fire(): void {
        console.log(`fired`);
        this.activeWeapon?.tryFire(this.scene, this.camera);
    }
}
