import type { MatrixDetail } from "./MatrixDetail";

export interface Matrix {
  id: number;
  year: string;
  total_alternatives: number;
  modality_id: number;
  created_at: string;
  updated_at: string;
  modality?: Modality;
  details?: MatrixDetail[];
}

export interface Modality {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}