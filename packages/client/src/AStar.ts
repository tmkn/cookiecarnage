type Grid = number[][]; // 0 = empty, 1 = obstacle
export type Point = { x: number; y: number };
type AStarNode = Point & { g: number; h: number; f: number; parent: AStarNode | null };

function euclideanDistance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
}

export function aStar(grid: Grid, start: Point, end: Point): Point[] | null {
    const openSet: AStarNode[] = [
        { ...start, g: 0, h: euclideanDistance(start, end), f: 0, parent: null }
    ];
    const closedSet: Set<string> = new Set();
    const nodes: Map<string, AStarNode> = new Map([[`${start.x},${start.y}`, openSet[0]]]);

    while (openSet.length > 0) {
        const current = openSet.shift()!;
        if (current.x === end.x && current.y === end.y) {
            const path: Point[] = [];
            let node: AStarNode | null = current;
            while (node) {
                path.push({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path.reverse();
        }
        closedSet.add(`${current.x},${current.y}`);
        const neighbors: Point[] = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ].filter(
            neighbor =>
                neighbor.x >= 0 &&
                neighbor.x < grid.length &&
                neighbor.y >= 0 &&
                neighbor.y < grid[0].length &&
                grid[neighbor.x][neighbor.y] !== 1 &&
                !closedSet.has(`${neighbor.x},${neighbor.y}`)
        );
        neighbors.forEach(neighbor => {
            const g = current.g + 1;
            const h = euclideanDistance(neighbor, end);
            const f = g + h;
            const key = `${neighbor.x},${neighbor.y}`;
            const existingNode = nodes.get(key);
            if (existingNode && f >= existingNode.f) {
                return;
            }
            const newNode: AStarNode = { ...neighbor, g, h, f, parent: current };
            nodes.set(key, newNode);
            const i = openSet.findIndex(node => node.f >= f);
            if (i === -1) {
                openSet.push(newNode);
            } else {
                openSet.splice(i, 0, newNode);
            }
        });
    }

    return null;
}

export class Pathfinder {
    private grid: Grid;

    private constructor(grid: Grid) {
        this.grid = grid;
    }

    public findPath(start: Point, end: Point): Point[] | null {
        return aStar(this.grid, start, end);
    }

    public getGrid(): Grid {
        return this.grid;
    }

    public printPath(path: Point[] | null): void {
        if (!path) {
            console.log("No path found");
            return;
        }

        const gridCopy = this.grid.map(row => [...row]);

        path.forEach(point => {
            gridCopy[point.x][point.y] = 2;
        });

        console.table(gridCopy);
    }

    static CREATE_GRID(width: number, height: number, obstacles: Point[] = []): Pathfinder {
        const grid: Grid = [];

        for (let y = 0; y < height; y++) {
            grid[y] = new Array(width).fill(0);
        }

        obstacles.forEach(obstacle => {
            grid[obstacle.y][obstacle.x] = 1;
        });

        return new Pathfinder(grid);
    }
}
