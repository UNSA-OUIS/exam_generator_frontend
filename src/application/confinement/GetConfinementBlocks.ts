// D:\...\application\confinement\GetConfinementBlocks.ts
import { ConfinementBlockApi } from "../../infrastructure/api/ConfinementBlockApi";
import type { ConfinementBlock } from "../../models/ConfinementBlock";

export const GetConfinementBlocks = async (): Promise<ConfinementBlock[]> => {
  return await ConfinementBlockApi.getAll();
};
