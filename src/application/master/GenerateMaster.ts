import { generateMaster } from "../../infrastructure/api/MasterApi";

export const GenerateMaster = async (examId: string, area: string) => {
  return await generateMaster(examId, area);
};
