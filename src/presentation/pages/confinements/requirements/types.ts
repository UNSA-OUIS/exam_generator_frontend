export interface Block {
    id: number;
    level_id: number;
    code: string;
    name: string;
    parent_block_id: number | null;
    has_text: boolean;
    created_at: string;
    updated_at: string;
}

export interface Level {
    id: number;
    stage: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConfinementRequirement {
    id?: number;
    confinement_id: string;
    block_id?: number;
    difficulty: "EASY" | "NORMAL" | "HARD" | string;
    n_questions: number;
    parent_id?: number;
    block?: Block;
    parent?: ConfinementRequirement;
    children?: ConfinementRequirement[];
}
