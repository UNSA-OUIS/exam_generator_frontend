import axiosClient from "../lib/axiosClient";

export const generateMaster = async (examId: string, area: string) => {
  const response = await axiosClient.post("/masters/generate", {
    exam_id: examId,
    area,
  });
  return response.data;
};
