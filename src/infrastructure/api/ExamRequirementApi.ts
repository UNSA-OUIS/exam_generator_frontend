// infrastructure/api/ExamRequirementApi.ts
import axiosClient from "../lib/axiosClient";
import type { ExamRequirement } from "../../models/ExamRequirement";

export const ExamRequirementApi = {
  async getAll(): Promise<ExamRequirement[]> {
    const response = await axiosClient.get("/exam_requirements");
    return response.data;
  },

  async get(id: number): Promise<ExamRequirement> {
    const response = await axiosClient.get(`/exam_requirements/${id}`);
    return response.data;
  },

  async getByExam(examId: string, area?: string): Promise<ExamRequirement[]> {
    const params = area ? { area } : {};
    const response = await axiosClient.get(`/exams/${examId}/requirements`, { params });
    return response.data;
  },

  async create(data: Partial<ExamRequirement>): Promise<ExamRequirement> {
    const response = await axiosClient.post("/exam_requirements", data);
    return response.data;
  },

  async update(id: number, data: Partial<ExamRequirement>): Promise<ExamRequirement> {
    const response = await axiosClient.patch(`/exam_requirements/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/exam_requirements/${id}`);
  },
};