import { getMatrices } from "../../infrastructure/api/MatrixApi";

export const GetMatrices = async () => {
  return await getMatrices();
};