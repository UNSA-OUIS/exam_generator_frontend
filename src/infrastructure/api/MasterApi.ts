import axiosClient from "../lib/axiosClient";

export const generateMaster = async (examId: string, area: string) => {
  const response = await axiosClient.post("/masters/generate", {
    exam_id: examId,
    area,
  });
  return response.data;
};
export const generateMasterPdf = async (examId: string, area: string) => {
  // Ruta Laravel: Route::get('exams/{exam}/master/{area}/pdf', ...)
  const response = await axiosClient.get(`/exams/${examId}/master/${area}/pdf`, {
    responseType: "blob", // Para recibir el PDF binario
  });

  // Crear blob y descargar el PDF
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  // Abre el PDF en una nueva pestaña (puedes cambiarlo a descarga si prefieres)
  window.open(url, "_blank");

  return response;
};