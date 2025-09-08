import { getLevels } from "../../infrastructure/api/LevelApi";

export const GetLevels = async () => {
  return await getLevels();
};
