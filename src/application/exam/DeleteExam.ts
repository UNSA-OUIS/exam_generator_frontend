// application/exam/DeleteExam.ts
import { deleteExam } from "../../infrastructure/api/ExamApi";

export const DeleteExam = async (id: number) => {
  return await deleteExam(id);
};