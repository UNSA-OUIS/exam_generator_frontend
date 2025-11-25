import Tree from "./OldTree";
//import treeDataRaw from "./tree.json";
import type { NodeData } from "./OldTree";

//const treeData = treeDataRaw as NodeData;

interface ConfinementRequirement {
    id: number;
    confinement_id: string;
    block_id: number | null;
    difficulty: "EASY" | "NORMAL" | "HARD" | null;
    n_questions: number;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    block: Block | null;
}

export interface Block {
    id: number;
    level_id: number;
    code: string;
    name: string;
    has_text: boolean;
    parent_block_id: number | null;
    created_at: string;
    updated_at: string;
}

const backendData: ConfinementRequirement[] = [
    {
        id: 2,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 1,
        difficulty: null,
        n_questions: 20,
        parent_id: 1,
        created_at: "2025-10-16T13:28:40.000000Z",
        updated_at: "2025-10-16T13:28:40.000000Z",
        block: {
            id: 1,
            level_id: 1,
            code: "01",
            name: "APTITUD ACADEMICA",
            has_text: false,
            parent_block_id: null,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 3,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 4,
        difficulty: null,
        n_questions: 20,
        parent_id: 1,
        created_at: "2025-10-16T13:28:45.000000Z",
        updated_at: "2025-10-16T13:28:45.000000Z",
        block: {
            id: 4,
            level_id: 1,
            code: "02",
            name: "MATEMATICA",
            has_text: false,
            parent_block_id: null,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 4,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 7,
        difficulty: null,
        n_questions: 40,
        parent_id: 1,
        created_at: "2025-10-16T13:28:50.000000Z",
        updated_at: "2025-10-16T13:28:50.000000Z",
        block: {
            id: 7,
            level_id: 1,
            code: "03",
            name: "IDIOMA EXTRANJERO",
            has_text: false,
            parent_block_id: null,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 15,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 1,
        difficulty: "HARD",
        n_questions: 5,
        parent_id: 2,
        created_at: "2025-10-16T15:29:32.000000Z",
        updated_at: "2025-10-16T15:29:32.000000Z",
        block: {
            id: 1,
            level_id: 1,
            code: "01",
            name: "APTITUD ACADEMICA",
            has_text: false,
            parent_block_id: null,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 12,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 1,
        difficulty: "EASY",
        n_questions: 5,
        parent_id: 2,
        created_at: "2025-10-16T15:27:33.000000Z",
        updated_at: "2025-10-16T15:27:33.000000Z",
        block: {
            id: 1,
            level_id: 1,
            code: "01",
            name: "APTITUD ACADEMICA",
            has_text: false,
            parent_block_id: null,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 14,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 1,
        difficulty: "NORMAL",
        n_questions: 10,
        parent_id: 2,
        created_at: "2025-10-16T15:27:48.000000Z",
        updated_at: "2025-10-16T15:27:48.000000Z",
        block: {
            id: 1,
            level_id: 1,
            code: "01",
            name: "APTITUD ACADEMICA",
            has_text: false,
            parent_block_id: null,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 17,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 6,
        difficulty: null,
        n_questions: 10,
        parent_id: 3,
        created_at: "2025-10-16T15:30:44.000000Z",
        updated_at: "2025-10-16T15:30:44.000000Z",
        block: {
            id: 6,
            level_id: 2,
            code: "0202",
            name: "TRIGONOMETRIA",
            has_text: false,
            parent_block_id: 4,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 16,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: 5,
        difficulty: null,
        n_questions: 10,
        parent_id: 3,
        created_at: "2025-10-16T15:30:21.000000Z",
        updated_at: "2025-10-16T15:30:21.000000Z",
        block: {
            id: 5,
            level_id: 2,
            code: "0201",
            name: "GEOMETRIA",
            has_text: false,
            parent_block_id: 4,
            created_at: "2025-10-16T03:25:51.000000Z",
            updated_at: "2025-10-16T03:25:51.000000Z",
        },
    },
    {
        id: 1,
        confinement_id: "0199ed34-59f3-72ba-86d4-4729204a2012",
        block_id: null,
        difficulty: null,
        n_questions: 80,
        parent_id: null,
        created_at: "2025-10-16T13:27:35.000000Z",
        updated_at: "2025-10-16T13:27:35.000000Z",
        block: null,
    },
];
export function buildConfinementTree(requirements: ConfinementRequirement[]): NodeData | NodeData[] {
    const map: Record<number, NodeData> = {};

    requirements.forEach((req) => {
        map[req.id] = {
            id: req.id,
            block: req.block ?? null, // keep full block
            n_questions: req.n_questions,
            difficulty: req.difficulty,
            condition: "INCOMPLETE",
            children: [],
        };
    });

    const roots: NodeData[] = [];

    requirements.forEach((req) => {
        if (req.parent_id) {
            const parent = map[req.parent_id];
            if (parent) parent.children.push(map[req.id]);
        } else {
            roots.push(map[req.id]);
        }
    });

    return roots.length === 1 ? roots[0] : roots;
}
export default function TreePage() {
    const onNodeClick = (id: number) => {
        alert(`Node clicked: ${id}`);
    };

    const treeData = buildConfinementTree(backendData) as NodeData;

    return (
        <div style={{ height: "200vh", background: "#f9fafb" }}>
            <Tree data={treeData} onNodeClick={onNodeClick} />
        </div>
    );
}
