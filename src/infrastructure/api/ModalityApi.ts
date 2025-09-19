import axiosClient from "../lib/axiosClient";
import type { Modality } from "../../models/Modality";

export const getModalities = async (): Promise<Modality[]> => {
  const response = await axiosClient.get("/modalities");
  return response.data;
};

export const createModality = async (
  modality: Partial<Modality>
): Promise<Modality> => {
  const response = await axiosClient.post("/modalities", modality);
  return response.data;
};

export const updateModality = async (
  id: number,
  modality: Partial<Modality>
): Promise<Modality> => {
  const response = await axiosClient.patch(`/modalities/${id}`, modality);
  return response.data;
};

export const deleteModality = async (id: number): Promise<void> => {
  await axiosClient.delete(`/modalities/${id}`);
};

export const getModality = async (id: number): Promise<Modality> => {
  const response = await axiosClient.get(`/modalities/${id}`);
  return response.data;
};
