// application/exam/ValidateExam.ts
import * as ExamApi from "../../infrastructure/api/ExamApi";

export const ValidateExam = async (examId: string) => {
  return await ExamApi.validateExam(examId);
};