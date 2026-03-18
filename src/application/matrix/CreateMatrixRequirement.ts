import { MatrixRequirementApi } from "../../infrastructure/api/MatrixRequirementApi";
import type { MatrixRequirement } from "../../models/MatrixRequirement";

export const CreateMatrixRequirement = async (
  matrixRequirement: Partial<MatrixRequirement>
): Promise<MatrixRequirement> => {
  return await MatrixRequirementApi.create(matrixRequirement);
};