import { updateBlock } from "../../infrastructure/api/BlockApi";
import type { Block } from "../../models/Block";

export const UpdateBlock = async (id: number, data: Partial<Block>) => {
  return await updateBlock(id, data);
};
