import {
    createRoom,
    directions,
    type ILevelResponseRoom,
    type IQueue,
    type IRoom,
    type Vec2D
} from "./level.js";
import { findPath } from "./pathfinding.js";
import { createRNG } from "./rng.js";

export interface ITile {
    roomId: number;
}

export class LevelGenerator {
    private readonly _size = 2 * 2048;
    private readonly _offset = Math.floor(this._size / 2);

    private _rng: ReturnType<typeof createRNG>;
    private _roomLookup: Record<number, { connected: number[]; room: IRoom }> = {};

    private _tiles: (ITile | undefined)[][];

    constructor(
        private _url: string,
        private _level: ILevelResponseRoom
    ) {
        this._tiles = Array.from<unknown, Array<ITile | undefined>>({ length: this._size }, () =>
            Array<ITile | undefined>(this._size).fill(undefined)
        );
        this._rng = createRNG(this._url);
    }

    get offset(): number {
        return this._offset;
    }

    placeRoom(room: IRoom, roomId: number): void {
        const startX = room.x + this._offset;
        const startY = room.y + this._offset;

        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                const tileX = startX + x;
                const tileY = startY + y;

                if (this._isWithinBounds(tileX) && this._isWithinBounds(tileY)) {
                    const foo = this._tiles[tileY]![tileX];
                    this._tiles[tileY]![tileX] = { roomId: roomId };
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

    generateFloorLayout(): IRoom[] {
        let roomId = 0;
        const rooms: IRoom[] = [];
        // const rng = createRNG(url);
        // const tileTracker = new TileTracker(size);

        const rootRom = createRoom({ x: 0, y: 0 }, this._level);
        this._roomLookup[roomId++] = { connected: [], room: rootRom };
        this.placeRoom(rootRom, 0);
        rooms.push(rootRom);

        const queue: IQueue[] = [{ room: this._level, parentId: 0 }];

        while (queue.length > 0) {
            let { room, parent, parentId } = queue.shift()!;

            for (const connectedRoom of room.rooms) {
                let couldPlaceRoom = false;
                const randomDirection = [...directions].sort(() => this._rng.nextInRange(-1, 1));

                for (const dir of randomDirection) {
                    const offset = this._rng.nextInRange(10, 30);
                    let x = (parent?.x ?? 0) + dir.x * offset;
                    let y = (parent?.y ?? 0) + dir.y * offset;

                    const possibleRoom = createRoom({ x, y }, connectedRoom);

                    if (!this.canPlaceRoom(possibleRoom)) {
                        continue;
                    } else {
                        this._roomLookup[roomId++] = { connected: [], room: possibleRoom };
                        this._roomLookup[parentId!]!.connected.push(roomId - 1);

                        this.placeRoom(possibleRoom, roomId - 1);

                        queue.push({
                            room: connectedRoom,
                            parent: possibleRoom,
                            parentId: roomId - 1
                        });
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
        console.log(this._roomLookup);

        const bb = this.getBB();
        console.log(`Bounding box: ${JSON.stringify(bb, null, 4)}`);

        return rooms;
    }

    private _getCenter(room: IRoom): Vec2D {
        return {
            x: room.x + Math.floor(room.width / 2) + this._offset,
            y: room.y + Math.floor(room.height / 2) + this._offset
        };
    }

    generateHallways(): Vec2D[][] {
        const paths: Vec2D[][] = [];

        for (const [roomIdStr, roomLookup] of Object.entries(this._roomLookup)) {
            const roomId = parseInt(roomIdStr);

            // should never happen
            if (Number.isNaN(roomId)) {
                throw new Error(`Invalid roomId: ${roomIdStr}`);
            }

            const { room, connected } = roomLookup;

            for (const connectedRoomId of connected) {
                const path = findPath(
                    this._tiles,
                    this._getCenter(room),
                    this._getCenter(this._roomLookup[connectedRoomId]!.room),
                    [roomId, connectedRoomId]
                );
                // console.log(
                //     `Path between ${room.tag} and ${this._roomLookup[connectedRoomId]!.room.tag}:`,
                //     path
                // );

                if (path) {
                    paths.push(path);
                }
            }
        }

        return paths;
    }
}
