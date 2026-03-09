import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Matrix } from "../../../models/Matrix";
import type { Modality } from "../../../models/Modality";
import { GetMatrices } from "../../../application/matrix/GetMatrices";
import { DeleteMatrix } from "../../../application/matrix/DeleteMatrix";
import { GetModalities } from "../../../application/modality/GetModalities";
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
  Snackbar
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from "@mui/icons-material";
import Form from "./Form";

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const navigate = useNavigate();
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModalities, setLoadingModalities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; matrix: Matrix | null }>({ open: false, matrix: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; matrix: Matrix | null }>({ open: false, matrix: null });

  const getModalityName = (modalityId: number): string => {
    const modality = modalities.find(p => p.id === modalityId);
    return modality ? modality.name : `Modalidad #${modalityId}`;
  };

  const fetchMatrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetMatrices();
      setMatrices(data);
    } catch {
      setError("Error al cargar las matrices");
    } finally {
      setLoading(false);
    }
  };

  const fetchModalities = async () => {
    try {
      setLoadingModalities(true);
      const modalitiesData = await GetModalities();
      setModalities(modalitiesData);
    } finally {
      setLoadingModalities(false);
    }
  };

  const handleDeleteClick = (matrix: Matrix) => {
    setDeleteDialog({ open: true, matrix });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.matrix) return;
    setDeleting(true);
    try {
      await DeleteMatrix(deleteDialog.matrix.id);
      await fetchMatrices();
      setDeleteDialog({ open: false, matrix: null });
      setSuccessMessage("Matriz eliminada correctamente");
    } catch {
      setError("Error al eliminar la matriz");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (matrix: Matrix) => {
    setEditDialog({ open: true, matrix });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, matrix: null });
  };

  const handleEditSuccess = async () => {
    await fetchMatrices();
    setEditDialog({ open: false, matrix: null });
    setSuccessMessage("Matriz actualizada correctamente");
  };

  const handleDetailsClick = (matrix: Matrix) => {
    navigate(`/matrices/${matrix.id}/details`);
  };

  useImperativeHandle(ref, () => ({
    reload: fetchMatrices
  }));

  useEffect(() => {
    (async () => {
      await Promise.all([fetchMatrices(), fetchModalities()]);
    })();
  }, []);

  if (loading || loadingModalities) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando datos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Lista de Matrices
          </Typography>
          <Chip
            label={`${matrices.length} matriz${matrices.length !== 1 ? "ces" : ""}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {matrices.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No hay matrices registradas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primera matriz usando el formulario de arriba
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 180 }}>Matriz</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}>Alternativas</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 180 }}>Creado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 240 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matrices.map((matrix, index) => (
                <TableRow
                  key={matrix.id}
                  sx={{
                    "&:hover": { backgroundColor: "action.hover" },
                    backgroundColor: index % 2 === 0 ? "transparent" : "grey.25"
                  }}
                >
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {getModalityName(matrix.modality_id)} - {matrix.year}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {matrix.n_alternatives}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {new Date(matrix.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleDetailsClick(matrix)}
                          sx={{ color: "primary.main", "&:hover": { backgroundColor: "primary.lighter" } }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar matriz">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(matrix)}
                          sx={{ color: "warning.main", "&:hover": { backgroundColor: "warning.lighter" } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar matriz">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(matrix)}
                          sx={{ color: "error.main", "&:hover": { backgroundColor: "error.lighter" } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Snackbars */}
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Dialog eliminar */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, matrix: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la matriz del año <strong>"{deleteDialog.matrix?.year}"</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, matrix: null })} variant="outlined" disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog editar */}
      <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Matriz</DialogTitle>
        <DialogContent>
          {editDialog.matrix && (
            <Form
              matrixId={editDialog.matrix.id}
              initialYear={editDialog.matrix.year}
              initialTotalAlternatives={editDialog.matrix.n_alternatives}
              initialModalityId={editDialog.matrix.modality_id}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleEditClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default List;