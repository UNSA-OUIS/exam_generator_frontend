import axiosClient from "../lib/axiosClient";
import type { Matrix } from "../../models/Matrix";

export const getMatrices = async (): Promise<Matrix[]> => {
  const response = await axiosClient.get("/matrices");
  return response.data;
};

export const exportBlocks = async (matrixId: number): Promise<Blob> => {
  const response = await axiosClient.get(`/matrix/${matrixId}/export`, {
    responseType: 'blob'
  });
  return response.data;
};

export const createMatrix = async (
  matrix: Partial<Matrix>
): Promise<Matrix> => {
  const response = await axiosClient.post("/matrices", matrix);
  return response.data;
};

export const updateMatrix = async (
  id: number,
  matrix: Partial<Matrix>
): Promise<Matrix> => {
  const response = await axiosClient.patch(`/matrices/${id}`, matrix);
  return response.data;
};

export const deleteMatrix = async (id: number): Promise<void> => {
  await axiosClient.delete(`/matrices/${id}`);
};

export const getMatrix = async (id: number): Promise<Matrix> => {
  const response = await axiosClient.get(`/matrices/${id}`);
  return response.data;
};