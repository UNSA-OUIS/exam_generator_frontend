import { createConfinement } from "../../infrastructure/api/ConfinementApi";
import type { Confinement } from "../../models/Confinement";

export const CreateConfinement = async (data: Partial<Confinement>) => {
  return await createConfinement(data);
};