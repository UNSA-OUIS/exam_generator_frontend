import { deleteBlock } from "../../infrastructure/api/BlockApi";

export const DeleteBlock = async (id: number) => {
  return await deleteBlock(id);
};
