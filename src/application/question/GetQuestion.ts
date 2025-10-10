import { getQuestion } from "../../infrastructure/api/QuestionApi";

export const GetQuestion = async (id: string) => {
  return await getQuestion(id);
};