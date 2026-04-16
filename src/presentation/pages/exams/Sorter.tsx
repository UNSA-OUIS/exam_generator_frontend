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
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  const isMasterGenerated = exam?.status === "MASTERED" || exam?.status === "VARIATED";
  const isVariationsGenerated = exam?.status === "VARIATED";

  const showMessage = (message: string, severity: any = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchExam = async () => {
    try {
      setLoading(true);
      const data = await GetExams();
      const found = data.find((e) => e.id.toString() === examId);
      setExam(found || null);
    } catch {
      showMessage("Error al cargar examen", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const handleGenerateMaster = async () => {
    if (!exam) return;
    try {
      setActionLoading("master");
      await generateMaster(exam.id.toString());
      showMessage("Matriz generada correctamente");
      await fetchExam();
    } catch (e: any) {
      showMessage(e.response?.data?.message || "Error al generar la matriz", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMaster = async () => {
    if (!exam) return;
    try {
      setActionLoading("delete-master");
      // await deleteMaster(exam.id.toString());
      showMessage("Matriz eliminada");
      await fetchExam();
    } catch (e: any) {
      showMessage(e.response?.data?.message || "Error al eliminar la matriz", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateVariations = async () => {
    if (!exam) return;
    try {
      setActionLoading("variations");
      const res = await generateVariations(exam.id.toString());
      showMessage(res.message || "Temas generados correctamente");
      await fetchExam();
    } catch (e: any) {
      showMessage(e.response?.data?.message || "Error al generar temas", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVariations = async () => {
    if (!exam) return;
    try {
      setActionLoading("delete-variations");
      // await deleteVariations(exam.id.toString());
      showMessage("Temas eliminados");
      await fetchExam();
    } catch (e: any) {
      showMessage(e.response?.data?.message || "Error al eliminar temas", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadMasterPdf = async (area: string) => {
    if (!exam) return;
    try {
      setActionLoading(`pdf-${area}`);
      await generateMasterPdf(exam.id.toString(), area);
    } catch {
      showMessage("Error al descargar PDF", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadVariation = async (area: string, variation: string) => {
    if (!exam) return;
    try {
      setActionLoading(`${area}-${variation}`);
      await downloadVariationPdf(exam.id.toString(), area, variation);
    } catch {
      showMessage("Error al descargar tema", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography mt={2} variant="body2" color="text.secondary">Cargando examen...</Typography>
      </Box>
    );
  }

  if (!exam) {
    return (
      <Box p={3}>
        <Alert severity="error">Examen no encontrado</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>

      {/* HEADER */}
      <Box display="flex" alignItems="center" gap={1} mb={4}>
        <IconButton onClick={() => navigate("/exams")} size="small">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {exam.description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sorteador de examen
          </Typography>
        </Box>
      </Box>

      {/* ACCIONES PRINCIPALES */}
      <Stack spacing={2} mb={4}>

        {/* MATRIZ */}
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Matriz general
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isMasterGenerated
                    ? "La matriz ha sido generada. Puedes eliminarla y volver a generarla cuando lo necesites."
                    : "Genera la matriz base del examen para todas las áreas."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                {isMasterGenerated && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={actionLoading === "delete-master"}
                    onClick={handleDeleteMaster}
                  >
                    {actionLoading === "delete-master"
                      ? <CircularProgress size={16} />
                      : "Eliminar matriz"}
                  </Button>
                )}
                {!isMasterGenerated && (
                  <Button
                    variant="contained"
                    size="small"
                    disabled={actionLoading === "master"}
                    onClick={handleGenerateMaster}
                  >
                    {actionLoading === "master"
                      ? <CircularProgress size={16} color="inherit" />
                      : "Generar matriz"}
                  </Button>
                )}
                {isMasterGenerated && !isVariationsGenerated && (
                  <Chip label="Generada" color="primary" size="small" variant="outlined" />
                )}
                {isVariationsGenerated && (
                  <Chip label="Generada" color="primary" size="small" variant="outlined" />
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* TEMAS */}
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Temas (A, B, C, D)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {!isMasterGenerated
                    ? "Disponible una vez generada la matriz."
                    : isVariationsGenerated
                    ? "Los temas han sido generados para todas las áreas."
                    : "Genera las variaciones del examen por área."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                {isVariationsGenerated ? (
                  <>
                    <Chip label="Generados" color="success" size="small" variant="outlined" />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={actionLoading === "delete-variations"}
                      onClick={handleDeleteVariations}
                    >
                      {actionLoading === "delete-variations"
                        ? <CircularProgress size={16} />
                        : "Eliminar temas"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!isMasterGenerated || actionLoading === "variations"}
                    onClick={handleGenerateVariations}
                  >
                    {actionLoading === "variations"
                      ? <CircularProgress size={16} color="inherit" />
                      : "Generar temas"}
                  </Button>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* TABLA DE DESCARGAS */}
      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={600} mb={2} color={!isMasterGenerated ? "text.disabled" : "text.primary"}>
        Descargas por área
      </Typography>

      <Card variant="outlined" sx={{ opacity: isMasterGenerated ? 1 : 0.45, pointerEvents: isMasterGenerated ? "auto" : "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 600 }}>Área</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>PDF Matriz</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Temas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {AREAS.map((area) => (
              <TableRow key={area.value} sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell>
                  <Typography variant="body2">{area.label}</Typography>
                </TableCell>

                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={actionLoading === `pdf-${area.value}` ? <CircularProgress size={12} /> : <DownloadIcon fontSize="small" />}
                    disabled={!isMasterGenerated || actionLoading === `pdf-${area.value}`}
                    onClick={() => handleDownloadMasterPdf(area.value)}
                    sx={{ textTransform: "none" }}
                  >
                    Descargar
                  </Button>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {["A", "B", "C", "D"].map((v) => (
                      <Button
                        key={v}
                        size="small"
                        variant="outlined"
                        disabled={!isVariationsGenerated || actionLoading === `${area.value}-${v}`}
                        onClick={() => handleDownloadVariation(area.value, v)}
                        sx={{ minWidth: 40, textTransform: "none" }}
                      >
                        {actionLoading === `${area.value}-${v}` ? <CircularProgress size={12} /> : `Tema ${v}`}
                      </Button>
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="outlined">
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default Sorter;