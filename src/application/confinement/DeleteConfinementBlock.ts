// D:\...\application\confinement\DeleteConfinementBlock.ts
import { ConfinementBlockApi } from "../../infrastructure/api/ConfinementBlockApi";

export const DeleteConfinementBlock = async (id: number) => {
  return await ConfinementBlockApi.delete(id);
};
