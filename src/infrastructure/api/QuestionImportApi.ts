// infrastructure/api/QuestionImportApi.ts
import axiosClient from "../lib/axiosClient";

export const importQuestions = async (confinementId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('questions', file);
  formData.append('confinementId', confinementId);

  // Log para debug
  console.log("Enviando FormData:");
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  try {
    const response = await axiosClient.post('/import-questions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 segundos timeout para archivos grandes
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Error en importQuestions:", error);
    
    // Si hay respuesta del servidor, lanzar error con detalles
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 422 && data.errors) {
        // Error de validación - mostrar errores específicos
        const validationErrors = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('; ');
        
        throw new Error(`Error de validación: ${validationErrors}`);
      } else if (data.message) {
        throw new Error(data.message);
      }
    }
    
    // Error de red o sin respuesta
    throw new Error(error.message || 'Error de conexión al servidor');
  }
};