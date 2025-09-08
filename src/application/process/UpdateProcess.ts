import { updateProcess } from "../../infrastructure/api/ProcessApi";
import type { Process } from "../../models/Process";

export const UpdateProcess = async (id: number, data: Partial<Process>) => {
  return await updateProcess(id, data);
};
