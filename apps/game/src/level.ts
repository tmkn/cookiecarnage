import { Graphics, Container } from "pixi.js";

import { Theme } from "./theme.js";

export interface ILevelResponseRoom {
    tag: string;
    roomWidth: number;
    roomHeight: number;
    backgroundColor: string;
    rooms: ILevelResponseRoom[];
}

export interface ILevelResponse {
    url: string;
    level: ILevelResponseRoom;
}

export interface IRoom {
    x: number;
    y: number;
    width: number;
    height: number;
    tag: string;
}

export function createRoom(pos: Vec2D, room: ILevelResponseRoom): IRoom {
    return {
        x: pos.x,
        y: pos.y,
        width: room.roomWidth,
        height: room.roomHeight,
        tag: room.tag
    };
}

export type Vec2D = { x: number; y: number };

export const directions: Vec2D[] = [
    // up
    { x: 0, y: -1 },
    // down
    { x: 0, y: 1 },
    // left
    { x: -1, y: 0 },
    // right
    { x: 1, y: 0 }
];

export interface IQueue {
    room: ILevelResponseRoom;
    parent?: IRoom;
    parentId?: number;
}

export function drawRoom(
    container: Container,
    rooms: IRoom[],
    offset: number,
    overlayContainer: Container,
    updateOverlayFn: (content: string, x: number, y: number) => void
): void {
    const scale = 8;
    // console.log(rooms);

    for (const room of rooms) {
        const x = room.x * scale;
        const y = room.y * scale;

        const width = room.width * scale;
        const height = room.height * scale;

        const obj = new Graphics()
            .rect(x, y, width, height)
            .fill(Theme.surface0)
            .stroke({ color: Theme.blue, width: Math.floor(scale / 4) });

        obj.eventMode = "static";

        obj.on("pointerover", event => {
            // Information to display - customize this string
            const roomInfo = `Room: ${room.tag} Size: ${room.width}x${room.height}`;

            // Get mouse position in global space
            const pointerPos = event.global;
            // Convert to the coordinate system of the overlay's parent (usually the stage)
            const localPos = overlayContainer.parent.toLocal(pointerPos); // More robust way

            // Update and show the overlay
            updateOverlayFn(roomInfo, localPos.x, localPos.y);

            // Optional: Add a visual highlight to the room itself
            obj.tint = 0xffff00; // Example: Tint yellow on hover
        });

        obj.on("pointerout", () => {
            // Hide the overlay
            overlayContainer.visible = false;

            // Optional: Remove visual highlight
            obj.tint = 0xffffff; // Reset tint
        });

        obj.on("pointermove", event => {
            // Update overlay position to follow the mouse while hovering over the room
            if (overlayContainer.visible) {
                const pointerPos = event.global;
                const localPos = overlayContainer.parent.toLocal(pointerPos);
                overlayContainer.position.set(localPos.x + 15, localPos.y + 15); // Keep updating position
            }
        });

        container.addChild(obj);
    }
}

export function drawHallways(container: Container, hallways: Vec2D[][]): void {
    const scale = 8;

    // const container = new Container({
    //     x: app.screen.width / 2,
    //     y: app.screen.height / 2
    // });

    // app.stage.addChild(container);

    for (const hallway of hallways) {
        const randomColor = Math.floor(Math.random() * 16777215);

        for (const hallwayTile of hallway) {
            // todo dynamically add offset
            const x = (hallwayTile.x - 2048) * scale;
            const y = (hallwayTile.y - 2048) * scale;

            const obj = new Graphics().rect(x, y, scale, scale).fill(Theme.lavender);
            // .stroke({ color: 0xff0000, width: Math.floor(scale / 4) });

            container.addChild(obj);
        }
    }
}
