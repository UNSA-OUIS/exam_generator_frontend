import { ExamTextApi } from "../../infrastructure/api/ExamTextApi";
import type { ExamText } from "../../models/ExamText";
export const UpdateExamText = async (id: number, data: Partial<ExamText>): Promise<ExamText> => {
  return await ExamTextApi.update(id, data);
};