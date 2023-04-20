import { useRef, useEffect, useState } from "react";
import * as BABYLON from "babylonjs";

import type { INode } from "miner";
import { IMineData } from "miner/dist/src/level-miner-entry";

export const Engine: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [data, setData] = useState<IMineData | null>(null);

    useEffect(() => {
        console.log(`Hello from Engine.tsx! | ${canvasRef.current}`);

        if (canvasRef.current) {
            console.log("Creating engine...");

            const canvas = canvasRef.current;

            canvas.width = document.documentElement.clientWidth;
            canvas.height = document.documentElement.clientHeight;

            // Load the 3D engine
            var engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });
            // CreateScene function that creates and return the scene
            var createScene = function () {
                // Create a basic BJS Scene object
                var scene = new BABYLON.Scene(engine);

                const framesPerSecond = 60;
                const gravity = -9.81;
                scene.gravity = new BABYLON.Vector3(0, gravity / framesPerSecond, 0);
                scene.collisionsEnabled = true;

                scene.onPointerDown = evt => {
                    if (evt.button === 0) engine.enterPointerlock();
                    if (evt.button === 1) engine.exitPointerlock();
                };

                // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
                var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, 0), scene);
                // Target the camera to scene origin
                camera.setTarget(BABYLON.Vector3.Zero());
                // Attach the camera to the canvas
                camera.attachControl(canvas, false);
                camera.applyGravity = true;
                camera.checkCollisions = true;
                camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
                camera.minZ = 0.45;
                camera.speed = 0.5;
                camera.angularSensibility = 3000;
                camera.inertia = 0.5;

                // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
                var light = new BABYLON.HemisphericLight(
                    "light1",
                    new BABYLON.Vector3(0, 1, 0),
                    scene
                );
                // Create a built-in "sphere" shape using the SphereBuilder
                // var sphere = BABYLON.MeshBuilder.CreateSphere(
                //     "sphere1",
                //     { segments: 16, diameter: 2, sideOrientation: BABYLON.Mesh.FRONTSIDE },
                //     scene
                // );
                // // Move the sphere upward 1/2 of its height
                // sphere.position.y = 1;
                // sphere.checkCollisions = true;

                // Create a built-in "ground" shape;
                // var ground = BABYLON.MeshBuilder.CreateGround(
                //     "ground1",
                //     { width: 60, height: 60, subdivisions: 2, updatable: false },
                //     scene
                // );
                // ground.checkCollisions = true;

                // Return the created scene
                return scene;
            };
            // call the createScene function
            var scene = createScene();
            // run the render loop
            engine.runRenderLoop(function () {
                scene.render();
            });

            const resize = () => {
                engine.resize();
            };
            // the canvas/window resize event handler
            window.addEventListener("resize", resize);

            if (data?.root)
                traverse(data!.root, (node, depth, i) => {
                    const scale = 5;
                    const box = BABYLON.MeshBuilder.CreateGround(`box-${depth}-${i}`, {
                        width: scale,
                        height: scale
                    });
                    box.position = new BABYLON.Vector3(depth * scale, 0, i * scale);
                    box.checkCollisions = true;
                    const material = new BABYLON.StandardMaterial(`box-mat-${depth}-${i}`, scene);
                    material.diffuseColor = new BABYLON.Color3(
                        between(0, 255) / 255,
                        between(0, 255) / 255,
                        between(0, 255) / 255
                    );
                    box.material = material;

                    // const myDynamicTexture = new BABYLON.DynamicTexture(
                    //     `texture-${depth}-${i}`,
                    //     { with: 512, height: 512 },
                    //     scene
                    // );

                    // const dynamicTextureContext = myDynamicTexture.getContext();

                    // material.diffuseTexture = myDynamicTexture;

                    // myDynamicTexture.drawText(
                    //     node.tagName,
                    //     10,
                    //     10,
                    //     "bold 36px Arial",
                    //     "green",
                    //     "white",
                    //     true,
                    //     true
                    // );

                    console.log(node.tagName, depth, i);
                });

            return () => {
                scene.dispose();
                window.removeEventListener("resize", resize);
            };
        }
    }, [canvasRef, data]);

    useEffect(() => {
        (async () => {
            const response = await fetch("/data");
            const data = (await response.json()) as IMineData;

            setData(data);
            console.log(data);
            // traverse(data.root);
        })();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="canvas"
            width={document.documentElement.clientWidth}
            height={document.documentElement.clientHeight}
        ></canvas>
    );
};

function between(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

const traverse = (node: INode, callback: (node: INode, depth: number, i: number) => void) => {
    let queue: [INode, number][] = [[node, 0]];

    callback(node, 0, 0);

    while (queue.length > 0) {
        const [node, depth] = queue.shift()!;

        // console.log(depth, node.tagName);
        node.children.forEach((child, i) => callback(child, depth + 1, i));

        const children: [INode, number][] = node.children.map(child => [child, depth + 1]);
        queue.push(...children);
    }
};
