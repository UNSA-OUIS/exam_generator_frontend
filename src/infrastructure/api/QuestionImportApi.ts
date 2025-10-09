// infrastructure/api/QuestionImportApi.ts
import axiosClient from "../lib/axiosClient";

export const importQuestions = async (confinementId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('questions', file);
  formData.append('confinementId', confinementId);

  const response = await axiosClient.post('/import-questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};