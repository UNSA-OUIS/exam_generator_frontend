import { MatrixRequirementApi } from "../../infrastructure/api/MatrixRequirementApi";
import type { MatrixRequirement } from "../../models/MatrixRequirement";

export const UpdateMatrixRequirement = async (
  id: number,
  matrixRequirement: Partial<MatrixRequirement>
): Promise<MatrixRequirement> => {
  return await MatrixRequirementApi.update(id, matrixRequirement);
};