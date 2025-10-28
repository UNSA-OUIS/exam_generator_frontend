export interface Block {
  id: number;
  level_id: number;
  code: string;
  name: string;
  parent_block_id: number | null;
  created_at: string;
  updated_at: string;
  level?: Level;
  parentBlock?: Block;
  has_text: boolean;
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
  confinement_id: string; // Uuid
  block_id?: number;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL' | string;
  n_questions: number;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  block?: Block;
  confinement?: any;
  parent?: ConfinementRequirement;
  children?: ConfinementRequirement[];
}