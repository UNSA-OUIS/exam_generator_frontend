// application/exam/DeleteExamRequirement.ts
import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";

export const DeleteExamRequirement = async (id: number) => {
  return await ExamRequirementApi.delete(id);
};