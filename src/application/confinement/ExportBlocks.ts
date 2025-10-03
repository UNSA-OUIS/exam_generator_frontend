// application/confinement/ExportBlocks.ts
import { exportBlocks, getConfinement } from "../../infrastructure/api/ConfinementApi";

export const ExportBlocks = async (confinementId: string): Promise<void> => {
  try {
    const confinement = await getConfinement(confinementId);
    await exportBlocks(confinementId, confinement.name);
  } catch (error) {
    throw new Error("Error al exportar los bloques");
  }
};
