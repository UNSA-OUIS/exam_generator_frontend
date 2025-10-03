import { getBlocks } from "../../infrastructure/api/BlockApi";

export const GetBlocks = async () => {
  return await getBlocks();
};