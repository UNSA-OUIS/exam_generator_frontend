import { getQuestions } from "../../infrastructure/api/QuestionApi";

export const GetQuestions = async (filters?: {
  area?: string;
  confinement_id?: string;
  exam_id?: string;
  block_id?: number;
}) => {
  return await getQuestions(filters);
};