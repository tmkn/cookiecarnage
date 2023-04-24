export interface INode {
    tagName: string;
    color: string;
    backgroundColor: string;
    backgroundImg?: string;
    children: INode[];
}

export function createNode(el: Element): INode {
    const computedStyle = getComputedStyle(el);
    const node: INode = {
        tagName: el.tagName,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        children: []
    };

    if (el instanceof HTMLImageElement && el.src.trim() !== "") {
        // console.log(el.src);
        node.backgroundImg = el.src;
    }

    return node;
}
