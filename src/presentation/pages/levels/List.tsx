import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Level } from "../../../models/Level";
import type { Block } from "../../../models/Block";
import { GetLevels } from "../../../application/level/GetLevels";
import { DeleteLevel } from "../../../application/level/DeleteLevel";
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
} from "@mui/icons-material";
import Form from "./Form";

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    level: Level | null;
    blocks?: Block|null;
    error?: string;
  }>({ open: false, level: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    level: Level | null;
  }>({ open: false, level: null });

  const fetchLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetLevels();
      setLevels(data);
    } catch (err) {
      setError("Error al cargar los niveles");
    } finally {
      setLoading(false);
    }
  };
  console.log("este es el ref", levels);
  const handleDeleteClick = (level: Level) => {
    setDeleteDialog({ open: true, level, error: undefined });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.level) return;

    setDeleting(true);
    try {
      await DeleteLevel(deleteDialog.level.id);
      await fetchLevels();
      setDeleteDialog({ open: false, level: null });
    } catch (err: any) {
      setDeleteDialog({
        open: true,
        level: deleteDialog.level,
        error: err.response?.data?.error || "Error al eliminar el nivel",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, level: null, error: undefined });
  };

  const handleEditClick = (level: Level) => {
    setEditDialog({ open: true, level });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, level: null });
  };

  const handleEditSuccess = async () => {
    await fetchLevels();
    handleEditClose();
  };

  useImperativeHandle(ref, () => ({
    reload: fetchLevels,
  }));

  useEffect(() => {
    fetchLevels();
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
          Cargando niveles...
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
            <Button color="inherit" size="small" onClick={fetchLevels}>
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
            Lista de Niveles
          </Typography>
          <Chip
            label={`${levels.length} nivel${levels.length !== 1 ? "es" : ""}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {levels.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No hay niveles registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primer nivel usando el formulario de arriba
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 100 }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}
                >
                  Stage
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Nombre del Nivel
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 180 }}
                >
                  Creado
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 180 }}
                >
                  Actualizado
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 160 }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {levels.map((level, index) => (
                <TableRow
                  key={level.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    backgroundColor:
                      index % 2 === 0 ? "transparent" : "grey.25",
                  }}
                >
                  <TableCell
                    sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                  >
                    #{level.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {level.stage}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {level.name}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                  >
                    {new Date(level.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                  >
                    {new Date(level.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                    >
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          sx={{
                            color: "info.main",
                            "&:hover": { backgroundColor: "info.lighter" },
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar nivel">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(level)}
                          sx={{
                            color: "warning.main",
                            "&:hover": { backgroundColor: "warning.lighter" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar nivel">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(level)}
                          sx={{
                            color: "error.main",
                            "&:hover": { backgroundColor: "error.lighter" },
                          }}
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
            ¿Estás seguro de que deseas eliminar el nivel{" "}
            <strong>"{deleteDialog.level?.name}"</strong> (Stage{" "}
            {deleteDialog.level?.stage})
            
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

      {/* Dialog para editar nivel */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Nivel</DialogTitle>
        <DialogContent>
          {editDialog.level && (
            <Form
              levelId={editDialog.level.id}
              initialStage={editDialog.level.stage}
              initialName={editDialog.level.name}
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
