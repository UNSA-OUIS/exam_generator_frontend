import { generateMaster } from "../../infrastructure/api/MasterApi";

export const GenerateMaster = async (examId: string) => {
  return await generateMaster(examId);
};
