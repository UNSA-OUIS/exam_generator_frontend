// application/confinement/GetConfinementBlocks.ts
import { ConfinementBlockApi } from "../../infrastructure/api/ConfinementBlockApi";
import type { ConfinementBlock } from "../../models/ConfinementBlock";

export const GetConfinementBlocks = async (id: string): Promise<ConfinementBlock[]> => {
  // Cambia a la ruta correcta que filtra por confinamiento
  return await ConfinementBlockApi.getByConfinement(id);
};