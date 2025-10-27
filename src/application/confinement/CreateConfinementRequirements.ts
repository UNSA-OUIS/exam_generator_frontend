import { ConfinementRequirementApi } from "../../infrastructure/api/ConfinementRequirementApi";
import type { ConfinementRequirement } from "../../models/ConfinementRequirement";

export const CreateConfinementBlock = async (
  confinementBlock: Partial<ConfinementRequirement>
): Promise<ConfinementRequirement> => {
  return await ConfinementRequirementApi.create(confinementBlock);
};
