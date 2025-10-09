
import { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from "@mui/material";
import { CloudUpload as CloudUploadIcon, Description as DescriptionIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Datos de prueba para la tabla
const testData = [
  { id: 1, ejeTematico: "Álgebra", componente: "Ecuaciones lineales", total: 15 },
  { id: 2, ejeTematico: "Geometría", componente: "Triángulos y cuadriláteros", total: 12 },
  { id: 3, ejeTematico: "Estadística", componente: "Medidas de tendencia central", total: 8 },
];

export default function Sorter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea un archivo ZIP
      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
        setSelectedFile(file);
        setMessage(null);
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

    setUploading(true);
    setMessage(null);

    // Simular proceso de carga (aquí iría la lógica real)
    setTimeout(() => {
      setUploading(false);
      setMessage({ 
        type: 'success', 
        text: `Archivo "${selectedFile.name}" procesado correctamente.` 
      });
      setSelectedFile(null);
      
      // Limpiar el input file
      const fileInput = document.getElementById('zip-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }, 2000);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage(null);
    const fileInput = document.getElementById('zip-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 3,
          textAlign: 'center'
        }}
      >
        Sorteador - Agregar Preguntas del Alimentador
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Sección de carga de archivos - COMPACTA Y ANCHA */}
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
            <Box sx={{ flex: 1}}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cargar Archivo ZIP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sube un archivo ZIP con las preguntas del alimentador
              </Typography>
            </Box>
          </Box>

          {/* Área de carga que ocupa todo el ancho */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
              sx={{
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 200,
                flexShrink: 0
              }}
            >
              Seleccionar ZIP
              <VisuallyHiddenInput 
                id="zip-file-input"
                type="file" 
                accept=".zip,application/zip"
                onChange={handleFileSelect}
              />
            </Button>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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
                  Ningún archivo seleccionado
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              startIcon={
                uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />
              }
              sx={{
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 140,
                flexShrink: 0
              }}
            >
              {uploading ? 'Procesando...' : 'Procesar'}
            </Button>
          </Box>

          {/* Mensajes de alerta compactos */}
          {message && (
            <Alert 
              severity={message.type} 
              sx={{ mt: 1 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}
        </Paper>

        {/* Sección de lista de datos */}
        <Paper 
          elevation={1} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Resumen de Preguntas Cargadas
              </Typography>
              <Chip 
                label={`${testData.length} componente${testData.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '40%' }}>
                    Eje Temático
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '40%' }}>
                    Componente
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ fontWeight: 600, fontSize: '0.875rem', width: '20%' }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testData.map((row, index) => (
                  <TableRow 
                    key={row.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'action.hover' 
                      },
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'grey.25'
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {row.ejeTematico}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      {row.componente}
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}
                    >
                      {row.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Resumen total */}
          {testData.length > 0 && (
            <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  textAlign: 'center',
                  color: 'primary.main'
                }}
              >
                Total general: {testData.reduce((sum, row) => sum + row.total, 0)} preguntas
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
