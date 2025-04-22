import { Application, Graphics, Container } from "pixi.js";

import { createRNG } from "./rng.js";

interface ILevelResponseRoom {
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

interface IRoom {
    x: number;
    y: number;
    width: number;
    height: number;
    tag: string;
}

function createRoom(pos: Vec2D, room: ILevelResponseRoom): IRoom {
    return {
        x: pos.x,
        y: pos.y,
        width: room.roomWidth,
        height: room.roomHeight,
        tag: room.tag
    };
}

type Vec2D = { x: number; y: number };

const directions: Vec2D[] = [
    // up
    { x: 0, y: -1 },
    // down
    { x: 0, y: 1 },
    // left
    { x: -1, y: 0 },
    // right
    { x: 1, y: 0 }
];

interface IQueue {
    room: ILevelResponseRoom;
    parent?: IRoom;
}

export function generateFloorLayout(url: string, level: ILevelResponseRoom, size: number): IRoom[] {
    const rooms: IRoom[] = [];
    const rng = createRNG(url);
    const tileTracker = new TileTracker(size);

    const queue: IQueue[] = [{ room: level }];
    const rootRom = createRoom({ x: 0, y: 0 }, level);
    tileTracker.placeRoom(rootRom);
    rooms.push(rootRom);

    while (queue.length > 0) {
        let { room, parent } = queue.shift()!;

        for (const connectedRoom of room.rooms) {
            let couldPlaceRoom = false;
            const randomDirection = [...directions].sort(() => rng.nextInRange(-1, 1));

            for (const dir of randomDirection) {
                const offset = rng.nextInRange(10, 30);
                let x = (parent?.x ?? 0) + dir.x * offset;
                let y = (parent?.y ?? 0) + dir.y * offset;

                const possibleRoom = createRoom({ x, y }, connectedRoom);

                if (!tileTracker.canPlaceRoom(possibleRoom)) {
                    continue;
                } else {
                    tileTracker.placeRoom(possibleRoom);

                    queue.push({ room: connectedRoom, parent: possibleRoom });
                    rooms.push(possibleRoom);
                    couldPlaceRoom = true;
                    break;
                }
            }

            if (!couldPlaceRoom) {
                throw new Error(`Couldn't place room: ${connectedRoom.tag}`);
            }
        }
    }

    console.log(rooms);

    const bb = tileTracker.getBB();
    console.log(`Bounding box: ${JSON.stringify(bb, null, 4)}`);

    return rooms;
}

export function drawRoom(app: Application, rooms: IRoom[], offset: number): void {
    const scale = 8;
    console.log(rooms);

    const container = new Container({
        x: app.screen.width / 2,
        y: app.screen.height / 2
    });

    // container.x -= offset;
    // container.y -= offset;

    app.stage.addChild(container);

    for (const room of rooms) {
        const x = room.x * scale;
        const y = room.y * scale;

        const width = room.width * scale;
        const height = room.height * scale;

        const obj = new Graphics()
            .rect(x, y, width, height)
            .fill(0xffffff)
            .stroke({ color: 0x000000, width: Math.floor(scale / 4) });

        container.addChild(obj);
    }
}

class TileTracker {
    private _tiles: boolean[][];
    // allow negative values
    private _offset: number;

    constructor(private _size: number) {
        this._tiles = Array.from({ length: this._size }, () => Array(this._size).fill(false));
        this._offset = Math.floor(this._size / 2);
    }

    placeRoom(room: IRoom): void {
        const startX = room.x + this._offset;
        const startY = room.y + this._offset;

        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                const tileX = startX + x;
                const tileY = startY + y;

                if (this._isWithinBounds(tileX) && this._isWithinBounds(tileY)) {
                    this._tiles[tileY]![tileX] = true;
                }
            }
        }
    }

    // check if we can place a room at a given position
    // we can't place a room if a tile was already placed by another room
    canPlaceRoom(room: IRoom): boolean {
        const startX = room.x + this._offset;
        const startY = room.y + this._offset;

        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                const tileX = startX + x;
                const tileY = startY + y;

                if (this._tiles[tileY]![tileX]) {
                    return false;
                }
            }
        }

        return true;
    }

    getBB(): { from: Vec2D; to: Vec2D } | null {
        let minRow = Infinity;
        let minCol = Infinity;
        let maxRow = -Infinity;
        let maxCol = -Infinity;

        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                if (this._tiles[row]![col]) {
                    minRow = Math.min(minRow, row);
                    minCol = Math.min(minCol, col);
                    maxRow = Math.max(maxRow, row);
                    maxCol = Math.max(maxCol, col);
                }
            }
        }

        if (minRow === Infinity) {
            return null;
        }

        // return {
        //     from: { x: minCol, y: minRow },
        //     to: { x: maxCol, y: maxRow }
        // };

        return {
            from: { x: minCol - this._offset, y: minRow - this._offset },
            to: { x: maxCol - this._offset, y: maxRow - this._offset }
        };
    }

    // since it's a square, we only need one function
    private _isWithinBounds(xOrY: number): boolean {
        // const withinBounds = xOrY >= -this._offset && xOrY < this._offset;
        const withinBounds = xOrY >= 0 && xOrY < this._size;

        if (!withinBounds) {
            // throw new Error(
            //     `Out of bounds: ${xOrY} -> ${xOrY + this._offset} | size: ${this._size}x${this._size}`
            // );
            console.log(
                `Out of bounds: ${xOrY} -> ${xOrY + this._offset} | size: ${this._size}x${this._size} | offset ${this._offset}`
            );
        }

        return true;
    }
}
