// application/confinement/UpdateConfinementText.ts
import { ConfinementTextApi } from "../../infrastructure/api/ConfinementTextApi";
import type { ConfinementText } from "../../models/ConfinementText";

export const UpdateConfinementText = async (id: number, confinementText: Partial<ConfinementText>) => {
  return await ConfinementTextApi.update(id, confinementText);
};