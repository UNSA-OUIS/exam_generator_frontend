import type { MatrixDetail } from "./MatrixDetail";

export interface Matrix {
  id: string;
  year: string;
  n_alternatives: number;
  modality_id: number;
  questions_per_area: number;
  unique_area: boolean;
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