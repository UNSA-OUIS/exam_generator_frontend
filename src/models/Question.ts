export interface Question {
  id: string; // UUID
  statement: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'USED' | 'RETIRED';
  block_id: number;
  text_id?: string;
  formulator_id: number;
  validator_id: number;
  style_editor_id: number;
  digitizer_id: number;
  resolution_path: string;
  answer: number;
  exam_id?: string;
  confinement_id: string;
  created_by: number;
  modified_by: number;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  formulator?: {
    id: number;
    name: string;
  };
  validator?: {
    id: number;
    name: string;
  };
  style_editor?: {
    id: number;
    name: string;
  };
  digitizer?: {
    id: number;
    name: string;
  };
  block?: {
    id: number;
    name: string;
  };
  text?: {
    id: string;
    content: string;
  };
  exam?: {
    id: string;
    name: string;
  };
  confinement?: {
    id: string;
    name: string;
  };
  areas?: Array<{
    id: number;
    area: string;
    component?: string;
  }>;
}