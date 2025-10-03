// application/confinement/GetConfinementTexts.ts
import { ConfinementTextApi } from "../../infrastructure/api/ConfinementTextApi";

export const GetConfinementTexts = async (confinementId: string) => {
  console.log("📋 Fetching texts for confinement:", confinementId);
  try {
    const data = await ConfinementTextApi.getByConfinement(confinementId);
    console.log("✅ Texts data received:", data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching texts:", error);
    throw error;
  }
};