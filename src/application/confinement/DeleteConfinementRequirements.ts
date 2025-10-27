// D:\...\application\confinement\DeleteConfinementBlock.ts
import { ConfinementRequirementApi } from "../../infrastructure/api/ConfinementRequirementApi";

export const DeleteConfinementBlock = async (id: number) => {
  return await ConfinementRequirementApi.delete(id);
};
