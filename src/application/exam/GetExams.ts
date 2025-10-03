// application/exam/GetExams.ts
import { getExams } from "../../infrastructure/api/ExamApi";

export const GetExams = async () => {
  return await getExams();
};