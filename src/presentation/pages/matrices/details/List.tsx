import { useState } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

// Datos de prueba
const mockMatrixDetails = [
  { id: 1, block: { name: "Álgebra" }, questions_count: 10, alternatives_count: 4 },
  { id: 2, block: { name: "Geometría" }, questions_count: 8, alternatives_count: 5 },
  { id: 3, block: { name: "Trigonometría" }, questions_count: 12, alternatives_count: 4 },
  { id: 4, block: { name: "Aritmética" }, questions_count: 15, alternatives_count: 3 },
];

export default function MatrixDetailsList() {
  const navigate = useNavigate();
  const { matrixId } = useParams<{ matrixId: string }>();
  const [rows, setRows] = useState(mockMatrixDetails);
  const [matrixName] = useState("2023");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    matrixDetail: any | null;
  }>({ open: false, matrixDetail: null });

  const handleDelete = (id: number) => {
    if (window.confirm("¿Eliminar este detalle?")) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const handleEditClick = (matrixDetail: any) => {
    setEditDialog({ open: true, matrixDetail });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, matrixDetail: null });
  };

  const handleEditSuccess = () => {
    // Simular éxito al editar
    handleEditClose();
    alert("Detalle actualizado con éxito (simulación)");
  };

  const handleBack = () => {
    navigate("/matrices");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs para navegación */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          onClick={handleBack}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <ArrowBackIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Matrices
        </Link>
        <Typography color="text.primary">
          Detalles {matrixName && `- Matriz ${matrixName}`}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">
          📋 Detalles {matrixName && `- Matriz ${matrixName}`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`new`)}
        >
          Agregar Detalle
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Bloque</TableCell>
              <TableCell>Preguntas</TableCell>
              <TableCell>Alternativas</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.block.name}</TableCell>
                <TableCell>{row.questions_count}</TableCell>
                <TableCell>{row.alternatives_count}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(row)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(row.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay detalles para esta matriz
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("new")}
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

      {/* Dialog para editar detalle */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Editar Detalle
        </DialogTitle>
        <DialogContent>
          {editDialog.matrixDetail && (
            <Typography>
              Formulario de edición para el detalle #{editDialog.matrixDetail.id}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleEditClose}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleEditSuccess}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}