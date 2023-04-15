export interface IMineData {
    url: string;
    topTags: Array<[tag: string, i: number]>;
}

export async function mine(): Promise<IMineData> {
    console.log(`hello from level-miner-entry`);

    const tags: Record<string, number> = {};

    const root = document.body;
    const queue: Element[] = [root];

    while (queue.length > 0) {
        const element = queue.shift()!;
        const tagName = element.tagName;
        if (tags[tagName]) {
            tags[tagName]++;
        } else {
            tags[tagName] = 1;
        }
        for (const child of element.children) {
            queue.push(child);
        }
    }

    const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]);

    // console.dir(sorted);

    return {
        url: window.location.href,
        topTags: sorted
    };
}
