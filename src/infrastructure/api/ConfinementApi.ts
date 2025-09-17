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
export const getConfinementBlocks = async (confinementId: string) => {
  const response = await axiosClient.get(`/confinements/${confinementId}/blocks`);
  return response.data;
};
// 🔹 Nuevo método para exportar bloques
export const exportBlocks = async (confinementId: string): Promise<void> => {
  const response = await axiosClient.get(`/confinements/${confinementId}/export`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `blocks-${confinementId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
