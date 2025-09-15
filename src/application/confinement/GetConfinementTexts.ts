// application/confinement/GetConfinementText.ts
import { ConfinementTextApi } from "../../infrastructure/api/ConfinementTextApi";
import type { ConfinementText } from "../../models/ConfinementText";

export const GetConfinementText = async (id: number): Promise<ConfinementText> => {
  return await ConfinementTextApi.get(id);
};