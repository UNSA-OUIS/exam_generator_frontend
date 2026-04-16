import axiosClient from "../lib/axiosClient";

export const generateMaster = async (examId: string) => {
  console.log("🔍 Generating master for examId:", examId);
  
  try {
    const response = await axiosClient.post("/exams/masters", {
      exam_id: examId,
    });
    
    console.log("🔍 Master generation SUCCESS:", response.data);
    return response.data; // ← Asegúrate de que esto retorna response.data
    
  } catch (error) {
    console.error("🔍 Master generation ERROR:", error);
    throw error; // ← Asegúrate de relanzar el error
  }
};
  
export const generateMasterPdf = async (examId: string, area: string) => {
  console.log("Generating master PDF for examId:", examId, "area:", area);
  
  try {
    const response = await axiosClient.get(`/exams/${examId}/master/${area}/pdf`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);  
     window.open(url, '_blank');

    return response;
  } catch (error) {
    console.error("Error generating master PDF:", error);
    throw error;
  }
};

export const generateVariations = async (examId: string) => {
  console.log("Generating variations for examId:", examId);
  const response = await axiosClient.post("/exams/variations", {
    exam_id: examId,
  });
  console.log("Variations generation response:", response);
  return response.data;
};

export const downloadVariationPdf = async (examId: string, area: string, variation: string) => {
  console.log("Abriendo variación PDF para examId:", examId, "area:", area, "variation:", variation);
  
  try {
    const response = await axiosClient.get(`/exams/${examId}/variation/${area}/${variation}`, {
      responseType: "blob",
    });

    // Crear blob y abrir en nueva ventana
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    
    // Abrir en nueva ventana/pestaña
    const newWindow = window.open(url, '_blank');
    
    // Si el navegador bloquea la ventana emergente, mostrar mensaje
    if (!newWindow) {
      alert('El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.');
      // Alternativa: forzar descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `variation_${examId}_${area}_${variation}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return response;
  } catch (error) {
    console.error("Error abriendo variación PDF:", error);
    throw error;
  }
};