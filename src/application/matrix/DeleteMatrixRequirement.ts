import { MatrixRequirementApi } from "../../infrastructure/api/MatrixRequirementApi";

export const DeleteMatrixRequirement = async (id: number): Promise<void> => {
  return await MatrixRequirementApi.delete(id);
};