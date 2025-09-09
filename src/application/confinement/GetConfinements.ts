import { getConfinements } from "../../infrastructure/api/ConfinementApi";

export const GetConfinements = async () => {
  return await getConfinements();
};