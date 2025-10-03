import { updateConfinement } from "../../infrastructure/api/ConfinementApi";
import type { Confinement } from "../../models/Confinement";

export const UpdateConfinement = async (id: string, data: Partial<Confinement>) => {
  return await updateConfinement(id, data);
};