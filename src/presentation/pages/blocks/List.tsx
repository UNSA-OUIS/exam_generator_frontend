import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Block } from "../../../models/Block";
import { GetBlocks } from "../../../application/block/GetBlocks";
import { DeleteBlock } from "../../../application/block/DeleteBlock";
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
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    block: Block | null;
  }>({ open: false, block: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    block: Block | null;
  }>({ open: false, block: null });

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetBlocks();
      setBlocks(data);
    } catch (err) {
      setError("Error al cargar los bloques");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (block: Block) => {
    setDeleteDialog({ open: true, block });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.block) return;

    setDeleting(true);
    try {
      await DeleteBlock(deleteDialog.block.id);
      await fetchBlocks();
      setDeleteDialog({ open: false, block: null });
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar el bloque");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, block: null });
  };

  const handleEditClick = (block: Block) => {
    setEditDialog({ open: true, block });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, block: null });
  };

  const handleEditSuccess = async () => {
    await fetchBlocks();
    handleEditClose();
  };

  useImperativeHandle(ref, () => ({
    reload: fetchBlocks,
  }));

  useEffect(() => {
    fetchBlocks();
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
          Cargando bloques...
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
            <Button color="inherit" size="small" onClick={fetchBlocks}>
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
            Lista de Bloques
          </Typography>
          <Chip
            label={`${blocks.length} bloque${blocks.length !== 1 ? "s" : ""}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {blocks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No hay bloques registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primer bloque usando el formulario de arriba
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
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 100 }}
                >
                  Código
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Nombre del Bloque
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}
                >
                  Nivel
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}
                >
                  Bloque Padre
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
              {blocks.map((block, index) => (
                <TableRow
                  key={block.id}
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
                    #{block.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {block.code}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {block.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem" }}>
                    {block.level
                      ? `${block.level.name} (Stage ${block.level.stage})`
                      : "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                  >
                    {block.parent_block_id
                      ? blocks.find((b) => b.id === block.parent_block_id)
                          ?.name || `#${block.parent_block_id}`
                      : "Ninguno"}
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

                      <Tooltip title="Editar bloque">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(block)}
                          sx={{
                            color: "warning.main",
                            "&:hover": { backgroundColor: "warning.lighter" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar bloque">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(block)}
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
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el bloque{" "}
            <strong>"{deleteDialog.block?.name}"</strong> (Código:{" "}
            {deleteDialog.block?.code})? Esta acción no se puede deshacer.
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

      {/* Dialog para editar bloque */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Bloque</DialogTitle>
        <DialogContent>
          {editDialog.block && (
            <Form
              blockId={editDialog.block.id}
              initialLevelId={editDialog.block.level_id}
              initialName={editDialog.block.name}
              initialParentBlockId={editDialog.block.parent_block_id}
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
