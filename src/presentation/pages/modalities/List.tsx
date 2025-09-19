import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Modality } from "../../../models/Modality";
import { GetModalities } from "../../../application/modality/GetModalities";
import { DeleteModality } from "../../../application/modality/DeleteModality";
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
  Tooltip
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from "@mui/icons-material";
import Form from './Form';

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    modality: Modality | null;
  }>({ open: false, modality: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    modality: Modality | null;
  }>({ open: false, modality: null });

  const fetchModalities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetModalities();
      setModalities(data);
    } catch (err) {
      setError("Error al cargar los modalidades");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (modality: Modality) => {
    setDeleteDialog({ open: true, modality });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.modality) return;

    setDeleting(true);
    try {
      await DeleteModality(deleteDialog.modality.id);
      await fetchModalities();
      setDeleteDialog({ open: false, modality: null });
    } catch (err) {
      setError("Error al eliminar el Modalidad");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, modality: null });
  };

  const handleEditClick = (modality: Modality) => {
    setEditDialog({ open: true, modality });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, modality: null });
  };

  const handleEditSuccess = async () => {
    await fetchModalities();
    handleEditClose();
  };

  useImperativeHandle(ref, () => ({
    reload: fetchModalities,
  }));

  useEffect(() => {
    fetchModalities();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando modalidades...
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
            <Button color="inherit" size="small" onClick={fetchModalities}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Lista de modalidades
          </Typography>
          <Chip 
            label={`${modalities.length} Modalidad${modalities.length !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {modalities.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay modalidades registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primer Modalidad usando el formulario de arriba
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Nombre del Modalidad
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ fontWeight: 600, fontSize: '0.875rem', minWidth: 160 }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modalities.map((modality, index) => (
                <TableRow 
                  key={modality.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover' 
                    },
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'grey.25'
                  }}
                >
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    #{modality.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {modality.name}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small"
                          sx={{ 
                            color: 'info.main',
                            '&:hover': { backgroundColor: 'info.lighter' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Editar Modalidad">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditClick(modality)}
                          sx={{ 
                            color: 'warning.main',
                            '&:hover': { backgroundColor: 'warning.lighter' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Eliminar Modalidad">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteClick(modality)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { backgroundColor: 'error.lighter' }
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
            ¿Estás seguro de que deseas eliminar el Modalidad{' '}
            <strong>"{deleteDialog.modality?.name}"</strong>?
            Esta acción no se puede deshacer.
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
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar Modalidad */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Editar Modalidad
        </DialogTitle>
        <DialogContent>
          {editDialog.modality && (
            <Form
              modalityId={editDialog.modality.id}
              initialName={editDialog.modality.name}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleEditClose}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default List;