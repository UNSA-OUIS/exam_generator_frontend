// application/exam/UpdateExam.ts
import { updateExam } from "../../infrastructure/api/ExamApi";
import type { Exam } from "../../models/Exam";

export const UpdateExam = async (id: number, data: Partial<Exam>) => {
  return await updateExam(id, data);
};