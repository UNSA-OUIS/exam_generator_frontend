import { deleteLevel } from "../../infrastructure/api/LevelApi";

export const DeleteLevel = async (id: number) => {
  return await deleteLevel(id);
};
