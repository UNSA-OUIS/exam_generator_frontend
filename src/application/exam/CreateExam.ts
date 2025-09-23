// application/exam/CreateExam.ts
import { createExam } from "../../infrastructure/api/ExamApi";
import type { Exam } from "../../models/Exam";

export const CreateExam = async (data: Partial<Exam>) => {
  return await createExam(data);
};