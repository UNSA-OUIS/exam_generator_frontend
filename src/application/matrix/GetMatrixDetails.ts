import { getMatrixDetails } from "../../infrastructure/api/MatrixDetailApi";

export const GetMatrixDetails = async () => {
  return await getMatrixDetails();
};