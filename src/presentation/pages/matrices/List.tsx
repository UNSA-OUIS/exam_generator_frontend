import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Matrix } from "../../../models/Matrix";
import type { Process } from "../../../models/Process";
import { getMatrices, deleteMatrix, exportBlocks } from "../../../infrastructure/api/MatrixApi";
import { GetProcesses } from "../../../application/process/GetProcesses";
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
  List as DetailsIcon,
  Download as DownloadIcon
} from "@mui/icons-material";
import Form from "./Form";

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProcesses, setLoadingProcesses] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; matrix: Matrix | null }>({ open: false, matrix: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; matrix: Matrix | null }>({ open: false, matrix: null });

  const getProcessName = (processId: number): string => {
    const process = processes.find(p => p.id === processId);
    return process ? process.name : `Modalidad #${processId}`;
  };

  const fetchMatrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMatrices();
      setMatrices(data);
    } catch {
      setError("Error al cargar las matrices");
    } finally {
      setLoading(false);
    }
  };

  const fetchProcesses = async () => {
    try {
      setLoadingProcesses(true);
      const processesData = await GetProcesses();
      setProcesses(processesData);
    } finally {
      setLoadingProcesses(false);
    }
  };

  const handleExport = async (matrixId: number) => {
    setExporting(matrixId);
    try {
      const blob = await exportBlocks(matrixId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blocks_${matrixId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("Archivo exportado correctamente");
    } catch {
      setError("Error al exportar los bloques");
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.matrix) return;
    setDeleting(true);
    try {
      await deleteMatrix(deleteDialog.matrix.id);
      await fetchMatrices();
      setDeleteDialog({ open: false, matrix: null });
      setSuccessMessage("Matriz eliminada correctamente");
    } catch {
      setError("Error al eliminar la matriz");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = async () => {
    await fetchMatrices();
    setEditDialog({ open: false, matrix: null });
    setSuccessMessage("Matriz actualizada correctamente");
  };

  useImperativeHandle(ref, () => ({
    reload: fetchMatrices
  }));

  useEffect(() => {
    (async () => {
      await Promise.all([fetchMatrices(), fetchProcesses()]);
    })();
  }, []);

  if (loading || loadingProcesses) {
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
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 100 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}>Año</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}>Alternativas</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>Modalidad</TableCell>
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
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>#{matrix.id}</TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{matrix.year}</TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{matrix.total_alternatives}</TableCell>
                  <TableCell sx={{ fontSize: "0.875rem" }}>{getProcessName(matrix.process_id)}</TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {new Date(matrix.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" sx={{ color: "info.main", "&:hover": { backgroundColor: "info.lighter" } }}>
                          <DetailsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Exportar bloques">
                        <IconButton
                          size="small"
                          onClick={() => handleExport(matrix.id)}
                          disabled={exporting === matrix.id}
                          sx={{ color: "success.main", "&:hover": { backgroundColor: "success.lighter" } }}
                        >
                          {exporting === matrix.id ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <DownloadIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar matriz">
                        <IconButton
                          size="small"
                          onClick={() => setEditDialog({ open: true, matrix })}
                          sx={{ color: "warning.main", "&:hover": { backgroundColor: "warning.lighter" } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar matriz">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, matrix })}
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
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%" }}>
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
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, matrix: null })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Matriz</DialogTitle>
        <DialogContent>
          {editDialog.matrix && (
            <Form
              matrixId={editDialog.matrix.id}
              initialYear={editDialog.matrix.year}
              initialTotalAlternatives={editDialog.matrix.total_alternatives}
              initialProcessId={editDialog.matrix.process_id}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialog({ open: false, matrix: null })}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default List;
