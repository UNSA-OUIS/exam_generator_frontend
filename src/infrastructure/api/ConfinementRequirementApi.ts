import axiosClient from "../lib/axiosClient";
import type { ConfinementRequirement } from "../../models/ConfinementRequirement";

export const ConfinementRequirementApi = {
  async getAll(): Promise<ConfinementRequirement[]> {
    const response = await axiosClient.get("/confinement_requirements");
    return response.data;
  },

  async get(id: number): Promise<ConfinementRequirement> {
    const response = await axiosClient.get(`/confinement_requirements/${id}`);
    return response.data;
  },

  async getByConfinement(confinementId: string): Promise<ConfinementRequirement[]> {
    const response = await axiosClient.get(`/confinements/${confinementId}/requirements`);
    return response.data;
  },

  async create(data: Partial<ConfinementRequirement>): Promise<ConfinementRequirement> {
    const response = await axiosClient.post("/confinement_requirements", data);
    return response.data;
  },

  async update(id: number, data: Partial<ConfinementRequirement>): Promise<ConfinementRequirement> {
    const response = await axiosClient.patch(`/confinement_requirements/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/confinement_requirements/${id}`);
  },
};