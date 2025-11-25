import axiosClient from "../lib/axiosClient";
import type { MatrixRequirement } from "../../models/MatrixRequirement";

export const MatrixRequirementApi = {
  async getAll(): Promise<MatrixRequirement[]> {
    const response = await axiosClient.get("/matrix_requirements");
    return response.data;
  },

  async get(id: number): Promise<MatrixRequirement> {
    const response = await axiosClient.get(`/matrix_requirements/${id}`);
    return response.data;
  },

  async getByMatrix(matrixId: string, area?: string): Promise<MatrixRequirement[]> {
    const params = area ? { area } : {};
    const response = await axiosClient.get(`/matrices/${matrixId}/requirements`, { params });
    return response.data;
  },

  async create(data: Partial<MatrixRequirement>): Promise<MatrixRequirement> {
    const response = await axiosClient.post("/matrix_requirements", data);
    return response.data;
  },

  async update(id: number, data: Partial<MatrixRequirement>): Promise<MatrixRequirement> {
    const response = await axiosClient.patch(`/matrix_requirements/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/matrix_requirements/${id}`);
  },
};