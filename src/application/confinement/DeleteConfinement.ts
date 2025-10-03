import { deleteConfinement } from "../../infrastructure/api/ConfinementApi";

export const DeleteConfinement = async (id: string) => {
  return await deleteConfinement(id);
};