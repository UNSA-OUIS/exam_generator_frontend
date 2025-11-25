import type { Block } from "../types";

export type Condition = "COMPLETE" | "INCOMPLETE" | "INVALID";

export interface NodeData {
    id: number;
    block: Block | null;
    n_questions: number;
    condition: Condition;
    difficulty: "EASY" | "NORMAL" | "HARD" | null;
    children: NodeData[];
    parent_id?: number | null;
    total_questions_required?: number;
}
