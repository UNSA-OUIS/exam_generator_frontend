import axiosClient from "../lib/axiosClient";
import type { ExamText } from "../../models/ExamText";

export const ExamTextApi = {
  async getAll(): Promise<ExamText[]> {
    const response = await axiosClient.get("/exam_texts");
    return response.data;
  },

  async get(id: number): Promise<ExamText> {
    const response = await axiosClient.get(`/exam_texts/${id}`);
    return response.data;
  },

  async getByExamAndBlock(
  examId: string,
  blockId: number,
  area?: string
): Promise<ExamText[]> {
  const params = new URLSearchParams({
    block_id: String(blockId),
  });

  if (area) {
    params.append("area", area);
  }

  const response = await axiosClient.get(
    `/exams/${examId}/texts?${params.toString()}`
  );

  return response.data;
},
  async create(data: Partial<ExamText>): Promise<ExamText> {
    const response = await axiosClient.post("/exam_texts", data);
    return response.data;
  },

  async update(id: number, data: Partial<ExamText>): Promise<ExamText> {
    const response = await axiosClient.patch(`/exam_texts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/exam_texts/${id}`);
  },
};
