export interface INode {
    tagName: string;
    color: string;
    backgroundColor: string;
    children: INode[];
}

export function createNode(el: Element): INode {
    const computedStyle = getComputedStyle(el);

    return {
        tagName: el.tagName,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        children: []
    };
}
