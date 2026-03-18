// application/confinement/GetConfinementBlocks.ts
import { ConfinementRequirementApi } from "../../infrastructure/api/ConfinementRequirementApi";
import type { ConfinementRequirement } from "../../models/ConfinementRequirement";

export const GetConfinementBlocks = async (id: string): Promise<ConfinementRequirement[]> => {
  // Cambia a la ruta correcta que filtra por confinamiento
  return await ConfinementRequirementApi.getByConfinement(id);
};