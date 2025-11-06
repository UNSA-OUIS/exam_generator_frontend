// pages/exams/List.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Exam } from "../../../models/Exam";
import {
  generateMaster,
  generateMasterPdf,
  generateVariations,
  downloadVariationPdf
} from "../../../infrastructure/api/MasterApi";
import { GetExams } from "../../../application/exam/GetExams";
import { DeleteExam } from "../../../application/exam/DeleteExam";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import Form from "./Form";

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    exam: Exam | null;
    error?: string;
  }>({ open: false, exam: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    exam: Exam | null;
  }>({ open: false, exam: null });
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    exam: Exam | null;
  }>({ open: false, exam: null });
  const [themesDialog, setThemesDialog] = useState<{
    open: boolean;
    exam: Exam | null;
  }>({ open: false, exam: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetExams();
      setExams(data);
    } catch (err) {
      setError("Error al cargar los exámenes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (exam: Exam) => {
    setDeleteDialog({ open: true, exam, error: undefined });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.exam) return;

    setDeleting(true);
    try {
      await DeleteExam(deleteDialog.exam.id);
      await fetchExams();
      setDeleteDialog({ open: false, exam: null });
    } catch (err: any) {
      setDeleteDialog({
        open: true,
        exam: deleteDialog.exam,
        error: err.response?.data?.error || "Error al eliminar el examen",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateMasterPdf = async (examId: string, area: string) => {
    try {
      setActionLoading('masterPdf');
      console.log("Generando Master PDF...");
      await generateMasterPdf(examId, area);
    } catch (error: any) {
      console.error("Error al generar Master PDF:", error);
      alert("❌ Error al generar el PDF del Master");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateMaster = async (examId: string) => {
  try {
    setActionLoading('generateMaster');
    console.log("✅ Iniciando generación de master...");
    
    const response = await generateMaster(examId);
    console.log("✅ Respuesta completa:", response);
    
    // Verifica la estructura de la respuesta
    if (response && response.success) {
      alert(response.message || "✅ Master generado exitosamente");
    } else {
      alert(`❌ Respuesta inesperada: ${JSON.stringify(response)}`);
    }
    
  } catch (error: any) {
    console.error("❌ Error completo:", error);
    console.error("❌ Response data:", error.response?.data);
    console.error("❌ Status:", error.response?.status);
    
    // Mostrar mensaje más específico
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

  const handleGenerateVariations = async (examId: string) => {
    try {
      setActionLoading('generateVariations');

      console.log("Generando variaciones para examId:", examId);

      const { data } = await generateVariations(examId);

      if (data.success) {
        alert(data.message || "✅ Variaciones generadas exitosamente");
        await fetchExams(); // Recargar la lista de exámenes
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

  const handleDownloadVariation = async (examId: string, area: string, variation: string) => {
    try {
      setActionLoading(`downloadVariation-${variation}`);
      console.log("Descargando variación:", variation);
      await downloadVariationPdf(examId, area, variation);

      // Abrir en nueva ventana/pestaña
      // La función downloadVariationPdf ya maneja la descarga automática
    } catch (error: any) {
      console.error("Error al descargar variación:", error);
      alert("❌ Error al descargar la variación");
    } finally {
      setActionLoading(null);
    }
  };

  const handleThemesClick = (exam: Exam) => {
    setThemesDialog({ open: true, exam });
  };

  const handleThemesClose = () => {
    setThemesDialog({ open: false, exam: null });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, exam: null, error: undefined });
  };

  const handleEditClick = (exam: Exam) => {
    setEditDialog({ open: true, exam });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, exam: null });
  };

  const handleEditSuccess = async () => {
    await fetchExams();
    handleEditClose();
  };

  const handleViewClick = (exam: Exam) => {
    setViewDialog({ open: true, exam });
  };

  const handleViewClose = () => {
    setViewDialog({ open: false, exam: null });
  };

  useImperativeHandle(ref, () => ({
    reload: fetchExams,
  }));

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando exámenes...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchExams}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ p: 3, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Lista de Exámenes
          </Typography>
          <Chip
            label={`${exams.length} examen${exams.length !== 1 ? "es" : ""}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {exams.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No hay exámenes registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primer examen usando el formulario de arriba
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}>
                  Matrix ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Descripción
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}>
                  Temas
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 180 }}>
                  Creado
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 180 }}>
                  Actualizado
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 250 }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.map((exam, index) => (
                <TableRow
                  key={exam.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    backgroundColor: index % 2 === 0 ? "transparent" : "grey.25",
                  }}
                >
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {exam.matrix_id}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {exam.description}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {exam.total_variations}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {new Date(exam.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {new Date(exam.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: 'wrap' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewClick(exam)}
                          sx={{
                            color: "info.main",
                            "&:hover": { backgroundColor: "info.lighter" },
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar examen">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(exam)}
                          sx={{
                            color: "warning.main",
                            "&:hover": { backgroundColor: "warning.lighter" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar examen">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(exam)}
                          sx={{
                            color: "error.main",
                            "&:hover": { backgroundColor: "error.lighter" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Botones de generación y descarga */}
                      <Box sx={{ display: "flex", gap: 1, flexWrap: 'wrap' }}>
                        {/* Botón Generar Master */}
                        <Tooltip title="Generar Master">
                          <Button
                            variant="outlined"
                            size="small"
                            color="secondary"
                            disabled={actionLoading === 'generateMaster'}
                            onClick={() => handleGenerateMaster(exam.id.toString())}
                          >
                            {actionLoading === 'generateMaster' ? <CircularProgress size={16} /> : "Generar"}
                          </Button>
                        </Tooltip>

                        {/* Botón PDF Master */}
                        <Tooltip title="Generar PDF Master">
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={actionLoading === 'masterPdf'}
                            onClick={() => handleGenerateMasterPdf(exam.id.toString(), "UNICA")}
                          >
                            {actionLoading === 'masterPdf' ? <CircularProgress size={16} /> : "Master"}
                          </Button>
                        </Tooltip>

                        {/* Botón Generar Variaciones */}
                        <Tooltip title="Generar Variaciones">
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            disabled={actionLoading === 'generateVariations'}
                            onClick={() => handleGenerateVariations(exam.id.toString())}
                          >
                            {actionLoading === 'generateVariations' ? <CircularProgress size={16} /> : "Generar temas"}
                          </Button>
                        </Tooltip>

                        {/* Botón Descargar Temas */}
                        <Tooltip title="Descargar Temas">
                          <Button
                            variant="contained"
                            size="small"
                            color="warning"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleThemesClick(exam)}
                          >
                            Temas
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {deleteDialog.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteDialog.error}
            </Alert>
          ) : null}
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el examen{" "}
            <strong>"{deleteDialog.exam?.description}"</strong> (Matrix ID:{" "}
            {deleteDialog.exam?.matrix_id})?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar examen */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Examen</DialogTitle>
        <DialogContent>
          {editDialog.exam && (
            <Form
              examId={editDialog.exam.id}
              initialMatrixId={editDialog.exam.matrix_id}
              initialDescription={editDialog.exam.description}
              initialTotalVariations={editDialog.exam.total_variations}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleEditClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles del examen */}
      <Dialog
        open={viewDialog.open}
        onClose={handleViewClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Detalles del Examen</DialogTitle>
        <DialogContent>
          {viewDialog.exam && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>ID:</strong> #{viewDialog.exam.id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Matrix ID:</strong> {viewDialog.exam.matrix_id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>User ID:</strong> {viewDialog.exam.user_id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Descripción:</strong> {viewDialog.exam.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Variaciones:</strong> {viewDialog.exam.total_variations}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Creado:</strong> {new Date(viewDialog.exam.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Actualizado:</strong> {new Date(viewDialog.exam.updated_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleViewClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para descargar temas */}
      <Dialog
        open={themesDialog.open}
        onClose={handleThemesClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Descargar Temas - {themesDialog.exam?.description}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona el tema que deseas visualizar. Cada tema se abrirá en una nueva ventana.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {['A', 'B', 'C', 'D'].map((theme) => (
              <Button
                key={theme}
                variant="contained"
                fullWidth
                size="large"
                color="primary"
                disabled={actionLoading === `downloadVariation-${theme}`}
                onClick={() => {
                  if (themesDialog.exam) {
                    handleDownloadVariation(
                      themesDialog.exam.id.toString(),
                      "UNICA",
                      theme
                    );
                  }
                }}
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
                {actionLoading === `downloadVariation-${theme}` ? 'Abriendo...' : `Abrir Tema ${theme}`}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleThemesClose} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default List;