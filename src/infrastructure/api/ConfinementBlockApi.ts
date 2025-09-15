import axiosClient from "../lib/axiosClient";
import type { ConfinementBlock } from "../../models/ConfinementBlock";

export const ConfinementBlockApi = {
  async getAll(): Promise<ConfinementBlock[]> {
    const response = await axiosClient.get("/confinement_blocks");
    return response.data;
  },

  async get(id: number): Promise<ConfinementBlock> {
    const response = await axiosClient.get(`/confinement_blocks/${id}`);
    return response.data;
  },
  async getByConfinement(confinementId: string): Promise<ConfinementBlock[]> {
      const response = await axiosClient.get(`/confinements/${confinementId}/blocks`);
      return response.data;
    },
  async create(data: Partial<ConfinementBlock>): Promise<ConfinementBlock> {
    const response = await axiosClient.post("/confinement_blocks", data);
    return response.data;
  },

  async update(
    id: number,
    data: Partial<ConfinementBlock>
  ): Promise<ConfinementBlock> {
    const response = await axiosClient.patch(`/confinement_blocks/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/confinement_blocks/${id}`);
  },
};
