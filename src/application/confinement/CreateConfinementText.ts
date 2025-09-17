// application/confinement/CreateConfinementText.ts
import { ConfinementTextApi } from "../../infrastructure/api/ConfinementTextApi";
import type { ConfinementText } from "../../models/ConfinementText";

export const CreateConfinementText = async (confinementText: Partial<ConfinementText>) => {
  return await ConfinementTextApi.create(confinementText);
};