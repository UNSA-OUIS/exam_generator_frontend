export interface Block {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
}

export interface ConfinementRequirement {
  id?: number;
  confinement_id: string; // Uuid
  block_id?: number;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  n_questions: number;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  block?: Block;
  confinement?: any;
  parent?: ConfinementRequirement;
  children?: ConfinementRequirement[];
}