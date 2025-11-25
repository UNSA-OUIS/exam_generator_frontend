export interface Block {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
  level_id?: number;
}

export interface MatrixRequirement {
  id?: number;
  matrix_id: string; // UUID
  area: 'BIOMEDICAS' | 'SOCIALES' | 'INGENIERIAS' | 'UNICA' | string;
  block_id?: number;
   n_questions: number;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  block?: Block;
  matrix?: any;
  parent?: MatrixRequirement;
  children?: MatrixRequirement[];
}