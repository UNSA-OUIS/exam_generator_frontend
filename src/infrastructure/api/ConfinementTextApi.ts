// infrastructure/api/ConfinementTextApi.ts
import axiosClient from "../lib/axiosClient";
import type { ConfinementText } from "../../models/ConfinementText";

export const ConfinementTextApi = {
  async getAll(): Promise<ConfinementText[]> {
    const response = await axiosClient.get("/confinement_texts");
    return response.data;
  },

  async get(id: number): Promise<ConfinementText> {
    const response = await axiosClient.get(`/confinement_texts/${id}`);
    return response.data;
  },

  async create(data: Partial<ConfinementText>): Promise<ConfinementText> {
    const response = await axiosClient.post("/confinement_texts", data);
    return response.data;
  },

  async update(
    id: number,
    data: Partial<ConfinementText>
  ): Promise<ConfinementText> {
    const response = await axiosClient.patch(`/confinement_texts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axiosClient.delete(`/confinement_texts/${id}`);
  },

  // 🔹 Método para obtener textos por confinamiento (usando UUID)
  async getByConfinement(confinementId: string): Promise<ConfinementText[]> {
    console.log("🌐 API Call: GET", `/confinements/${confinementId}/texts`);
    try {
      const response = await axiosClient.get(`/confinements/${confinementId}/texts`);
      console.log("✅ API Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ API Error:", error.response?.data || error.message);
      throw error;
    }
  }
};