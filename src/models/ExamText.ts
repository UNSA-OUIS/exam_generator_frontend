export interface ExamText {
  id?: number;
  exam_id: string;
  area?: string;
  block_id: number;
  n_texts: number;
  questions_per_text: number;
  created_at?: string;
  updated_at?: string;
  block?: {
    id: number;
    name: string;
    code: string;
    has_text: boolean;
  };
  exam?: any;
}
