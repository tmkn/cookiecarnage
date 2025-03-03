import { Application, Text } from "pixi.js";

import levelData from "./simple-level.json" with { type: "json" };
import { drawRoom, generateFloorLayout } from "./level.js";

const app = new Application();

app.init({ backgroundColor: "HoneyDew", resizeTo: window }).then(() => {
    document.body.appendChild(app.canvas);

    const url = "https://foo.com";
    const legend = new Text({
        text: `${url} - Floor Layout`,
        style: { fontSize: 16, fontFamily: "monospace" }
    });

    legend.x = 8;
    legend.y = 8;

    app.stage.addChild(legend);

    const size = 2048 * 2;
    const offset = Math.floor(size / 2);

    const rooms = generateFloorLayout(levelData.url, levelData.level, size);
    drawRoom(app, rooms, offset);
});
