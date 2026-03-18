import axiosClient from "../lib/axiosClient";
import type { Matrix } from "../../models/Matrix";

export const getMatrices = async (): Promise<Matrix[]> => {
  const response = await axiosClient.get("/matrices");
  return response.data;
};

export const createMatrix = async (matrix: Partial<Matrix>): Promise<Matrix> => {
  const response = await axiosClient.post("/matrices", matrix);
  return response.data;
};

export const updateMatrix = async (id: string, matrix: Partial<Matrix>): Promise<Matrix> => {
  const response = await axiosClient.patch(`/matrices/${id}`, matrix);
  return response.data;
};

export const deleteMatrix = async (id: string): Promise<void> => {
  await axiosClient.delete(`/matrices/${id}`);
};

export const getMatrix = async (id: string): Promise<Matrix> => {
  const response = await axiosClient.get(`/matrices/${id}`);
  return response.data;
};