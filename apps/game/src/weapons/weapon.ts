import {
    AnimationGroup,
    Camera,
    ImportMeshAsync,
    TransformNode,
    Vector3,
    type ISceneLoaderAsyncResult,
    type Scene
} from "@babylonjs/core";

export interface WeaponDefinition {
    id: string;
    modelPath: string;

    damage: number;
    range: number;
    magazineSize: number;
    reserveAmmo: number;
    roundsPerMinute: number;

    modelPosition: Vector3;
    modelRotation: Vector3;
    modelScale: Vector3;
}

export class Weapon {
    magazineAmmo: number;
    reserveAmmo: number;

    private result?: ISceneLoaderAsyncResult;
    private weaponRoot?: TransformNode;
    private weaponAnimations: AnimationGroup[] = [];

    get id(): string {
        return this._definition.id;
    }

    constructor(private readonly _definition: WeaponDefinition) {
        this.magazineAmmo = _definition.magazineSize;
        this.reserveAmmo = _definition.reserveAmmo;
    }

    async load(scene: Scene, camera: Camera): Promise<void> {
        this.result = await ImportMeshAsync(this._definition.modelPath, scene);

        this.weaponRoot = new TransformNode(`${this._definition.id}-root`, scene);

        this.weaponRoot.parent = camera;

        // Babylon camera-local coordinates:
        // +X right, +Y up, +Z forward.
        this.weaponRoot.position.copyFrom(this._definition.modelPosition);
        this.weaponRoot.rotation.copyFrom(this._definition.modelRotation);
        this.weaponRoot.scaling.copyFrom(this._definition.modelScale);

        // Put all imported root-level transform nodes
        // underneath our weapon root.
        for (const node of this.result.transformNodes) {
            if (!node.parent) {
                node.parent = this.weaponRoot;
            }
        }

        // Handle meshes that aren't children of an imported
        // transform node.
        for (const mesh of this.result.meshes) {
            if (!mesh.parent) {
                mesh.parent = this.weaponRoot;
            }

            mesh.isPickable = false;
            mesh.checkCollisions = false;
        }

        this.weaponAnimations = this.result.animationGroups;

        this.playWeaponAnimation("Idle", true);
    }

    setVisible(visible: boolean): void {
        this.weaponRoot?.setEnabled(visible);
    }

    playWeaponAnimation(name: string, loop = false): void {
        const animation = this.weaponAnimations.find(group => group.name === name);

        if (!animation) {
            console.warn(`Missing weapon animation: ${name}`);
            return;
        }

        for (const group of this.weaponAnimations) {
            group.stop();
        }

        animation.start(loop);
    }

    tryFire(scene: Scene, camera: Camera): boolean {
        if (this.magazineAmmo <= 0) {
            return false;
        }

        this.magazineAmmo--;

        this.playWeaponAnimation("Fire");

        const ray = camera.getForwardRay(this._definition.range);

        const hit = scene.pickWithRay(ray, mesh => mesh.isPickable);

        if (hit?.hit && hit.pickedPoint) {
            console.log(`Hit ${hit.pickedMesh?.name} at ${hit.pickedPoint.toString()}`);
        } else {
            console.log(`Missed`);
        }

        return true;
    }

    reload(): void {
        const needed = this._definition.magazineSize - this.magazineAmmo;

        const amount = Math.min(needed, this.reserveAmmo);

        this.magazineAmmo += amount;
        this.reserveAmmo -= amount;

        this.playWeaponAnimation("Reload");
    }

    dispose(): void {
        for (const animation of this.weaponAnimations) {
            animation.dispose();
        }

        this.weaponRoot?.dispose(false, true);

        this.weaponAnimations = [];
        this.result = undefined;
        this.weaponRoot = undefined;
    }
}
