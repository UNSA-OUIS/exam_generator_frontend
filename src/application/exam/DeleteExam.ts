// application/exam/DeleteExam.ts
import { deleteExam } from "../../infrastructure/api/ExamApi";

export const DeleteExam = async (id: string) => {
  return await deleteExam(id);
};