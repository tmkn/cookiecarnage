import {
    Color3,
    DynamicTexture,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    Vector3
} from "@babylonjs/core";

export function createLighting(scene: Scene): void {
    const light = new HemisphericLight("levelLight", new Vector3(-0.35, 1, 0.2), scene);

    light.intensity = 0.95;
    light.diffuse = new Color3(0.9, 0.92, 0.88);
    light.groundColor = new Color3(0.16, 0.18, 0.19);
}

export function createGridMaterial(
    scene: Scene,
    name: string,
    background: string,
    grid: string,
    majorGrid: string
): StandardMaterial {
    const texture = new DynamicTexture(`${name}Texture`, { width: 512, height: 512 }, scene);

    const context = texture.getContext();

    context.fillStyle = background;
    context.fillRect(0, 0, 512, 512);

    for (let position = 0; position <= 512; position += 32) {
        const isMajorLine = position % 128 === 0;

        context.strokeStyle = isMajorLine ? majorGrid : grid;
        context.lineWidth = isMajorLine ? 4 : 2;

        context.beginPath();
        context.moveTo(position, 0);
        context.lineTo(position, 512);
        context.stroke();

        context.beginPath();
        context.moveTo(0, position);
        context.lineTo(512, position);
        context.stroke();
    }

    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = 4;
    texture.vScale = 4;

    const material = new StandardMaterial(name, scene);

    material.diffuseTexture = texture;
    material.diffuseColor = Color3.White();
    material.specularColor = new Color3(0.05, 0.05, 0.05);

    return material;
}

export function createSolidMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);

    material.diffuseColor = color;
    material.specularColor = new Color3(0.04, 0.04, 0.04);

    return material;
}

export function createLevelBox(
    scene: Scene,
    name: string,
    position: Vector3,
    size: Vector3,
    material: StandardMaterial,
    rotationY = 0
): Mesh {
    const box = MeshBuilder.CreateBox(
        name,
        {
            width: size.x,
            height: size.y,
            depth: size.z
        },
        scene
    );

    box.position.copyFrom(position);
    box.rotation.y = rotationY;
    box.material = material;
    box.checkCollisions = true;
    box.isPickable = true;

    return box;
}

export function createRamp(
    scene: Scene,
    name: string,
    position: Vector3,
    width: number,
    run: number,
    rise: number,
    material: StandardMaterial,
    rotationY = 0
): Mesh {
    const angle = Math.atan2(rise, run);
    const length = Math.hypot(run, rise);
    const thickness = 0.35;

    const ramp = MeshBuilder.CreateBox(
        name,
        {
            width,
            height: thickness,
            depth: length
        },
        scene
    );

    ramp.position.copyFrom(position);
    ramp.position.y += rise / 2 + thickness / (2 * Math.cos(angle));
    ramp.rotation.x = angle;
    ramp.rotation.y = rotationY;
    ramp.material = material;
    ramp.checkCollisions = true;
    ramp.isPickable = true;

    return ramp;
}

