import axiosClient from "../lib/axiosClient";
import type { Confinement } from "../../models/Confinement";

export const getConfinements = async (): Promise<Confinement[]> => {
  const response = await axiosClient.get("/confinements");
  return response.data;
};

export const createConfinement = async (
  confinement: Partial<Confinement>
): Promise<Confinement> => {
  const response = await axiosClient.post("/confinements", confinement);
  return response.data;
};

export const updateConfinement = async (
  id: string,
  confinement: Partial<Confinement>
): Promise<Confinement> => {
  const response = await axiosClient.patch(`/confinements/${id}`, confinement);
  return response.data;
};

export const deleteConfinement = async (id: string): Promise<void> => {
  await axiosClient.delete(`/confinements/${id}`);
};

export const getConfinement = async (id: string): Promise<Confinement> => {
  const response = await axiosClient.get(`/confinements/${id}`);
  return response.data;
};