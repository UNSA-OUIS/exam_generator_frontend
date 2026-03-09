// D:\...\application\confinement\UpdateConfinementBlock.ts
import { ConfinementRequirementApi } from "../../infrastructure/api/ConfinementRequirementApi";
import type { ConfinementRequirement } from "../../models/ConfinementRequirement";

export const UpdateConfinementBlock = async (id: number, payload: Partial<ConfinementRequirement>) => {
  return await ConfinementRequirementApi.update(id, payload);
};
