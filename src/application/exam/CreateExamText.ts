import { ExamTextApi } from "../../infrastructure/api/ExamTextApi";
import type { ExamText } from "../../models/ExamText";

export const CreateExamText = async (data: Partial<ExamText>): Promise<ExamText> => {
  return await ExamTextApi.create(data);
};
