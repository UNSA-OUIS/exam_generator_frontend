import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Exam } from "../../../models/Exam";

import {
  generateMaster,
  deleteMaster,
  generateMasterPdf,
  generateVariations,
  deleteVariations,
  downloadVariationPdf,
} from "../../../infrastructure/api/MasterApi";

import { GetExams } from "../../../application/exam/GetExams";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Stack,
  Alert,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// ─── Toast Notification ──────────────────────────────────────────────────────

type ToastSeverity = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  severity: ToastSeverity;
}

let toastCounter = 0;

const toastConfig: Record<
  ToastSeverity,
  { bg: string; border: string; icon: JSX.Element; label: string }
> = {
  success: {
    bg: "#f0fdf4",
    border: "#16a34a",
    icon: <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 22 }} />,
    label: "Éxito",
  },
  error: {
    bg: "#fef2f2",
    border: "#dc2626",
    icon: <ErrorIcon sx={{ color: "#dc2626", fontSize: 22 }} />,
    label: "Error",
  },
  info: {
    bg: "#eff6ff",
    border: "#2563eb",
    icon: <InfoIcon sx={{ color: "#2563eb", fontSize: 22 }} />,
    label: "Info",
  },
};

const ToastContainer = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) => (
  <Box
    sx={{
      position: "fixed",
      top: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      alignItems: "center",
      pointerEvents: "none",
    }}
  >
    {toasts.map((t) => {
      const cfg = toastConfig[t.severity];
      return (
        <Box
          key={t.id}
          sx={{
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            backgroundColor: cfg.bg,
            border: `1.5px solid ${cfg.border}`,
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            minWidth: 320,
            maxWidth: 480,
            animation: "toastSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            "@keyframes toastSlideIn": {
              from: { opacity: 0, transform: "translateY(-14px) scale(0.96)" },
              to: { opacity: 1, transform: "translateY(0) scale(1)" },
            },
          }}
        >
          {cfg.icon}
          <Box flex={1}>
            <Typography
              variant="caption"
              fontWeight={700}
              color={cfg.border}
              display="block"
              lineHeight={1.2}
            >
              {cfg.label}
            </Typography>
            <Typography variant="body2" color="text.primary" lineHeight={1.4}>
              {t.message}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => onDismiss(t.id)}
            sx={{ ml: 0.5, color: "text.secondary" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    })}
  </Box>
);

const getVariationLabels = (totalVariations: number): string[] =>
  Array.from({ length: totalVariations }, (_, i) =>
    String.fromCharCode(65 + i)
  );

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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Status-based flags
  const isMastered = exam?.status === "MASTERED";
  const isVariated = exam?.status === "VARIATED";
  const isMasterGenerated = isMastered || isVariated; // master exists in both states

  const variationLabels = exam ? getVariationLabels(exam.total_variations) : [];

  const showToast = (message: string, severity: ToastSeverity = "success") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, severity }]);
    setTimeout(() => dismissToast(id), 4000);
  };

  const dismissToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchExam = async () => {
    try {
      setLoading(true);
      const data = await GetExams();
      const found = data.find((e) => e.id.toString() === examId);
      setExam(found || null);
    } catch {
      showToast("Error al cargar el examen", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExam();
  }, [examId]);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleGenerateMaster = async () => {
    if (!exam) return;
    try {
      setActionLoading("master");
      await generateMaster(exam.id.toString());
      showToast("Master generado correctamente");
      await fetchExam();
    } catch (e: any) {
      showToast(
        e.response?.data?.message || "Error al generar la Master ",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMaster = async () => {
    if (!exam) return;
    try {
      setActionLoading("delete-master");
      await deleteMaster(exam.id.toString());
      showToast("Master eliminado");
      await fetchExam();
    } catch (e: any) {
      showToast(
        e.response?.data?.message || "Error al eliminar la Master ",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateVariations = async () => {
    if (!exam) return;
    try {
      setActionLoading("variations");
      const res = await generateVariations(exam.id.toString());
      showToast(res.message || "Temas generados correctamente");
      await fetchExam();
    } catch (e: any) {
      showToast(
        e.response?.data?.message || "Error al generar temas",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVariations = async () => {
    if (!exam) return;
    try {
      setActionLoading("delete-variations");
      await deleteVariations(exam.id.toString());
      showToast("Temas eliminados");
      await fetchExam();
    } catch (e: any) {
      showToast(
        e.response?.data?.message || "Error al eliminar temas",
        "error"
      );
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
      showToast("Error al descargar PDF", "error");
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
      showToast("Error al descargar tema", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography mt={2} variant="body2" color="text.secondary">
          Cargando examen…
        </Typography>
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
    <>
      {/* ── Global toast layer ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
        {/* HEADER */}
        <Box display="flex" alignItems="center" gap={1.5} mb={4}>
          <IconButton
            onClick={() => navigate("/exams")}
            size="small"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {exam.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sorteador de examen ·{" "}
              <strong>{exam.total_variations}</strong>{" "}
              {exam.total_variations === 1 ? "tema" : "temas"}
            </Typography>
          </Box>

          
        </Box>

        {/* ACCIONES PRINCIPALES */}
        <Stack spacing={2} mb={4}>
          {/* Master*/}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: isMasterGenerated ? "primary.main" : "divider",
              borderWidth: isMasterGenerated ? 1.5 : 1,
              transition: "border-color 0.2s",
            }}
          >
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box
                display="flex"
                alignItems="flex-start"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={2}
              >
                <Box>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Master general
                    </Typography>
                    {isMasterGenerated && (
                      <CheckCircleIcon
                        sx={{ fontSize: 16, color: "primary.main" }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {isMasterGenerated
                      ? "Master generado. Puedes eliminarlo y regenerarlo cuando lo necesites."
                      : "Genera el Master base del examen para todas las áreas."}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Eliminar master: solo cuando status === MASTERED */}
                  {isMastered && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={actionLoading === "delete-master"}
                      onClick={handleDeleteMaster}
                      startIcon={
                        actionLoading === "delete-master" ? (
                          <CircularProgress size={14} />
                        ) : undefined
                      }
                    >
                      Eliminar
                    </Button>
                  )}

                  {/* Generar master: solo cuando aún no existe */}
                  {!isMasterGenerated && (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={actionLoading === "master"}
                      onClick={handleGenerateMaster}
                      startIcon={
                        actionLoading === "master" ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : undefined
                      }
                    >
                      Generar Master 
                    </Button>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* TEMAS */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: isVariated ? "success.main" : "divider",
              borderWidth: isVariated ? 1.5 : 1,
              transition: "border-color 0.2s",
              opacity: isMasterGenerated ? 1 : 0.55,
            }}
          >
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box
                display="flex"
                alignItems="flex-start"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={2}
              >
                <Box>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Temas (
                      {variationLabels.length
                        ? variationLabels.join(", ")
                        : "—"}
                      )
                    </Typography>
                    {isVariated && (
                      <CheckCircleIcon
                        sx={{ fontSize: 16, color: "success.main" }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {!isMasterGenerated
                      ? "Disponible una vez generada la Master ."
                      : isVariated
                      ? `${exam.total_variations} temas generados para todas las áreas.`
                      : `Genera las ${exam.total_variations} variaciones del examen por área.`}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Eliminar temas: solo cuando status === VARIATED */}
                  {isVariated && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={actionLoading === "delete-variations"}
                      onClick={handleDeleteVariations}
                      startIcon={
                        actionLoading === "delete-variations" ? (
                          <CircularProgress size={14} />
                        ) : undefined
                      }
                    >
                      Eliminar temas
                    </Button>
                  )}

                  {/* Generar temas: solo cuando hay master pero no temas */}
                  {isMastered && (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={actionLoading === "variations"}
                      onClick={handleGenerateVariations}
                      startIcon={
                        actionLoading === "variations" ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : undefined
                      }
                    >
                      Generar temas
                    </Button>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        {/* TABLA DE DESCARGAS */}
        <Divider sx={{ mb: 3 }} />

        <Typography
          variant="subtitle2"
          fontWeight={700}
          mb={2}
          color={!isMasterGenerated ? "text.disabled" : "text.primary"}
        >
          Descargas por área
        </Typography>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            opacity: isMasterGenerated ? 1 : 0.4,
            pointerEvents: isMasterGenerated ? "auto" : "none",
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 700, width: 140, py: 1.5 }}>
                  Área
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 140, py: 1.5 }}>
                  Master
                </TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                  Temas
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {AREAS.map((area) => (
                <TableRow
                  key={area.value}
                  sx={{
                    "&:last-child td": { border: 0 },
                    "&:hover": { backgroundColor: "grey.50" },
                    transition: "background-color 0.15s",
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {area.label}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={
                        actionLoading === `pdf-${area.value}` ? (
                          <CircularProgress size={12} />
                        ) : (
                          <DownloadIcon fontSize="small" />
                        )
                      }
                      disabled={
                        !isMasterGenerated ||
                        actionLoading === `pdf-${area.value}`
                      }
                      onClick={() => handleDownloadMasterPdf(area.value)}
                      sx={{ textTransform: "none", minWidth: 110 }}
                    >
                      Descargar
                    </Button>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                      {variationLabels.map((v) => (
                        <Button
                          key={v}
                          size="small"
                          variant="outlined"
                          color="primary"
                          disabled={
                            !isVariated ||
                            actionLoading === `${area.value}-${v}`
                          }
                          onClick={() => handleDownloadVariation(area.value, v)}
                          startIcon={
                            actionLoading === `${area.value}-${v}` ? (
                              <CircularProgress size={12} />
                            ) : (
                              <DownloadIcon sx={{ fontSize: "14px !important" }} />
                            )
                          }
                          sx={{
                            minWidth: 80,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Tema {v}
                        </Button>
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </>
  );
};

export default Sorter;