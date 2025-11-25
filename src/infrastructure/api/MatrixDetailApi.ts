import axiosClient from "../lib/axiosClient";
import type { MatrixDetail } from "../../models/MatrixDetail";

export const getMatrixDetails = async (): Promise<MatrixDetail[]> => {
  const response = await axiosClient.get("/matrix_requirements");
  return response.data;
};

export const createMatrixDetail = async (
  matrixDetail: {
    matrix_id: string;
    block_id: number;
    area: string;
    n_questions: number;
    parent_id?: number;
  }
): Promise<MatrixDetail> => {
  const response = await axiosClient.post("/matrix_requirements", matrixDetail);
  return response.data;
};

export const updateMatrixDetail = async (
  id: number,
  matrixDetail: { n_questions?: number }
): Promise<MatrixDetail> => {
  const response = await axiosClient.patch(`/matrix_requirements/${id}`, matrixDetail);
  return response.data;
};

export const deleteMatrixDetail = async (id: number): Promise<void> => {
  await axiosClient.delete(`/matrix_requirements/${id}`);
};

export const getMatrixDetail = async (id: string): Promise<MatrixDetail> => {
  const response = await axiosClient.get(`/matrix_requirements/${id}`);
  return response.data;
};

// Nueva función para obtener requisitos por matriz
export const getMatrixRequirementsByMatrix = async (matrixId: number): Promise<MatrixDetail[]> => {
  const response = await axiosClient.get(`/matrices/${matrixId}/requirements`);
  return response.data;
};