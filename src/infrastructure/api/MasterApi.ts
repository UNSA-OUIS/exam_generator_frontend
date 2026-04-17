import axiosClient from "../lib/axiosClient";

export const generateMaster = async (examId: string) => {
  const response = await axiosClient.post(`/exams/${examId}/masters`);
  return response.data;
};

export const deleteMaster = async (examId: string) => {
  const response = await axiosClient.delete(`/exams/${examId}/masters`);
  return response.data;
};

export const generateMasterPdf = async (examId: string, area: string) => {
  const response = await axiosClient.get(`/exams/${examId}/master/${area}/pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank");

  return response;
};

export const generateVariations = async (examId: string) => {
  const response = await axiosClient.post(`/exams/${examId}/variations`);
  return response.data;
};

export const deleteVariations = async (examId: string) => {
  const response = await axiosClient.delete(`/exams/${examId}/variations`);
  return response.data;
};

export const downloadVariationPdf = async (
  examId: string,
  area: string,
  variation: string
) => {
  const response = await axiosClient.get(
    `/exams/${examId}/variation/${area}/${variation}`,
    { responseType: "blob" }
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const newWindow = window.open(url, "_blank");

  if (!newWindow) {
    alert(
      "El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio."
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `variation_${examId}_${area}_${variation}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return response;
};