import axiosClient from "../lib/axiosClient";
import type { Level } from "../../models/Level";

export const getLevels = async (): Promise<Level[]> => {
  const response = await axiosClient.get("/levels");
  return response.data;
};

export const createLevel = async (level: Partial<Level>): Promise<Level> => {
  const response = await axiosClient.post("/levels", level);
  return response.data;
};

export const updateLevel = async (
  id: number,
  level: Partial<Level>
): Promise<Level> => {
  const response = await axiosClient.patch(`/levels/${id}`, level);
  return response.data;
};

export const deleteLevel = async (id: number): Promise<void> => {
  await axiosClient.delete(`/levels/${id}`);
};

export const getLevel = async (id: number): Promise<Level> => {
  const response = await axiosClient.get(`/levels/${id}`);
  return response.data;
};
