import axiosClient from "../lib/axiosClient";
import type { Exam } from "../../models/Exam";

export const getExams = async (): Promise<Exam[]> => {
  const response = await axiosClient.get("/exams");
  return response.data;
};

export const createExam = async (exam: Partial<Exam>): Promise<Exam> => {
  const response = await axiosClient.post("/exams", exam);
  return response.data;
};

export const updateExam = async (
  id: number,
  exam: Partial<Exam>
): Promise<Exam> => {
  const response = await axiosClient.patch(`/exams/${id}`, exam);
  return response.data;
};

export const deleteExam = async (id: number): Promise<void> => {
  await axiosClient.delete(`/exams/${id}`);
};

export const getExam = async (id: number): Promise<Exam> => {
  const response = await axiosClient.get(`/exams/${id}`);
  return response.data;
};