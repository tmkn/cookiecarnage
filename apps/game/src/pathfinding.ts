import type { Vec2D } from "./level.js"; // Adjust path if needed
import type { ITile } from "./tiles.js"; // Adjust path if needed

// --- Updated AStarNode Interface ---
interface AStarNode {
    pos: Vec2D; // Position on the grid
    gCost: number; // Cost from start to this node (potentially penalized)
    hCost: number; // Heuristic cost (estimated) from this node to end
    fCost: number; // Total cost (gCost + hCost)
    parent: AStarNode | null; // Node we came from to reach this one

    // --- New properties for line breaking ---
    /** Direction vector from parent to this node. Null for start node. */
    directionFromParent: Vec2D | null;
    /** Length of the straight line segment ending at this node. */
    straightLineLen: number;
}

// --- Helper Functions (heuristic, isInBounds, posToKey, reconstructPath) remain the same ---
// ... (keep your existing helper functions) ...
function heuristic(a: Vec2D, b: Vec2D): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function isInBounds(pos: Vec2D, rows: number, cols: number): boolean {
    return pos.y >= 0 && pos.y < rows && pos.x >= 0 && pos.x < cols;
}
function posToKey(pos: Vec2D): string {
    return `${pos.x},${pos.y}`;
}
function reconstructPath(endNode: AStarNode): Vec2D[] {
    const path: Vec2D[] = [];
    let currentNode: AStarNode | null = endNode;
    while (currentNode !== null) {
        path.push(currentNode.pos);
        currentNode = currentNode.parent;
    }
    return path.reverse();
}

// --- isWalkable (using your version with ignoreRooms) ---
function isWalkable(pos: Vec2D, grid: (ITile | undefined)[][], ignoreRooms: number[]): boolean {
    // Added boundary check here for safety, although it's also checked before calling
    if (!grid[pos.y]) return false;
    const tile = grid[pos.y]![pos.x]; // Assuming pos.y is valid due to prior checks or this safety check

    // Check if tile is undefined OR if its roomId is in the ignoreRooms list
    return tile === undefined || (tile && ignoreRooms.includes(tile.roomId));
}

// --- A* Implementation (Updated findPath) ---

/**
 * Finds a path between start and end coordinates using A*, allowing specific rooms
 * to be treated as walkable and penalizing long straight lines.
 *
 * @param grid The 2D grid of ITile or undefined.
 * @param start The starting coordinate.
 * @param end The ending coordinate.
 * @param ignoreRooms An array of room IDs whose tiles should be considered walkable.
 * @param maxStraightLength The maximum number of steps allowed in a straight line before incurring a penalty. Must be >= 1. Defaults to 5.
 * @param straightLinePenalty The additional cost added to gCost for each step exceeding maxStraightLength in a line. Must be > 0. Defaults to 0.5.
 * @returns An array of Vec2D coordinates representing the path, or null if no path exists.
 */
export function findPath(
    grid: (ITile | undefined)[][],
    start: Vec2D,
    end: Vec2D,
    ignoreRooms: number[],
    maxStraightLength: number = 5, // Added parameter with default
    straightLinePenalty: number = 0.5 // Added parameter with default
): Vec2D[] | null {
    const rows = grid.length;
    if (rows === 0) return null;
    const cols = grid[0]?.length ?? 0;
    if (cols === 0) return null;

    // --- Input Validation (for new parameters) ---
    if (maxStraightLength < 1) {
        console.warn(`findPath: maxStraightLength (${maxStraightLength}) must be >= 1. Using 1.`);
        maxStraightLength = 1;
    }
    if (straightLinePenalty <= 0) {
        console.warn(
            `findPath: straightLinePenalty (${straightLinePenalty}) should be > 0 for effect. Using 0.1.`
        );
        straightLinePenalty = 0.1;
    }

    // --- Basic Validations (using your isWalkable) ---
    if (!isInBounds(start, rows, cols) || !isInBounds(end, rows, cols)) {
        console.error("Start or end position out of bounds.");
        return null;
    }
    // Use the isWalkable function that includes ignoreRooms check
    if (!isWalkable(start, grid, ignoreRooms) || !isWalkable(end, grid, ignoreRooms)) {
        console.error("Start or end position is blocked (considering ignoreRooms).");
        return null;
    }

    // --- A* Initialization (with new node fields) ---
    const startNode: AStarNode = {
        pos: start,
        gCost: 0,
        hCost: heuristic(start, end),
        fCost: heuristic(start, end),
        parent: null,
        directionFromParent: null, // Initialize new fields
        straightLineLen: 0 // Initialize new fields
    };

    const openSet: AStarNode[] = [startNode];
    const closedSet = new Set<string>();

    const movements: Vec2D[] = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
    ];

    // --- A* Main Loop ---
    while (openSet.length > 0) {
        openSet.sort((a, b) => a.fCost - b.fCost);
        const currentNode = openSet.shift()!;

        if (currentNode.pos.x === end.x && currentNode.pos.y === end.y) {
            return reconstructPath(currentNode); // Path found!
        }

        closedSet.add(posToKey(currentNode.pos));

        // --- Explore Neighbors ---
        for (const move of movements) {
            const neighborPos: Vec2D = {
                x: currentNode.pos.x + move.x,
                y: currentNode.pos.y + move.y
            };
            const neighborKey = posToKey(neighborPos);

            // Basic Checks (using isWalkable with ignoreRooms)
            if (!isInBounds(neighborPos, rows, cols)) continue;
            if (!isWalkable(neighborPos, grid, ignoreRooms)) continue; // Use updated isWalkable
            if (closedSet.has(neighborKey)) continue;

            // --- Calculate Cost with Line Penalty ---
            let newStraightLineLen = 1;
            let stepCost = 1; // Base cost for one step

            if (currentNode.directionFromParent) {
                if (
                    move.x === currentNode.directionFromParent.x &&
                    move.y === currentNode.directionFromParent.y
                ) {
                    newStraightLineLen = currentNode.straightLineLen + 1;
                }
            }

            if (newStraightLineLen > maxStraightLength) {
                stepCost += straightLinePenalty;
            }

            const tentativeGCost = currentNode.gCost + stepCost;

            // --- Check/Update Neighbor in Open Set ---
            let neighborNode = openSet.find(
                node => node.pos.x === neighborPos.x && node.pos.y === neighborPos.y
            );

            if (neighborNode) {
                // If existing node found via a cheaper path (considering penalty)
                if (tentativeGCost < neighborNode.gCost) {
                    neighborNode.gCost = tentativeGCost;
                    // hCost remains the same for the position
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                    neighborNode.parent = currentNode;
                    neighborNode.directionFromParent = move; // Update direction
                    neighborNode.straightLineLen = newStraightLineLen; // Update straight length
                }
            } else {
                // Neighbor not in openSet, create and add it
                const hCost = heuristic(neighborPos, end);
                neighborNode = {
                    pos: neighborPos,
                    gCost: tentativeGCost,
                    hCost: hCost,
                    fCost: tentativeGCost + hCost,
                    parent: currentNode,
                    directionFromParent: move, // Store direction
                    straightLineLen: newStraightLineLen // Store straight length
                };
                openSet.push(neighborNode);
            }
        }
    }

    // --- No Path Found ---
    console.log("No path found.");
    return null;
}
