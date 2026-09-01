import {
    Color3,
    Color4,
    Engine,
    FreeCamera,
    Mesh,
    MeshBuilder,
    Ray,
    Scene,
    Vector3
} from "@babylonjs/core";
import type { FC } from "react";
import { createRoot } from "react-dom/client";

import { createLighting, createLevel } from "./sandbox-level-helper";

export class Game {
    private readonly engine: Engine;
    private readonly scene: Scene;
    private readonly camera: FreeCamera;
    private readonly canvas: HTMLCanvasElement;
    private readonly playerCollider: Mesh;

    private readonly keys = new Set<string>();

    private playerPosition = new Vector3(0, 2, 0);
    private velocity = Vector3.Zero();
    private grounded = false;
    private groundNormal = Vector3.Up();

    private readonly fixedTimeStep = 1 / 120;
    private accumulatedTime = 0;

    private readonly eyeHeight = 2;
    private readonly playerRadius = 0.45;
    private readonly stepHeight = 0.5;
    private readonly groundSnapDistance = 0.12;
    private readonly minimumGroundNormalY = Math.cos(Math.PI * 0.28);

    private readonly gravity = -20;
    private readonly jumpSpeed = 8;

    private readonly groundSpeed = 10;
    private readonly groundAcceleration = 80;
    private readonly friction = 10;
    private readonly stopSpeed = 2;

    private readonly airAcceleration = 70;
    private readonly maxAirWishSpeed = 2.5;

    private bobPhase = 0;
    private bobAmount = 0;
    private tiltAngle = 0;

    private landingOffset = 0;
    private landingVelocity = 0;

    private readonly bobFrequency = 1.8;
    private readonly bobAmplitude = 0.12;
    private readonly bobSideAmplitude = 0.045;
    private readonly tiltMax = 0.04;
    private readonly tiltSpeed = 8;

    private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (document.pointerLockElement !== this.canvas) {
            return;
        }

