import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { getMatrixDetails, deleteMatrixDetail } from "../../../../infrastructure/api/MatrixDetailApi";
import { getMatrix } from "../../../../infrastructure/api/MatrixApi";
import type { MatrixDetail } from "../../../../models/MatrixDetail";
import type { Matrix } from "../../../../models/Matrix";

export default function MatrixDetailsList() {
  const navigate = useNavigate();
  const { matrixId } = useParams();
  const [details, setDetails] = useState<MatrixDetail[]>([]);
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    detail: MatrixDetail | null;
    loading?: boolean;
  }>({ open: false, detail: null });

  // Cargar detalles y datos de la matriz
  useEffect(() => {
    const fetchData = async () => {
      if (!matrixId) return;
      
      setLoading(true);
      try {
        // Cargar detalles de la matriz
        const allDetails = await getMatrixDetails();
        const matrixDetails = allDetails.filter(detail => detail.matrix_id === parseInt(matrixId));
        setDetails(matrixDetails);

        // Cargar información de la matriz
        const matrixData = await getMatrix(parseInt(matrixId));
        setMatrix(matrixData);
      } catch (err) {
        setError("Error al cargar los detalles de la matriz");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matrixId]);

  const handleDelete = async () => {
    if (!deleteDialog.detail) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));
    
    try {
      await deleteMatrixDetail(deleteDialog.detail.id);
      setDetails(prev => prev.filter(d => d.id !== deleteDialog.detail!.id));
      setDeleteDialog({ open: false, detail: null });
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al eliminar el detalle");
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEdit = (detail: MatrixDetail) => {
    navigate(`/matrices/${matrixId}/details/${detail.id}/edit`);
  };

  const handleBack = () => {
    navigate("/matrices");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'FACIL': return 'success';
      case 'MEDIO': return 'warning';
      case 'DIFICIL': return 'error';
      default: return 'default';
    }
  };

  const getAreaColor = (area: string) => {
    switch (area) {
      case 'INGENIERIAS': return 'primary';
      case 'BIOMEDICAS': return 'secondary';
      case 'SOCIALES': return 'info';
      case 'TODAS': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando detalles...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs para navegación */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          onClick={handleBack}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <ArrowBackIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Matrices
        </Link>
        <Typography color="text.primary">
          Detalles {matrix && `- ${matrix.modality?.name} ${matrix.year}`}
        </Typography>
      </Breadcrumbs>

      {/* Header con información de la matriz */}
      {matrix && (
        <Card sx={{ mb: 3, backgroundColor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Matriz: {matrix.modality?.name} - {matrix.year}
            </Typography>
            <Typography variant="body2">
              Total de alternativas: {matrix.total_alternatives} | 
              Detalles configurados: {details.length}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          📋 Detalles de Matriz
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/matrices/${matrixId}/details/new`)}
        >
          Agregar Detalle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Bloque</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Área</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Dificultad</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Preguntas Requeridas</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Preguntas a Realizar</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {details.map((detail) => (
              <TableRow 
                key={detail.id}
                sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {detail.block?.name}
                    </Typography>
                    {detail.block?.code && (
                      <Typography variant="caption" color="text.secondary">
                        Código: {detail.block.code}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={detail.area} 
                    size="small"
                    color={getAreaColor(detail.area) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={detail.difficulty} 
                    size="small"
                    color={getDifficultyColor(detail.difficulty) as any}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="medium">
                    {detail.questions_required}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="medium">
                    {detail.questions_to_do}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(detail)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, detail })}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {details.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No hay detalles configurados para esta matriz
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/matrices/${matrixId}/details/new`)}
                    sx={{ mt: 1 }}
                  >
                    Agregar el primer detalle
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, detail: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el detalle del bloque{" "}
            <strong>"{deleteDialog.detail?.block?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, detail: null })}
            variant="outlined"
            disabled={deleteDialog.loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteDialog.loading}
            startIcon={deleteDialog.loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteDialog.loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}