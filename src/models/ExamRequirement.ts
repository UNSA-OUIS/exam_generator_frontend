export interface Block {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
  level_id?: number;
}

export interface ExamRequirement {
  id?: number;
  exam_id: string; // UUID
  area: 'BIOMEDICAS' | 'SOCIALES' | 'INGENIERIAS' | 'UNICA' | string;
  block_id?: number;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | string;
  n_questions: number;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  block?: Block;
  exam?: any;
  parent?: ExamRequirement;
  children?: ExamRequirement[];
}