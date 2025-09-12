import { ConfinementTextApi } from "../../infrastructure/api/ConfinementTextApi";

export const GetConfinementTexts = async (confinementId: string) => {
  return await ConfinementTextApi.getByConfinement(confinementId);
};