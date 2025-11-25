import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";
import type { ExamRequirement } from "../../models/ExamRequirement";

export const GetExamRequirements = async (
  examId: string,
  area?: string
): Promise<ExamRequirement[]> => {
  return await ExamRequirementApi.getByExam(examId, area);
};