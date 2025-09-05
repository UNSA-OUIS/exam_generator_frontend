import axiosClient from "../lib/axiosClient";
import type { Process } from "../../models/Process";

export const getProcesses = async (): Promise<Process[]> => {
  const response = await axiosClient.get("/processes");
  return response.data;
};

export const createProcess = async (
  process: Partial<Process>
): Promise<Process> => {
  const response = await axiosClient.post("/processes", process);
  return response.data;
};

export const updateProcess = async (
  id: number,
  process: Partial<Process>
): Promise<Process> => {
  const response = await axiosClient.patch(`/processes/${id}`, process);
  return response.data;
};

export const deleteProcess = async (id: number): Promise<void> => {
  await axiosClient.delete(`/processes/${id}`);
};

export const getProcess = async (id: number): Promise<Process> => {
  const response = await axiosClient.get(`/processes/${id}`);
  return response.data;
};
