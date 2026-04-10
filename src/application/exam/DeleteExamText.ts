import { ExamTextApi } from "../../infrastructure/api/ExamTextApi";
import type { ExamText } from "../../models/ExamText";

export const CreateExamText = async (data: Partial<ExamText>): Promise<ExamText> => {
  return await ExamTextApi.create(data);
};
// DeleteExamText.ts  ← exportar desde archivo separado en tu proyecto
export const DeleteExamText = async (id: number): Promise<void> => {
  return await ExamTextApi.delete(id);
};
