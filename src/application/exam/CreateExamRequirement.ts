import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";
import type { ExamRequirement } from "../../models/ExamRequirement";

export const CreateExamRequirement = async (
  examRequirement: Partial<ExamRequirement>
): Promise<ExamRequirement> => {
  return await ExamRequirementApi.create(examRequirement);
};