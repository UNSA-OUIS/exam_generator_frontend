// application/confinement/DeleteConfinementText.ts
import { ConfinementTextApi } from "../../infrastructure/api/ConfinementTextApi";

export const DeleteConfinementText = async (id: number) => {
  return await ConfinementTextApi.delete(id);
};