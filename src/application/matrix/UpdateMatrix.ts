import { updateMatrix } from "../../infrastructure/api/MatrixApi";
import type { Matrix } from "../../models/Matrix";

export const UpdateMatrix = async (id: number, data: Partial<Matrix>) => {
  return await updateMatrix(id, data);
};