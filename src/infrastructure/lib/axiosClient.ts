import axios from "axios";

const axiosClient = axios.create({
  //baseURL: 'https://desaoti.unsa.edu.pe/exam_generator_backend', // Cambiar por tu URL real
  baseURL: "http://localhost:8000/api", // Cambiar por tu URL real
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true, // Requerido para que Laravel envíe/reciba cookies
  withXSRFToken: true,
});

/* axiosClient.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        if (error.response) {
            console.log('Error response: ', error.response);
            if (error.response?.status === 401 && error.response?.config.url !== '/api/user') {
                alert('No esta autorizado para realizar esta operacion. ' + error.response?.data?.message);
                window.location.pathname = '/exam_generator_backend';
            }
            if (error.response?.status === 403 || error.response?.status === 413) {
                alert('Operacion prohibida. ' + error.response?.data?.message);
            }
            if (error.response?.status === 404) {
                alert('No se encontro el recurso con los identificadores proporcionados');
            }
            if (error.response?.status === 409) {
                alert('El recurso enviado ya existe en el sistema. ' + error.response?.data?.message);
            }
            if (error.response?.status === 500) {
                alert('Ha ocurrido un error en el servicio. Comuniquese con soporte');
            }
        } else {
            alert(
                'Ha ocurrido un error durante la operación en la aplicación, intente ingresar de nuevo o comuniquese con soporte',
            );
        }
        return Promise.reject(error);
    },
); */

export default axiosClient;
