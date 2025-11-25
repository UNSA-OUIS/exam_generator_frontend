import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";
import type { ExamRequirement } from "../../models/ExamRequirement";

export const UpdateExamRequirement = async (
  id: number,
  examRequirement: Partial<ExamRequirement>
): Promise<ExamRequirement> => {
  return await ExamRequirementApi.update(id, examRequirement);
};