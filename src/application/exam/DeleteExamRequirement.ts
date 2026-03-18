import { ExamRequirementApi } from "../../infrastructure/api/ExamRequirementApi";

export const DeleteExamRequirement = async (id: number): Promise<void> => {
  return await ExamRequirementApi.delete(id);
};