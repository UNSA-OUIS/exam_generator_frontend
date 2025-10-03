import { ConfinementBlockApi } from "../../infrastructure/api/ConfinementBlockApi";
import type { ConfinementBlock } from "../../models/ConfinementBlock";

export const CreateConfinementBlock = async (
  confinementBlock: Partial<ConfinementBlock>
): Promise<ConfinementBlock> => {
  return await ConfinementBlockApi.create(confinementBlock);
};
