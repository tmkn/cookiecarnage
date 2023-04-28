import React, { useEffect, useRef, useState } from "react";
import { Application, Graphics, Text, Container, utils } from "pixi.js";

import "./index.css";
import { IMineData, INode } from "miner";

export const MazeGen: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [app, setApp] = useState<Application | null>(null);
    const [data, setData] = useState<IMineData | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            setApp(
                new Application({
                    view: canvasRef.current,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    backgroundColor: 0x1099bb
                })
            );

            // (async () => {
            //     const params = new URLSearchParams({
            //         url: "https://www.google.com"
            //     });
            //     const response = await fetch(`/data?${params}`);
            //     const data = (await response.json()) as IMineData;

            //     setData(data);
            //     console.log(data);
            //     // traverse(data.root);
            // })();

            const params = new URLSearchParams({
                url: "https://www.google.com"
            });
            fetch(`/data?${params}`)
                .then(response => response.json())
                .then(data => {
                    setData(data);
                    // console.log(data);
                });
        }

        return () => {
            app?.destroy();
            setApp(null);
        };
    }, []);

    useEffect(() => {
        if (app && data) {
            traverse(data, (node, x, y) => {
                // console.log(node.tagName, depth, i);
                const container = new Container();
                // Create a new Graphics object
                const box = new Graphics();

                // Set the fill color and line style of the box
                box.beginFill(getColor(node.tagName));
                box.lineStyle(2, 0xffffff);

                // Draw a rectangle
                box.drawRect(0, 0, 50, 50);

                // End the fill and line styles
                box.endFill();
                box.scale.set(1);

                // Add the box to the stage
                // app.stage.addChild(box);

                // Create a new Text object with some text
                const text = new Text(node.tagName);

                // Customize the text object's font and size
                text.style.fontFamily = "Arial";
                text.style.fontSize = node.tagName.length < 6 ? 16 : 12;
                text.anchor.set(0.5);
                text.x = 50 / 2;
                text.y = 50 / 2;
                text.roundPixels = true;
                text.angle = -45;
                // text.style.wordWrap = true;
                // text.style.wordWrapWidth = 50;

                container.addChild(box, text);

                app.stage.addChild(container);

                container.x = x * 50;
                container.y = y * 50;
                container.scale.set(1);
            });
        }
    }, [data]);

    useEffect(() => {
        if (app) {
            // Set up the mouse events
            let dragging = false;
            let lastPosition = { x: 0, y: 0 };

            if (app.view.addEventListener) {
                app.view.addEventListener("mousedown", onMouseDown as any);
                app.view.addEventListener("mousemove", onMouseMove as any);
                app.view.addEventListener("mouseup", onMouseUp);

                function onMouseDown(event: MouseEvent) {
                    console.log(event);
                    dragging = true;
                    lastPosition = { x: event.clientX, y: event.clientY };
                }

                function onMouseMove(event: MouseEvent) {
                    if (dragging) {
                        const dx = event.clientX - lastPosition.x;
                        const dy = event.clientY - lastPosition.y;
                        app!.stage.position.x += dx;
                        app!.stage.position.y += dy;
                        lastPosition = { x: event.clientX, y: event.clientY };
                    }
                }

                function onMouseUp() {
                    dragging = false;
                }
            }

            // console.log("Creating maze...");
            // const container = new Container();
            // // Create a new Graphics object
            // const box = new Graphics();
            // // Set the fill color and line style of the box
            // box.beginFill(0xffffff);
            // box.lineStyle(2, 0xff0000);
            // // Draw a rectangle
            // box.drawRect(0, 0, 50, 50);
            // // End the fill and line styles
            // box.endFill();
            // box.scale.set(1);
            // // Add the box to the stage
            // // app.stage.addChild(box);
            // // Create a new Text object with some text
            // const text = new Text("div");
            // // Customize the text object's font and size
            // text.style.fontFamily = "Arial";
            // text.style.fontSize = 16;
            // text.anchor.set(0.5);
            // text.x = 50 / 2;
            // text.y = 50 / 2;
            // text.roundPixels = true;
            // container.addChild(box, text);
            // app.stage.addChild(container);
            // container.y = 300;
            // container.scale.set(1);
            // text.style.fontSize = 32;
            // text.updateTransform();
            // Add the text object to the stage
            // app.stage.addChild(text);
            // app.stage.x += 100;
            // app.stage.y += 100;
            // // Listen for the wheel event on the window object
            // window.addEventListener("wheel", event => {
            //     // Get the deltaY property of the wheel event to determine the direction of the zoom
            //     const delta = event.deltaY > 0 ? -0.1 : 0.1;
            //     // Adjust the scale of the application by the delta value
            //     app.stage.scale.x += delta;
            //     app.stage.scale.y += delta;
            // });
        }

        return () => {
            // app?.destroy();
        };
    }, [app]);

    return <canvas ref={canvasRef} id="canvas"></canvas>;
};

const traverse = (node: IMineData, callback: (node: INode, x: number, y: number) => void) => {
    console.log("Looping maze...");

    let depth = 0;
    const queue: INode[] = [node.root];

    while (queue.length > 0) {
        const queueLength = queue.length;

        for (let i = 0; i < queueLength; i++) {
            const node = queue.shift()!;

            callback(node, i, depth * 2);

            queue.push(...node.children);
        }

        depth++;
    }
};

const colorMap: Map<string, string> = new Map();

const getColor = (tagName: string) => {
    if (colorMap.has(tagName)) {
        return colorMap.get(tagName)!;
    }

    const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;

    colorMap.set(tagName, color);

    return color;
};
