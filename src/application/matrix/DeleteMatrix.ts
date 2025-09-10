import { deleteMatrix } from "../../infrastructure/api/MatrixApi";

export const DeleteMatrix = async (id: number) => {
  return await deleteMatrix(id);
};