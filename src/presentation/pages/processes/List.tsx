import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Process } from "../../../models/Process";
import { GetProcesses } from "../../../application/process/GetProcesses";
import { DeleteProcess } from "../../../application/process/DeleteProcess";
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
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    process: Process | null;
  }>({ open: false, process: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    process: Process | null;
  }>({ open: false, process: null });

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetProcesses();
      setProcesses(data);
    } catch (err) {
      setError("Error al cargar los procesos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (process: Process) => {
    setDeleteDialog({ open: true, process });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.process) return;

    setDeleting(true);
    try {
      await DeleteProcess(deleteDialog.process.id);
      await fetchProcesses();
      setDeleteDialog({ open: false, process: null });
    } catch (err) {
      setError("Error al eliminar el proceso");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, process: null });
  };

  const handleEditClick = (process: Process) => {
    setEditDialog({ open: true, process });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, process: null });
  };

  const handleEditSuccess = async () => {
    await fetchProcesses();
    handleEditClose();
  };

  useImperativeHandle(ref, () => ({
    reload: fetchProcesses,
  }));

  useEffect(() => {
    fetchProcesses();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando procesos...
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
            <Button color="inherit" size="small" onClick={fetchProcesses}>
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
            Lista de Procesos
          </Typography>
          <Chip 
            label={`${processes.length} proceso${processes.length !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {processes.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay procesos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primer proceso usando el formulario de arriba
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
                  Nombre del Proceso
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
              {processes.map((process, index) => (
                <TableRow 
                  key={process.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover' 
                    },
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'grey.25'
                  }}
                >
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    #{process.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {process.name}
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
                      
                      <Tooltip title="Editar proceso">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditClick(process)}
                          sx={{ 
                            color: 'warning.main',
                            '&:hover': { backgroundColor: 'warning.lighter' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Eliminar proceso">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteClick(process)}
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
            ¿Estás seguro de que deseas eliminar el proceso{' '}
            <strong>"{deleteDialog.process?.name}"</strong>?
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

      {/* Dialog para editar proceso */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Editar Proceso
        </DialogTitle>
        <DialogContent>
          {editDialog.process && (
            <Form
              processId={editDialog.process.id}
              initialName={editDialog.process.name}
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