export interface IRoom {
    tag: string;
    rooms: IRoom[];
    roomWidth: number;
    roomHeight: number;
    backgroundColor: string;
}

export class Room implements IRoom {
    tag: string = "n/a";
    rooms: IRoom[] = [];
    roomWidth: number = 0;
    roomHeight: number = 0;
    backgroundColor: string = "fuchsia";

    constructor(roomResolver: IRoomResolver) {
        this.roomWidth = roomResolver.roomWidth;
        this.roomHeight = roomResolver.roomHeight;
        this.tag = roomResolver.tag;
        this.backgroundColor = roomResolver.backgroundColor;
    }
}

interface IRoomResolver {
    get connectedRooms(): HTMLElement[];
    get roomWidth(): number;
    get roomHeight(): number;
    get tag(): string;
    get backgroundColor(): string;
}

export class RoomResolver implements IRoomResolver {
    private _connectedRooms: HTMLElement[] = [];
    get connectedRooms(): HTMLElement[] {
        return this._connectedRooms;
    }

    private _roomHeight: number = 0;
    get roomHeight(): number {
        return this._roomHeight;
    }

    private _roomWidth: number = 0;
    get roomWidth(): number {
        return this._roomWidth;
    }

    get tag(): string {
        return this._htmlElement.tagName.toLowerCase();
    }

    private _invalidRoomTags: string[] = [
        "span",
        "img",
        "input",
        "button",
        "a",
        "svg",
        "link",
        "script",
        "style",
        "textarea"
    ];

    get backgroundColor(): string {
        return getComputedStyle(this._htmlElement).backgroundColor;
    }

    constructor(private _htmlElement: HTMLElement) {
        this._parse();
    }

    private _parse(): void {
        // parse rooms
        this._htmlElement.childNodes.forEach((child: ChildNode) => {
            if (child instanceof HTMLElement) {
                if (!this._invalidRoomTags.includes(child.tagName.toLowerCase()))
                    this._connectedRooms.push(child);
            }
        });

        this._roomHeight = Math.max(2, this._htmlElement.children.length);
        this._roomWidth = Math.max(2, this._htmlElement.classList.length);
    }
}

type RoomQueue = Array<{ htmlElement: HTMLElement; room: IRoom }>;

export function resolveRooms(rootElement: HTMLElement): IRoom {
    const roomResolver = new RoomResolver(rootElement);
    const rootRoomNode = new Room(roomResolver);
    const roomQueue: RoomQueue = [{ htmlElement: rootElement, room: rootRoomNode }];

    while (roomQueue.length > 0) {
        const { htmlElement, room } = roomQueue.shift()!;
        const roomResolver = new RoomResolver(htmlElement);

        for (const child of roomResolver.connectedRooms) {
            if (child instanceof HTMLElement) {
                const roomResolver = new RoomResolver(child);
                const connectedRoom = new Room(roomResolver);

                room.rooms.push(connectedRoom);

                roomQueue.push({ htmlElement: child, room: connectedRoom });
            }
        }
    }

    return rootRoomNode;
}
