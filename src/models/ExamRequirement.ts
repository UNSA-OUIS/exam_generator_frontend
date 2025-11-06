import type { Block } from "./Block";
import type { Exam } from "./Exam";

// models/ExamRequirement.ts
export interface ExamRequirement {
  id?: number;
  exam_id: string;
  area: string;
  block_id?: number;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL" | string | null;
  n_questions: number;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
  block?: Block;
  exam?: Exam;
  parent?: ExamRequirement;
  children?: ExamRequirement[];
}