import { createMatrix } from "../../infrastructure/api/MatrixApi";
import type { Matrix } from "../../models/Matrix";

export const CreateMatrix = async (data: Partial<Matrix>) => {
  return await createMatrix(data);
};