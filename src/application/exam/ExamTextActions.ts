// CreateExamText.ts
import { ExamTextApi } from "../../infrastructure/api/ExamTextApi";

// DeleteExamText.ts  ← exportar desde archivo separado en tu proyecto
export const DeleteExamText = async (id: number): Promise<void> => {
  return await ExamTextApi.delete(id);
};
