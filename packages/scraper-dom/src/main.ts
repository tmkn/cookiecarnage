import type { Serializable } from "./serializable.js";
import { resolveRooms } from "./room-node.js";

export function collect(): Serializable {
    const rootNode: HTMLElement = document.body;

    const rooms = resolveRooms(rootNode);

    // @ts-ignore
    return rooms;
}
