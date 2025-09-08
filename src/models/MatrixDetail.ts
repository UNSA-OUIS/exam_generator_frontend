import type { Level } from "./Level";
import type { Matrix } from "./Matrix";

export interface MatrixDetail {
  id: number;
  matrix_id: number;
  area: 'BIOMEDICAS' | 'SOCIALES' | 'INGENIERIAS' | 'TODAS';
  block_id: number;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
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
  parent_block_id: number | null;
  created_at: string;
  updated_at: string;
  level?: Level;
}