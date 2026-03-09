import type { Matrix } from "./Matrix";
import type { Level } from "./Block";
export interface MatrixDetail {
  id: number;
  matrix_id: number;
  area: 'BIOMEDICAS' | 'SOCIALES' | 'INGENIERIAS' | 'UNICA';
  block_id: number;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  questions_required: number;
  questions_to_do: number;
  created_at: string;
  updated_at: string;
  matrix?: Matrix;
  block?: Block;
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
  level?: Level;
}