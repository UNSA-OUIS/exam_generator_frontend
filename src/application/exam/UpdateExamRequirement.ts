// application/exam/UpdateExamRequirement.ts
import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";
import type { ExamRequirement } from "../../models/ExamRequirement";

export const UpdateExamRequirement = async (id: number, data: Partial<ExamRequirement>) => {
  return await ExamRequirementApi.update(id, data);
};