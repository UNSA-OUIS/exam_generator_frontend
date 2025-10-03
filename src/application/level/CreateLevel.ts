import { createLevel } from "../../infrastructure/api/LevelApi";
import type { Level } from "../../models/Level";

export const CreateLevel = async (data: Partial<Level>) => {
  return await createLevel(data);
};