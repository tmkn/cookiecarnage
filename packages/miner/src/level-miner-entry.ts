import { INode, createNode } from "./node";

export interface IMineData {
    url: string;
    topTags: Array<[tag: string, i: number]>;
    maxDepth: number;
    maxWidth: number;
    root: INode;
}

type QueueTuple = [Element, INode];

export async function mine(): Promise<IMineData> {
    console.log(`hello from level-miner-entry`);

    const tags: Record<string, number> = {};

    const rootEl = document.body;
    const queue: QueueTuple[] = [[rootEl, createNode(rootEl)]];
    let [[, rootNode]] = queue;

    let maxDepth = 0;
    let maxWidth = 1;

    while (queue.length > 0) {
        const [currentEl, currentNode] = queue.shift()!;
        const tagName = currentEl.tagName;

        maxDepth++;

        if (tags[tagName]) {
            tags[tagName]++;
        } else {
            tags[tagName] = 1;
        }

        for (const childEl of currentEl.children) {
            // transform the htmlelement into a node
            const childNode = createNode(childEl);

            currentNode.children.push(childNode);
            queue.push([childEl, childNode]);

            if (maxWidth < queue.length) {
                maxWidth = queue.length;
            }
        }
    }

    const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]);

    console.dir(rootNode);

    return {
        url: window.location.href,
        topTags: sorted,
        maxDepth,
        maxWidth,
        root: rootNode
    };
}
