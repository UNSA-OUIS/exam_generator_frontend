import { getProcesses } from "../../infrastructure/api/ProcessApi";

export const GetProcesses = async () => {
  return await getProcesses();
};
