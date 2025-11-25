import type { NodeData } from "./types";

export const countDescendantQuestions = (node: NodeData): number => {
    if (!node.children) return node.n_questions;
    return node.children.reduce((sum, child) => sum + countDescendantQuestions(child), 0);
};

export const cloneTree = (node: NodeData): NodeData => JSON.parse(JSON.stringify(node));

export const findNode = (node: NodeData, id: number): NodeData | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
    }
    return null;
};
