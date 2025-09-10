import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Confinement } from "../../../models/Confinement";
import { GetConfinements } from "../../../application/confinement/GetConfinements";
import { DeleteConfinement } from "../../../application/confinement/DeleteConfinement";
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
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,   // 🔹 Icono para requerimientos
  Description as DescriptionIcon  // 🔹 Icono para textos
} from "@mui/icons-material";
import Form from './Form';

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const [confinements, setConfinements] = useState<Confinement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    confinement: Confinement | null;
  }>({ open: false, confinement: null });
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    confinement: Confinement | null;
  }>({ open: false, confinement: null });

  const navigate = useNavigate(); // 🔹 Hook para navegación

  const fetchConfinements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetConfinements();
      setConfinements(data);
    } catch (err) {
      setError("Error al cargar los internamientos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (confinement: Confinement) => {
    setDeleteDialog({ open: true, confinement });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.confinement) return;

    setDeleting(true);
    try {
      await DeleteConfinement(deleteDialog.confinement.id);
      await fetchConfinements();
      setDeleteDialog({ open: false, confinement: null });
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al eliminar el internamiento");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, confinement: null });
  };

  const handleEditClick = (confinement: Confinement) => {
    setEditDialog({ open: true, confinement });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, confinement: null });
  };

  const handleEditSuccess = async () => {
    await fetchConfinements();
    handleEditClose();
  };

  // 🔹 Función para navegar a requerimientos
  const handleRequirementsClick = (confinement: Confinement) => {
    navigate(`/confinements/${confinement.id}/requirements`);
  };

  // 🔹 Función para navegar a textos
  const handleTextsClick = (confinement: Confinement) => {
    navigate(`/confinements/${confinement.id}/texts`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useImperativeHandle(ref, () => ({
    reload: fetchConfinements,
  }));

  useEffect(() => {
    fetchConfinements();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando internamientos...
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
            <Button color="inherit" size="small" onClick={fetchConfinements}>
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
            Lista de internamientos
          </Typography>
          <Chip 
            label={`${confinements.length} internamiento${confinements.length !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {confinements.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay internamientos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea tu primer internamiento usando el formulario de arriba
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Nombre
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: 100 }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: 150 }}>
                  Fecha Inicio
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: 150 }}>
                  Fecha Fin
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: 150 }}>
                  Creado
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ fontWeight: 600, fontSize: '0.875rem', minWidth: 240 }} // 🔹 Aumentado el ancho
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {confinements.map((confinement, index) => (
                <TableRow 
                  key={confinement.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover' 
                    },
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'grey.25'
                  }}
                >
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {confinement.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {confinement.total}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {formatDate(confinement.start_date)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {formatDate(confinement.end_date)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {formatDate(confinement.created_at)}
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
                      
                      {/* 🔹 Icono: Editar Requerimientos */}
                      <Tooltip title="Editar requerimientos">
                        <IconButton 
                          size="small"
                          onClick={() => handleRequirementsClick(confinement)}
                          sx={{ 
                            color: 'secondary.main',
                            '&:hover': { backgroundColor: 'secondary.lighter' }
                          }}
                        >
                          <AssignmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* 🔹 Icono: Editar Textos */}
                      <Tooltip title="Editar textos">
                        <IconButton 
                          size="small"
                          onClick={() => handleTextsClick(confinement)}
                          sx={{ 
                            color: 'success.main',
                            '&:hover': { backgroundColor: 'success.lighter' }
                          }}
                        >
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Editar internamiento">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditClick(confinement)}
                          sx={{ 
                            color: 'warning.main',
                            '&:hover': { backgroundColor: 'warning.lighter' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Eliminar internamiento">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteClick(confinement)}
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
            ¿Estás seguro de que deseas eliminar el internamiento{' '}
            <strong>"{deleteDialog.confinement?.name}"</strong>?
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

      {/* Dialog para editar internamiento */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Editar internamiento
        </DialogTitle>
        <DialogContent>
          {editDialog.confinement && (
            <Form
                confinementId={editDialog.confinement.id}
                initialName={editDialog.confinement.name}
                initialTotal={editDialog.confinement.total}
                initialStartDate={new Date(editDialog.confinement.start_date)}
                initialEndDate={new Date(editDialog.confinement.end_date)}
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