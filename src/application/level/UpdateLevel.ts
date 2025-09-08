import { updateLevel } from "../../infrastructure/api/LevelApi";
import type { Level } from "../../models/Level";

export const UpdateLevel = async (id: number, data: Partial<Level>) => {
  return await updateLevel(id, data);
};
