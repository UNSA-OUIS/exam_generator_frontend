import axiosClient from "../lib/axiosClient";
import type { ConfinementBlock } from "../../models/ConfinementBlock";

export const ConfinementBlockApi = {
  async getAll(): Promise<ConfinementBlock[]> {
    const response = await axiosClient.get("/confinement_requirements");
    return response.data;
  },

  async get(id: number): Promise<ConfinementBlock> {
    const response = await axiosClient.get(`/confinement_requirements/${id}`);
    return response.data;
  },
  async getByConfinement(confinementId: string): Promise<ConfinementBlock[]> {
      const response = await axiosClient.get(`/confinements/${confinementId}/blocks`);
      return response.data;
    },
  async create(data: Partial<ConfinementBlock>): Promise<ConfinementBlock> {
    const response = await axiosClient.post("/confinement_requirements", data);
    return response.data;
  },

  async update(
    id: number,
    data: Partial<ConfinementBlock>
  ): Promise<ConfinementBlock> {
    const response = await axiosClient.patch(`/confinement_requirements/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/confinement_requirements/${id}`);
  },
};
