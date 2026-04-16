export interface Exam {
  id: string;
  matrix_id: string;
  user_id: number;
  description: string;
  total_variations: number;
  created_at: string;
  updated_at: string;
  status?: "DRAFT" | "VALIDATED" | "MASTERED" | "VARIATED";
}