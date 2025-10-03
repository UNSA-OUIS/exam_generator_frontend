import axiosClient from "../lib/axiosClient";
import type { MatrixDetail } from "../../models/MatrixDetail";

export const getMatrixDetails = async (): Promise<MatrixDetail[]> => {
  const response = await axiosClient.get("/matrix-details");
  return response.data;
};

export const createMatrixDetail = async (
  matrixDetail: Partial<MatrixDetail>
): Promise<MatrixDetail> => {
  const response = await axiosClient.post("/matrix-details", matrixDetail);
  return response.data;
};

export const updateMatrixDetail = async (
  id: number,
  matrixDetail: Partial<MatrixDetail>
): Promise<MatrixDetail> => {
  const response = await axiosClient.patch(`/matrix-details/${id}`, matrixDetail);
  return response.data;
};

export const deleteMatrixDetail = async (id: number): Promise<void> => {
  await axiosClient.delete(`/matrix-details/${id}`);
};

export const getMatrixDetail = async (id: number): Promise<MatrixDetail> => {
  const response = await axiosClient.get(`/matrix-details/${id}`);
  return response.data;
};