export function createLevel(scene: Scene): void {
    const floorMaterial = createGridMaterial(
        scene,
        "grayDeveloperMaterial",
        "#777b78",
        "#626663",
        "#484c49"
    );

    const orangeMaterial = createGridMaterial(
        scene,
        "orangeDeveloperMaterial",
        "#bd6a2d",
        "#995021",
        "#713718"
    );

    const paleOrangeMaterial = createGridMaterial(
        scene,
        "paleOrangeDeveloperMaterial",
        "#c58148",
        "#a86532",
        "#7e4824"
    );

    const darkMaterial = createGridMaterial(
        scene,
        "darkDeveloperMaterial",
        "#505657",
        "#3f4546",
        "#292e2f"
    );

    const concreteMaterial = createSolidMaterial(
        scene,
        "concreteMaterial",
        new Color3(0.43, 0.45, 0.43)
    );

    const metalMaterial = createSolidMaterial(scene, "metalMaterial", new Color3(0.24, 0.28, 0.29));

    const floor = MeshBuilder.CreateGround("floor", { width: 100, height: 100 }, scene);

    floor.material = floorMaterial;
    floor.checkCollisions = true;
    floor.isPickable = true;

    // Arena boundary walls.
    createLevelBox(
        scene,
        "northWall",
        new Vector3(0, 4, 49),
        new Vector3(100, 8, 2),
        concreteMaterial
    );

    createLevelBox(
        scene,
        "southWall",
        new Vector3(0, 4, -49),
        new Vector3(100, 8, 2),
        concreteMaterial
    );

    createLevelBox(
        scene,
        "eastWall",
        new Vector3(49, 4, 0),
        new Vector3(2, 8, 100),
        concreteMaterial
    );

    createLevelBox(
        scene,
        "westWall",
        new Vector3(-49, 4, 0),
        new Vector3(2, 8, 100),
        concreteMaterial
    );

    // Central combat cover.
    createLevelBox(
        scene,
        "centerCoverLeft",
        new Vector3(-4, 1.5, 9),
        new Vector3(5, 3, 5),
        orangeMaterial,
        0.12
    );

    createLevelBox(
        scene,
        "centerCoverRight",
        new Vector3(5, 1, 8),
        new Vector3(4, 2, 7),
        paleOrangeMaterial,
        -0.08
    );

    createLevelBox(
        scene,
        "centerLowCover",
        new Vector3(0, 0.5, 17),
        new Vector3(8, 1, 3),
        darkMaterial
    );

    // Left-side raised platform and its approach ramp.
    createLevelBox(
        scene,
        "westPlatform",
        new Vector3(-23, 2, 7),
        new Vector3(15, 4, 13),
        orangeMaterial
    );

    createRamp(scene, "westPlatformRamp", new Vector3(-23, 0, -2), 7, 12, 4, orangeMaterial);

    createLevelBox(
        scene,
        "westPlatformCover",
        new Vector3(-26, 5, 9),
        new Vector3(5, 2, 4),
        darkMaterial
    );

    createLevelBox(
        scene,
        "westPlatformPillar",
        new Vector3(-18.5, 6, 10),
        new Vector3(2.5, 4, 2.5),
        concreteMaterial
    );

    // Right-side platform with a perpendicular slope.
    createLevelBox(
        scene,
        "eastPlatform",
        new Vector3(24, 1.5, -10),
        new Vector3(17, 3, 12),
        paleOrangeMaterial
    );

    createRamp(
        scene,
        "eastPlatformRamp",
        new Vector3(13.5, 0, -10),
        6,
        9,
        3,
        paleOrangeMaterial,
        Math.PI / 2
    );

    createLevelBox(
        scene,
        "eastPlatformCover",
        new Vector3(26, 3.75, -11),
        new Vector3(6, 1.5, 3),
        darkMaterial
    );

    // Long shallow slope leading to an elevated shooting position.
    createLevelBox(
        scene,
        "northPlatform",
        new Vector3(9, 2.5, 32),
        new Vector3(19, 5, 10),
        orangeMaterial
    );

    createRamp(scene, "northPlatformRamp", new Vector3(9, 0, 21), 9, 16, 5, orangeMaterial);

    createLevelBox(
        scene,
        "northPlatformBarrier",
        new Vector3(9, 6, 35),
        new Vector3(12, 2, 2),
        metalMaterial
    );

    // Staggered boxes form a simple vertical route.
    createLevelBox(
        scene,
        "stepBoxOne",
        new Vector3(-11, 0.25, -18),
        new Vector3(4, 0.5, 4),
        paleOrangeMaterial
    );

    createLevelBox(
        scene,
        "stepBoxTwo",
        new Vector3(-15, 0.5, -18),
        new Vector3(4, 1, 4),
        orangeMaterial
    );

    createLevelBox(
        scene,
        "stepBoxThree",
        new Vector3(-19, 0.75, -18),
        new Vector3(4, 1.5, 4),
        darkMaterial
    );

    createLevelBox(
        scene,
        "stepBoxFour",
        new Vector3(-23, 1, -18),
        new Vector3(4, 2, 4),
        orangeMaterial
    );

    // Scattered Source-style blockout geometry.
    createLevelBox(
        scene,
        "southLargeBlock",
        new Vector3(4, 2.5, -31),
        new Vector3(12, 5, 8),
        concreteMaterial,
        0.08
    );

    createLevelBox(
        scene,
        "southOrangeBlock",
        new Vector3(-8, 1.5, -32),
        new Vector3(6, 3, 6),
        orangeMaterial,
        -0.15
    );

    createLevelBox(
        scene,
        "southLowBlock",
        new Vector3(14, 0.75, -28),
        new Vector3(8, 1.5, 4),
        paleOrangeMaterial
    );

    createLevelBox(
        scene,
        "eastTallBlock",
        new Vector3(36, 4, 12),
        new Vector3(7, 8, 7),
        concreteMaterial
    );

    createLevelBox(
        scene,
        "eastSmallBlock",
        new Vector3(29, 1, 20),
        new Vector3(5, 2, 5),
        orangeMaterial,
        0.2
    );

    createLevelBox(
        scene,
        "westTallBlock",
        new Vector3(-37, 3, -7),
        new Vector3(6, 6, 10),
        darkMaterial
    );

    createLevelBox(
        scene,
        "westLowBlock",
        new Vector3(-35, 0.75, 23),
        new Vector3(10, 1.5, 5),
        paleOrangeMaterial,
        -0.1
    );

    // Angled central ramp usable from both sides as cover.
    createRamp(scene, "centralRamp", new Vector3(13, 0, 7), 8, 11, 3.5, darkMaterial, Math.PI);

    // Thin barriers and pillars break up long sight lines.
    createLevelBox(
        scene,
        "middleBarrierOne",
        new Vector3(-12, 1.25, 2),
        new Vector3(1.5, 2.5, 10),
        metalMaterial,
        0.15
    );

    createLevelBox(
        scene,
        "middleBarrierTwo",
        new Vector3(15, 1, -3),
        new Vector3(9, 2, 1.5),
        metalMaterial,
        -0.1
    );

    createLevelBox(
        scene,
        "northPillar",
        new Vector3(-10, 4, 33),
        new Vector3(4, 8, 4),
        concreteMaterial
    );

    createLevelBox(
        scene,
        "southPillar",
        new Vector3(27, 3, -32),
        new Vector3(4, 6, 4),
        concreteMaterial
    );
}
