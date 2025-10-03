import axiosClient from "../lib/axiosClient";
import type { Collaborator } from "../../models/Collaborator";

export const CollaboratorApi = {
  async getAll(): Promise<Collaborator[]> {
    const response = await axiosClient.get("/collaborators");
    return response.data;
  },

  async get(id: number): Promise<Collaborator> {
    const response = await axiosClient.get(`/collaborators/${id}`);
    return response.data;
  },

  // NOTA: No implementamos create, update, delete según lo solicitado
};