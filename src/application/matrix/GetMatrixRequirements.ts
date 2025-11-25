import { MatrixRequirementApi } from "../../infrastructure/api/MatrixRequirementApi";
import type { MatrixRequirement } from "../../models/MatrixRequirement";

export const GetMatrixRequirements = async (
  matrixId: string,
  area?: string
): Promise<MatrixRequirement[]> => {
  return await MatrixRequirementApi.getByMatrix(matrixId, area);
};