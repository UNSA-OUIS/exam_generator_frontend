// pages/exams/List.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Exam } from "../../../models/Exam";
import { useNavigate } from "react-router-dom";
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
  Assignment as AssignmentIcon,
  Shuffle as ShuffleIcon,
} from "@mui/icons-material";
import Form from "./Form";

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const navigate = useNavigate();
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

  const handleRequirementsClick = (exam: Exam) => {
    navigate(`/exams/${exam.id}/requirements`);
  };

  const handleViewClose = () => {
    setViewDialog({ open: false, exam: null });
  };

  const handleSorterClick = (examId: string | number) => {
    navigate(`/exams/sorter/${examId}`);
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
                  sx={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 200 }}
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

                      <Tooltip title="Editar requerimientos">
                        <IconButton
                          size="small"
                          onClick={() => handleRequirementsClick(exam)}
                          sx={{
                            color: "secondary.main",
                            "&:hover": { backgroundColor: "secondary.lighter" },
                          }}
                        >
                          <AssignmentIcon fontSize="small" />
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

                      <Tooltip title="Ir al sorteador">
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<ShuffleIcon />}
                          onClick={() => handleSorterClick(exam.id)}
                          sx={{ ml: 1 }}
                        >
                          Sorteador
                        </Button>
                      </Tooltip>
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
    </Box>
  );
});

export default List;