        if (
            event.code === "Space" ||
            event.code === "KeyW" ||
            event.code === "KeyA" ||
            event.code === "KeyS" ||
            event.code === "KeyD"
        ) {
            event.preventDefault();
            this.keys.add(event.code);
        }
    };

    private readonly onKeyUp = (event: KeyboardEvent): void => {
        this.keys.delete(event.code);
    };

    private readonly onWindowBlur = (): void => {
        this.keys.clear();
    };

    private readonly onPointerLockChange = (): void => {
        if (document.pointerLockElement !== this.canvas) {
            this.keys.clear();
        }
    };

    private readonly onCanvasClick = (): void => {
        if (document.pointerLockElement !== this.canvas) {
            void this.canvas.requestPointerLock();
        }
    };

    private readonly onResize = (): void => {
        this.engine.resize();
    };

    constructor(container: HTMLElement) {
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.display = "block";
        this.canvas.tabIndex = 0;

        container.appendChild(this.canvas);

        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);
        this.scene.collisionsEnabled = true;
        this.scene.clearColor = new Color4(0.32, 0.39, 0.43, 1);
        this.scene.ambientColor = new Color3(0.25, 0.27, 0.28);

        this.camera = new FreeCamera("playerCamera", this.playerPosition.clone(), this.scene);

        this.camera.minZ = 0.1;
        this.camera.speed = 0;
        this.camera.inertia = 0;
        this.camera.angularSensibility = 2000;

        // Disable Babylon's built-in keyboard movement while preserving mouse look.
        this.camera.keysUp = [];
        this.camera.keysDown = [];
        this.camera.keysLeft = [];
        this.camera.keysRight = [];
        this.camera.attachControl(this.canvas, true);

        this.playerCollider = MeshBuilder.CreateBox("playerCollider", { size: 1 }, this.scene);

        this.playerCollider.position.copyFrom(this.playerPosition);
        this.playerCollider.ellipsoid.set(this.playerRadius, this.eyeHeight / 2, this.playerRadius);
        this.playerCollider.ellipsoidOffset.set(0, -this.eyeHeight / 2, 0);
        this.playerCollider.isVisible = false;
        this.playerCollider.isPickable = false;
        this.playerCollider.checkCollisions = false;

        createLighting(this.scene);
        createLevel(this.scene);

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onWindowBlur);
        window.addEventListener("resize", this.onResize);

        document.addEventListener("pointerlockchange", this.onPointerLockChange);

        this.canvas.addEventListener("click", this.onCanvasClick);

        this.updateGroundState();
    }

    start(): void {
        this.engine.runRenderLoop(() => {
            const frameTime = Math.min(this.engine.getDeltaTime() / 1000, 0.1);

            this.accumulatedTime = Math.min(
                this.accumulatedTime + frameTime,
                this.fixedTimeStep * 8
            );

            while (this.accumulatedTime >= this.fixedTimeStep) {
                this.updatePhysics(this.fixedTimeStep);
                this.accumulatedTime -= this.fixedTimeStep;
            }

            this.applyViewEffects(frameTime);
            this.scene.render();
        });
    }

    private updatePhysics(deltaTime: number): void {
        this.updateGroundState();

        const wasGrounded = this.grounded;
        const fallSpeed = this.velocity.y;
        const wishDirection = this.getWishDirection();

        if (this.grounded) {
            this.velocity.y = 0;

            if (this.keys.has("Space")) {
                this.velocity.y = this.jumpSpeed;
                this.grounded = false;
            } else {
                this.applyFriction(deltaTime);

                if (wishDirection.lengthSquared() > 0) {
                    this.accelerate(
                        wishDirection,
                        this.groundSpeed,
                        this.groundAcceleration,
                        deltaTime
                    );
                }
            }
        } else {
            if (wishDirection.lengthSquared() > 0) {
                this.accelerate(
                    wishDirection,
                    this.maxAirWishSpeed,
                    this.airAcceleration,
                    deltaTime
                );
            }

            this.velocity.y += this.gravity * deltaTime;
        }

        const requestedMovement = this.velocity.scale(deltaTime);
        const actualMovement = this.movePlayer(requestedMovement, wasGrounded);

        this.resolveBlockedVelocity(requestedMovement, actualMovement);

        this.playerPosition.copyFrom(this.playerCollider.position);
        this.updateGroundState();

        if (!wasGrounded && this.grounded && fallSpeed < -4) {
            this.startLandingEffect(fallSpeed);
        }
    }

    private resolveBlockedVelocity(requested: Vector3, actual: Vector3): void {
        if (Math.abs(actual.y - requested.y) > 0.001) {
            this.velocity.y = 0;
        }

        const blocked = new Vector3(requested.x - actual.x, 0, requested.z - actual.z);

        if (blocked.lengthSquared() <= 0.000001) {
            return;
        }

        blocked.normalize();

        const speedIntoObstacle = Vector3.Dot(this.velocity, blocked);

        if (speedIntoObstacle > 0) {
            this.velocity.subtractInPlace(blocked.scale(speedIntoObstacle));
        }
    }

    private getWishDirection(): Vector3 {
        const yaw = this.camera.rotation.y;

        // Movement comes only from yaw, so visual roll and pitch cannot
        // alter the player's movement direction.
        const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));

        const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

        const wishDirection = Vector3.Zero();

        if (this.keys.has("KeyW")) {
            wishDirection.addInPlace(forward);
        }

        if (this.keys.has("KeyS")) {
            wishDirection.subtractInPlace(forward);
        }

        if (this.keys.has("KeyD")) {
            wishDirection.addInPlace(right);
        }

        if (this.keys.has("KeyA")) {
            wishDirection.subtractInPlace(right);
        }

        if (wishDirection.lengthSquared() > 0) {
            wishDirection.normalize();
        }

        return wishDirection;
    }

    private movePlayer(displacement: Vector3, canStep: boolean): Vector3 {
        const start = this.playerCollider.position.clone();

        this.playerCollider.moveWithCollisions(displacement);

        const directPosition = this.playerCollider.position.clone();
        const directMovement = directPosition.subtract(start);

        const desiredHorizontalDistance = Math.hypot(displacement.x, displacement.z);

        const directHorizontalDistance = Math.hypot(directMovement.x, directMovement.z);

        const hitHorizontalObstacle = desiredHorizontalDistance - directHorizontalDistance > 0.001;

        if (!canStep || !hitHorizontalObstacle) {
            return directMovement;
        }

        // Retry the blocked movement by stepping up, moving forward,
        // and dropping back onto the ground.
        this.setColliderPosition(start);
        this.playerCollider.moveWithCollisions(new Vector3(0, this.stepHeight, 0));

        const raisedHeight = this.playerCollider.position.y - start.y;

        if (raisedHeight < this.stepHeight * 0.9) {
            this.setColliderPosition(directPosition);
            return directMovement;
        }

        this.playerCollider.moveWithCollisions(new Vector3(displacement.x, 0, displacement.z));

        this.playerCollider.moveWithCollisions(
            new Vector3(0, displacement.y - this.stepHeight - this.groundSnapDistance, 0)
        );

        const steppedPosition = this.playerCollider.position.clone();
        const steppedMovement = steppedPosition.subtract(start);
        const steppedHorizontalDistance = Math.hypot(steppedMovement.x, steppedMovement.z);

        if (steppedHorizontalDistance > directHorizontalDistance + 0.001) {
            return steppedMovement;
        }

        this.setColliderPosition(directPosition);
        return directMovement;
    }

    private setColliderPosition(position: Vector3): void {
        this.playerCollider.position.copyFrom(position);
        this.playerCollider.computeWorldMatrix(true);
    }

    private updateGroundState(): void {
        this.playerPosition.copyFrom(this.playerCollider.position);

        const ray = new Ray(
            this.playerPosition,
            Vector3.Down(),
            this.eyeHeight + this.groundSnapDistance
        );

        const hit = this.scene.pickWithRay(
            ray,
            mesh => mesh !== this.playerCollider && mesh.checkCollisions && mesh.isEnabled()
        );

        const normal = hit?.hit ? hit.getNormal(true) : null;

        if (
            !hit?.hit ||
            hit.distance === undefined ||
            !normal ||
            normal.y < this.minimumGroundNormalY ||
            hit.distance > this.eyeHeight + this.groundSnapDistance ||
            this.velocity.y > 0
        ) {
            this.grounded = false;
            this.groundNormal.copyFromFloats(0, 1, 0);
            return;
        }

        this.grounded = true;
        this.groundNormal.copyFrom(normal);

        const groundGap = hit.distance - this.eyeHeight;

        if (groundGap > 0.001) {
            this.playerCollider.moveWithCollisions(new Vector3(0, -groundGap, 0));

            this.playerPosition.copyFrom(this.playerCollider.position);
        }

        this.velocity.y = 0;
    }

    private accelerate(
        direction: Vector3,
        wishSpeed: number,
        acceleration: number,
        deltaTime: number
    ): void {
        const currentSpeed = Vector3.Dot(this.velocity, direction);

        const addSpeed = wishSpeed - currentSpeed;

        if (addSpeed <= 0) {
            return;
        }

        const accelerationSpeed = Math.min(acceleration * wishSpeed * deltaTime, addSpeed);

        this.velocity.addInPlace(direction.scale(accelerationSpeed));
    }

    private applyFriction(deltaTime: number): void {
        const speed = Math.hypot(this.velocity.x, this.velocity.z);

        if (speed < 0.05) {
            this.velocity.x = 0;
            this.velocity.z = 0;
            return;
        }

        const control = Math.max(speed, this.stopSpeed);
        const drop = control * this.friction * deltaTime;
        const newSpeed = Math.max(speed - drop, 0);

        if (newSpeed < 0.05) {
            this.velocity.x = 0;
            this.velocity.z = 0;
            return;
        }

        const scale = newSpeed / speed;
        this.velocity.x *= scale;
        this.velocity.z *= scale;
    }

    private startLandingEffect(fallSpeed: number): void {
        const impact = Math.min(Math.max((-fallSpeed - 4) * 0.012, 0), 0.12);

        this.landingOffset -= impact;
        this.landingVelocity = 0;
    }

    private applyViewEffects(deltaTime: number): void {
        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);

        const targetBobAmount =
            this.grounded && horizontalSpeed > 0.25
                ? Math.min(horizontalSpeed / this.groundSpeed, 1)
                : 0;

        this.bobAmount += (targetBobAmount - this.bobAmount) * (1 - Math.exp(-10 * deltaTime));

        if (this.grounded && horizontalSpeed > 0.1) {
            const cadence = 0.35 + horizontalSpeed / this.groundSpeed;

            this.bobPhase += deltaTime * this.bobFrequency * cadence * Math.PI * 2;
        }

        const verticalBob = Math.sin(this.bobPhase) * this.bobAmplitude * this.bobAmount;

        const sideBob = Math.cos(this.bobPhase * 0.5) * this.bobSideAmplitude * this.bobAmount;

        // Critically damped landing spring.
        const landingSpring = 85;
        const landingDamping = 18;

        this.landingVelocity +=
            (-landingSpring * this.landingOffset - landingDamping * this.landingVelocity) *
            deltaTime;

        this.landingOffset += this.landingVelocity * deltaTime;

        if (Math.abs(this.landingOffset) < 0.0001 && Math.abs(this.landingVelocity) < 0.0001) {
            this.landingOffset = 0;
            this.landingVelocity = 0;
        }

        const yaw = this.camera.rotation.y;
        const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

        this.camera.position.copyFrom(this.playerPosition);
        this.camera.position.addInPlace(right.scale(sideBob));
        this.camera.position.y += verticalBob + this.landingOffset;

        const sideSpeed = Vector3.Dot(this.velocity, right);

        const targetTilt = -Math.max(-1, Math.min(sideSpeed / this.groundSpeed, 1)) * this.tiltMax;

        this.tiltAngle +=
            (targetTilt - this.tiltAngle) * (1 - Math.exp(-this.tiltSpeed * deltaTime));

        this.camera.rotation.z = this.tiltAngle;
    }

    destroy(): void {
        this.keys.clear();

        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onWindowBlur);
        window.removeEventListener("resize", this.onResize);

        document.removeEventListener("pointerlockchange", this.onPointerLockChange);

        this.canvas.removeEventListener("click", this.onCanvasClick);

        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        }

        this.camera.detachControl();
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
        this.canvas.remove();
    }
}

const gameContainer = document.getElementById("game");

if (!gameContainer) {
    throw new Error('Missing element with id "game".');
}

const game = new Game(gameContainer);
game.start();

const App: FC<{ game: Game }> = ({ game }) => {
    return <>hello world</>;
};

const uiContainer = document.getElementById("ui");

if (!uiContainer) {
    throw new Error('Missing element with id "ui".');
}

createRoot(uiContainer).render(<App game={game} />);
