import { createBlock } from "../../infrastructure/api/BlockApi";
import type { Block } from "../../models/Block";

export const CreateBlock = async (data: Partial<Block>) => {
  return await createBlock(data);
};
