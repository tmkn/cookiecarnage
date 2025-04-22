import { Application, Text, Container, TextStyle, Graphics } from "pixi.js";

import levelData from "./test.json" with { type: "json" };
import { drawHallways, drawRoom } from "./level.js";
import { LevelGenerator } from "./tiles.js";
import { Theme } from "./theme.js";

const app = new Application();

const ZOOM_FACTOR = 1.1; // How much to zoom in/out on each step
const MIN_SCALE = 0.2; // Minimum zoom level
const MAX_SCALE = 5.0; // Maximum zoom level

let isPanning = false;
let startPanPos = { x: 0, y: 0 };

app.init({ backgroundColor: Theme.base, resizeTo: window }).then(() => {
    const mapContainer = new Container({ x: app.screen.width / 2, y: app.screen.height / 2 });
    app.stage.addChild(mapContainer);
    app.stage.interactive = true;

    document.body.appendChild(app.canvas);

    const legend = new Text({
        text: `Domageddon Map Debugger - ${levelData.url}`,
        style: { fontSize: 16, fontFamily: "monospace", fill: Theme.text }
    });

    legend.x = 8;
    legend.y = 8;

    app.stage.addChild(legend);

    const levelGenerator = new LevelGenerator(levelData.url, levelData.level);
    const rooms = levelGenerator.generateFloorLayout();

    levelGenerator.generateHallways();

    const hallways = levelGenerator.generateHallways();

    drawHallways(mapContainer, hallways);
    drawRoom(mapContainer, rooms, levelGenerator.offset, overlayContainer, updateOverlay);
    app.stage.addChild(overlayContainer); // Add to stage to ensure it's on top

    app.canvas.addEventListener("wheel", event => {
        // Prevent the default scrolling behavior (page scrolling)
        event.preventDefault();

        const direction = event.deltaY < 0 ? "in" : "out";
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
        const oldScale = mapContainer.scale.x;
        let newScale: number;

        if (direction === "in") {
            newScale = oldScale * ZOOM_FACTOR;
        } else {
            newScale = oldScale / ZOOM_FACTOR;
        }

        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        if (newScale === oldScale) {
            return;
        }

        const worldPos = {
            x: (mouseX - mapContainer.x) / oldScale,
            y: (mouseY - mapContainer.y) / oldScale
        };

        mapContainer.scale.set(newScale);

        const newContainerX = mouseX - worldPos.x * newScale;
        const newContainerY = mouseY - worldPos.y * newScale;

        mapContainer.position.set(newContainerX, newContainerY);
    });

    // --- NEW: Panning Listeners ---

    // Listener for when a mouse button is pressed down
    app.canvas.addEventListener("pointerdown", event => {
        // Check if it's the middle mouse button (button index 1)
        if (event.button === 1) {
            isPanning = true;
            // Store the starting position of the pan
            startPanPos.x = event.offsetX;
            startPanPos.y = event.offsetY;
            // Optional: Change cursor to indicate panning/grabbing
            app.canvas.style.cursor = "grabbing";
            // Prevent default middle-click actions like auto-scroll
            event.preventDefault();
        }
    });

    // Listener for when the mouse moves
    app.canvas.addEventListener("pointermove", event => {
        // Only pan if the middle mouse button is currently held down
        if (isPanning) {
            // Calculate the distance moved since the last move event
            const deltaX = event.offsetX - startPanPos.x;
            const deltaY = event.offsetY - startPanPos.y;

            // Move the stage by the delta amount
            mapContainer.x += deltaX;
            mapContainer.y += deltaY;

            // Update the starting position for the *next* move event.
            // This is crucial for continuous panning.
            startPanPos.x = event.offsetX;
            startPanPos.y = event.offsetY;
        }
    });

    // Listener for when a mouse button is released
    app.canvas.addEventListener("pointerup", event => {
        // Check if it's the middle mouse button being released
        if (event.button === 1 && isPanning) {
            isPanning = false;
            // Optional: Restore default cursor
            app.canvas.style.cursor = "default";
        }
    });

    // Listener for when the mouse leaves the canvas area
    app.canvas.addEventListener("pointerleave", event => {
        // Stop panning if the mouse leaves the canvas while panning
        if (isPanning) {
            isPanning = false;
            // Optional: Restore default cursor
            app.canvas.style.cursor = "default";
        }
    });
});

// Create the container for the overlay elements
const overlayContainer = new Container();
overlayContainer.visible = false; // Start hidden

// Create the background for the overlay
const overlayBackground = new Graphics();
overlayContainer.addChild(overlayBackground);

// Create the text object for the overlay info
const overlayTextStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 12,
    fill: Theme.text, // Use text color from theme
    wordWrap: true,
    wordWrapWidth: 150 // Adjust as needed
});
const overlayText = new Text({ text: "", style: overlayTextStyle });
overlayText.position.set(5, 5); // Small padding inside the background
overlayContainer.addChild(overlayText);

function updateOverlay(content: string, x: number, y: number) {
    overlayText.text = content;

    // Adjust background size based on text bounds
    const textMetrics = overlayText.getBounds();
    // Add padding
    const padding = 5;
    const bgWidth = textMetrics.width + padding * 2;
    const bgHeight = textMetrics.height + padding * 2;

    // Redraw background
    overlayBackground.clear();

    overlayBackground.roundRect(0, 0, bgWidth, bgHeight, 4);
    overlayBackground.fill({ color: Theme.surface1, alpha: 0.9 });
    overlayBackground.setStrokeStyle({
        width: 1,
        color: Theme.overlay1
    });

    // Position the overlay container near the mouse (adjust offsets as desired)
    overlayContainer.position.set(x + 15, y + 15);
    overlayContainer.visible = true;
}
