// D:\...\application\confinement\UpdateConfinementBlock.ts
import { ConfinementBlockApi } from "../../infrastructure/api/ConfinementBlockApi";
import type { ConfinementBlock } from "../../models/ConfinementBlock";

export const UpdateConfinementBlock = async (id: number, payload: Partial<ConfinementBlock>) => {
  return await ConfinementBlockApi.update(id, payload);
};
