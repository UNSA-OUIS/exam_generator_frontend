import { deleteProcess } from "../../infrastructure/api/ProcessApi";

export const DeleteProcess = async (id: number) => {
  return await deleteProcess(id);
};
