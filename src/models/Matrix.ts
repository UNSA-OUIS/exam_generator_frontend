import type { MatrixDetail } from "./MatrixDetail";

export interface Matrix {
  id: number;
  year: string;
  total_alternatives: number;
  process_id: number;
  created_at: string;
  updated_at: string;
  process?: Process;
  details?: MatrixDetail[];
}

export interface Process {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}