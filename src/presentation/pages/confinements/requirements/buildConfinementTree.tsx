import type { ConfinementRequirement } from "./types";
import type { NodeData } from "./d3-tree/types";

export default function buildConfinementTree(requirements: ConfinementRequirement[]): NodeData | null {
    if (!requirements || requirements.length === 0) return null;

    // Step 1: Build dictionary of NodeData
    const nodes: Record<number, NodeData> = {};
    for (const r of requirements) {
        if (typeof r.id !== "number") continue;

        nodes[r.id] = {
            id: r.id,
            block: r.block ?? null,
            n_questions: r.n_questions,
            condition: "INCOMPLETE", // backend will overwrite later
            difficulty: (r.difficulty as NodeData["difficulty"]) ?? null,
            children: [],
            parent_id: r.parent_id ?? null,
        };
    }

    // Step 2: Connect parent-child relationships
    let rootNode: NodeData | null = null;

    for (const r of requirements) {
        if (typeof r.id !== "number") continue;

        const node = nodes[r.id];
        const parentId = r.parent_id;

        if (parentId && nodes[parentId]) {
            nodes[parentId].children.push(node);
        } else {
            rootNode = node;
        }
    }

    if (!rootNode) return null;

    // Step 3: Compute total required questions (sum of children only) per node
    const computeTotals = (node: NodeData): number => {
        if (node.children.length === 0) {
            node.condition = "COMPLETE";
            return node.n_questions;
        }

        const sum = node.children.reduce((acc, child) => acc + computeTotals(child), 0);
        node.total_questions_required = sum;
        if (node.n_questions < node.total_questions_required) {
            node.condition = "INVALID";
        } else if (node.n_questions === node.total_questions_required) {
            node.condition = "COMPLETE";
        } else {
            node.condition = "INCOMPLETE";
        }
        return sum;
    };

    computeTotals(rootNode);

    return rootNode;
}
