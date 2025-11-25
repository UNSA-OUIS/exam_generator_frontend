import { deleteMatrixDetail } from "../../infrastructure/api/MatrixDetailApi";

export const DeleteMatrixDetail = async (id: number) => {
  return await deleteMatrixDetail(id);
};