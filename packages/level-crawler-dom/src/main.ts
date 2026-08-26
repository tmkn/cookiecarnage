import { resolveRooms } from "./room-node.js";
import type { Serializable } from "./serializable.js";

export function collect(): Serializable {
    const rootNode: HTMLElement = document.body;

    const rooms = resolveRooms(rootNode);

    // @ts-ignore
    return rooms;
}
