import { createProcess } from "../../infrastructure/api/ProcessApi";
import type { Process } from "../../models/Process";

export const CreateProcess = async (data: Partial<Process>) => {
  return await createProcess(data);
};
