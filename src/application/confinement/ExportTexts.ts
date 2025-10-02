import { exportTexts, getConfinement } from "../../infrastructure/api/ConfinementApi";

export const ExportTexts = async (confinementId: string): Promise<void> => {
  try {
    const confinement = await getConfinement(confinementId);
    await exportTexts(confinementId, confinement.name);
  } catch (error) {
    throw new Error("Error al exportar los textos");
  }
};
