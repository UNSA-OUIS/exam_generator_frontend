import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { importQuestions } from "../../infrastructure/api/QuestionImportApi";
import { getConfinements } from "../../infrastructure/api/ConfinementApi";
import type { Confinement } from "../../models/Confinement";
import { useNavigate } from "react-router-dom";

export default function QuestionImport() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConfinement, setSelectedConfinement] = useState<string>("");
  const [confinements, setConfinements] = useState<Confinement[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingConfinements, setLoadingConfinements] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cargar lista de Internamientos
  useEffect(() => {
    const fetchConfinements = async () => {
      setLoadingConfinements(true);
      try {
        const confinementsData = await getConfinements();
        setConfinements(confinementsData);
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: 'Error al cargar la lista de Internamientos' 
        });
      } finally {
        setLoadingConfinements(false);
      }
    };

    fetchConfinements();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea un archivo ZIP
      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setMessage(null);
        setShowSuccess(false); // Ocultar éxito anterior al seleccionar nuevo archivo
      } else {
        setMessage({ type: 'error', text: 'Por favor, selecciona un archivo ZIP válido.' });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un archivo ZIP primero.' });
      return;
    }

    if (!selectedConfinement) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un Internamiento.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setShowSuccess(false);

    try {
      console.log("Iniciando importación de preguntas...", "Archivo:", selectedFile.name, "Internamiento ID:", selectedConfinement);
      const result = await importQuestions(selectedConfinement, selectedFile);

      if (result.success) {
        setShowSuccess(true);
        setMessage({ 
          type: 'success', 
          text: `¡Importación exitosa! El archivo "${selectedFile.name}" ha sido procesado correctamente. ${result.message}` 
        });

        setTimeout(() => {
          handleRemoveFile();
          setSelectedConfinement("");
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Error al procesar el archivo.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error de conexión al servidor. Inténtalo nuevamente.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage(null);
    const fileInput = document.getElementById('zip-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleBack = () => {
    navigate("/bank");
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Box sx={{ py: 3, px: 2, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Botón de regresar */}
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{
          mb: 2,
          textTransform: 'none',
          fontWeight: 500,
          color: 'primary.main',
          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
        }}
      >
        Regresar al Banco
      </Button>

      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 3
        }}
      >
        Banco de preguntas
      </Typography>

      {/* Resto del código igual */}
      {showSuccess && (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{ mb: 3, fontSize: '1rem', fontWeight: 500 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              ¡Importación completada con éxito!
            </Typography>
            <Typography variant="body2">
              Las preguntas han sido importadas correctamente al sistema.
            </Typography>
          </Box>
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Sección de selección de Internamiento */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e3f2fd 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Seleccionar Internamiento
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elige el Internamiento al que importar las preguntas
              </Typography>
            </Box>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Internamiento</InputLabel>
            <Select
              value={selectedConfinement}
              onChange={(e) => setSelectedConfinement(e.target.value)}
              label="Internamiento"
              disabled={loadingConfinements}
            >
              <MenuItem value="">
                {loadingConfinements ? "Cargando Internamientos..." : "Selecciona un Internamiento"}
              </MenuItem>
              {confinements.map((confinement) => (
                <MenuItem key={confinement.id} value={confinement.id}>
                  {confinement.name} - {formatDate(confinement.start_date)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Sección de carga de archivos */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cargar Archivo ZIP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sube un archivo ZIP con las preguntas del alimentador
              </Typography>
            </Box>
          </Box>
          {/* Área de carga */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={uploading || !selectedConfinement}
              sx={{
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 200
              }}
            >
              Seleccionar ZIP
              <input 
                id="zip-file-input"
                type="file" 
                accept=".zip,application/zip"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Button>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
              {selectedFile ? (
                <>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                    ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={handleRemoveFile}
                    disabled={uploading}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    ×
                  </Button>
                </>
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    flex: 1,
                    fontStyle: 'italic'
                  }}
                >
                  {!selectedConfinement ? 'Selecciona un Internamiento primero' : 'Ningún archivo seleccionado'}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || !selectedConfinement || uploading}
              startIcon={
                uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />
              }
              sx={{
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 140
              }}
            >
              {uploading ? 'Procesando...' : 'Procesar'}
            </Button>
          </Box>

          {/* Mensajes de alerta normales */}
          {message && !showSuccess && (
            <Alert 
              severity={message.type} 
              sx={{ mt: 1 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}
        </Paper>

      </Box>
    </Box>
  );
}