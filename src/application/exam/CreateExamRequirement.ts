// application/exam/CreateExamRequirement.ts
import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";
import type { ExamRequirement } from "../../models/ExamRequirement";

export const CreateExamRequirement = async (data: Partial<ExamRequirement>) => {
  return await ExamRequirementApi.create(data);
};