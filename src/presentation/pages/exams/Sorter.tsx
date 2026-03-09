// pages/exams/Sorter.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Exam } from "../../../models/Exam";
import {
  generateMaster,
  generateMasterPdf,
  generateVariations,
  downloadVariationPdf
} from "../../../infrastructure/api/MasterApi";
import { GetExams } from "../../../application/exam/GetExams";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  IconButton,
} from "@mui/material";
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

// Definir las áreas disponibles
const AREAS = [
  { value: "BIOMEDICAS", label: "Biomédicas" },
  { value: "INGENIERIAS", label: "Ingenierías" },
  { value: "SOCIALES", label: "Sociales" },
];

const Sorter = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [masterGenerated, setMasterGenerated] = useState(false);

  // Estado para el modal de Master PDF con selector de área
  const [masterDialog, setMasterDialog] = useState<{
    open: boolean;
    selectedArea: string;
  }>({ open: false, selectedArea: "" });

  // Estado para el modal de Temas con selector de área
  const [themesDialog, setThemesDialog] = useState<{
    open: boolean;
    selectedArea: string;
  }>({ open: false, selectedArea: "" });

  const fetchExam = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetExams();
      const foundExam = data.find((e) => e.id.toString() === examId);
      if (foundExam) {
        setExam(foundExam);
      } else {
        setError("Examen no encontrado");
      }
    } catch (err) {
      setError("Error al cargar el examen");
    } finally {
      setLoading(false);
    }
  };

  const handleMasterPdfClick = () => {
    setMasterDialog({ open: true, selectedArea: "" });
  };

  const handleGenerateMasterPdf = async () => {
    if (!exam || !masterDialog.selectedArea) {
      alert("Por favor selecciona un área");
      return;
    }

    try {
      setActionLoading('masterPdf');
      console.log("Generando Master PDF...");
      await generateMasterPdf(
        exam.id.toString(), 
        masterDialog.selectedArea
      );
      alert(`✅ Master PDF generado para ${masterDialog.selectedArea}`);
      setMasterDialog({ open: false, selectedArea: "" });
    } catch (error: any) {
      console.error("Error al generar Master PDF:", error);
      alert("❌ Error al generar el PDF del Master");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateMaster = async () => {
    if (!exam) return;

    try {
      setActionLoading('generateMaster');
      console.log("✅ Iniciando generación de master...");
      
      const response = await generateMaster(exam.id.toString());
      console.log("✅ Respuesta completa:", response);
      
      if (response && response.success) {
        alert(response.message || "✅ Master generado exitosamente");
        setMasterGenerated(true); // Cambiar el estado a generado
      } else {
        alert(`❌ Respuesta inesperada: ${JSON.stringify(response)}`);
      }
      
    } catch (error: any) {
      console.error("❌ Error completo:", error);
      console.error("❌ Response data:", error.response?.data);
      console.error("❌ Status:", error.response?.status);
      
      if (error.response?.data?.message) {
        alert(`❌ ${error.response.data.message}`);
      } else if (error.message) {
        alert(`❌ ${error.message}`);
      } else {
        alert("❌ Error desconocido al generar el Master");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateVariations = async () => {
    if (!exam) return;

    try {
      setActionLoading('generateVariations');

      console.log("Generando variaciones para examId:", exam.id);

      const { data } = await generateVariations(exam.id.toString());

      if (data.success) {
        alert(data.message || "✅ Variaciones generadas exitosamente");
        await fetchExam();
      } else {
        alert(`❌ ${data.message || 'Error al generar variaciones'}`);
      }

    } catch (error: any) {
      console.error("Error completo al generar variaciones:", error);

      if (error.response?.data) {
        const errorData = error.response.data;
        console.error("Error response:", errorData);
        alert(`❌ ${errorData.message || errorData.error || 'Error del servidor'}`);
      } else if (error.request) {
        alert("❌ No se pudo conectar con el servidor");
      } 
    } finally {
      setActionLoading(null);
    }
  };

  const handleThemesClick = () => {
    setThemesDialog({ open: true, selectedArea: "" });
  };

  const handleDownloadVariation = async (variation: string) => {
    if (!exam || !themesDialog.selectedArea) {
      alert("Por favor selecciona un área");
      return;
    }

    try {
      setActionLoading(`downloadVariation-${variation}`);
      console.log("Descargando variación:", variation);
      await downloadVariationPdf(
        exam.id.toString(),
        themesDialog.selectedArea,
        variation
      );
      alert(`✅ Tema ${variation} descargado para ${themesDialog.selectedArea}`);
    } catch (error: any) {
      console.error("Error al descargar variación:", error);
      alert("❌ Error al descargar la variación");
    } finally {
      setActionLoading(null);
    }
  };

  const handleThemesClose = () => {
    setThemesDialog({ open: false, selectedArea: "" });
  };

  const handleMasterClose = () => {
    setMasterDialog({ open: false, selectedArea: "" });
  };

  useEffect(() => {
    fetchExam();
  }, [examId]);

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando examen...
        </Typography>
      </Box>
    );
  }

  if (error || !exam) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchExam}>
              Reintentar
            </Button>
          }
        >
          {error || "Examen no encontrado"}
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/exams")}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => navigate("/exams")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Sorteador - {exam.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Matrix ID: {exam.matrix_id} | Temas: {exam.total_variations}
          </Typography>
        </Box>
      </Box>

      {/* Card con información y botones */}
      <Card sx={{ maxWidth: 800, mx: "auto" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Información del Examen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>ID:</strong> #{exam.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Descripción:</strong> {exam.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Creado:</strong> {new Date(exam.created_at).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Botones en una sola fila */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* Botón que cambia según si el master fue generado */}
            {!masterGenerated ? (
              <Button
                variant="outlined"
                color="secondary"
                disabled={actionLoading === 'generateMaster'}
                onClick={handleGenerateMaster}
                sx={{ flex: 1, minWidth: 150 }}
              >
                {actionLoading === 'generateMaster' ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Generando...
                  </>
                ) : (
                  "Generar Master"
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PdfIcon />}
                onClick={handleMasterPdfClick}
                sx={{ flex: 1, minWidth: 150 }}
              >
                Descargar Master
              </Button>
            )}

            <Button
              variant="outlined"
              color="success"
              disabled={actionLoading === 'generateVariations'}
              onClick={handleGenerateVariations}
              sx={{ flex: 1, minWidth: 150 }}
            >
              {actionLoading === 'generateVariations' ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Generando...
                </>
              ) : (
                "Generar Temas"
              )}
            </Button>

            <Button
              variant="contained"
              color="warning"
              startIcon={<DownloadIcon />}
              onClick={handleThemesClick}
              sx={{ flex: 1, minWidth: 150 }}
            >
              Descargar Temas
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para Master PDF con selector de área */}
      <Dialog
        open={masterDialog.open}
        onClose={handleMasterClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Descargar Master PDF - {exam.description}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1 }}>
            Selecciona el área para descargar el PDF del Master
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel id="master-area-label">Área</InputLabel>
            <Select
              labelId="master-area-label"
              value={masterDialog.selectedArea}
              label="Área"
              onChange={(e: SelectChangeEvent) =>
                setMasterDialog({ ...masterDialog, selectedArea: e.target.value })
              }
            >
              {AREAS.map((area) => (
                <MenuItem key={area.value} value={area.value}>
                  {area.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleMasterClose} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateMasterPdf}
            variant="contained"
            color="primary"
            disabled={!masterDialog.selectedArea || actionLoading === 'masterPdf'}
            startIcon={
              actionLoading === 'masterPdf' ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PdfIcon />
              )
            }
          >
            {actionLoading === 'masterPdf' ? "Descargando..." : "Descargar PDF"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para descargar temas con selector de área */}
      <Dialog
        open={themesDialog.open}
        onClose={handleThemesClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Descargar Temas - {exam.description}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1 }}>
            Primero selecciona el área, luego el tema que deseas descargar
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="themes-area-label">Área</InputLabel>
            <Select
              labelId="themes-area-label"
              value={themesDialog.selectedArea}
              label="Área"
              onChange={(e: SelectChangeEvent) =>
                setThemesDialog({ ...themesDialog, selectedArea: e.target.value })
              }
            >
              {AREAS.map((area) => (
                <MenuItem key={area.value} value={area.value}>
                  {area.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {themesDialog.selectedArea && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Área seleccionada: <strong>{AREAS.find(a => a.value === themesDialog.selectedArea)?.label}</strong>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {['A', 'B', 'C', 'D'].map((theme) => (
                  <Button
                    key={theme}
                    variant="contained"
                    fullWidth
                    size="large"
                    color="primary"
                    disabled={actionLoading === `downloadVariation-${theme}`}
                    onClick={() => handleDownloadVariation(theme)}
                    startIcon={
                      actionLoading === `downloadVariation-${theme}` ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <DownloadIcon />
                      )
                    }
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    {actionLoading === `downloadVariation-${theme}` ? 'Descargando...' : `Descargar Tema ${theme}`}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleThemesClose} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sorter;