import axiosClient from "../lib/axiosClient";
import type { Question } from "../../models/Question";

export const getQuestions = async (filters?: {
  area?: string;
  confinement_id?: string;
  exam_id?: string;
  block_id?: number;
}): Promise<Question[]> => {
  const params = new URLSearchParams();
  
  if (filters?.area) params.append('area', filters.area);
  if (filters?.confinement_id) params.append('confinement_id', filters.confinement_id);
  if (filters?.exam_id) params.append('exam_id', filters.exam_id);
  if (filters?.block_id) params.append('block_id', filters.block_id.toString());

  const url = params.toString() ? `/questions?${params.toString()}` : '/questions';
  const response = await axiosClient.get(url);
  return response.data;
};

export const getQuestion = async (id: string): Promise<Question> => {
  const response = await axiosClient.get(`/questions/${id}`);
  return response.data;
};