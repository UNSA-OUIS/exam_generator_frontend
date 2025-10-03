import { deleteModality } from "../../infrastructure/api/ModalityApi";

export const DeleteModality = async (id: number) => {
  return await deleteModality(id);
};
