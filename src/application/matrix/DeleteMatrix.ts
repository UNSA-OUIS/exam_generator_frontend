import { deleteMatrix } from "../../infrastructure/api/MatrixApi";

export const DeleteMatrix = async (id: string) => {
  return await deleteMatrix(id);
};