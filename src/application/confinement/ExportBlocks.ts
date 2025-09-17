// application/confinement/ExportBlocks.ts
import { exportBlocks } from "../../infrastructure/api/ConfinementApi";

export const ExportBlocks = async (confinementId: string): Promise<void> => {
  try {
    await exportBlocks(confinementId);
  } catch (error) {
    throw new Error("Error al exportar los bloques");
  }
};