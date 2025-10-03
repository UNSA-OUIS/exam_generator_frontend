// presentation/pages/confinements/requirements/List.tsx
import { useEffect, useState } from "react";
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
  CircularProgress,
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
import { GetConfinementBlocks } from "../../../../application/confinement/GetConfinementBlocks";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementBlock";
import type { ConfinementBlock } from "../../../../models/ConfinementBlock";
import Form from './Form';

export default function RequirementsList() {
  const navigate = useNavigate();
  const { confinementId } = useParams<{ confinementId: string }>();
  const [rows, setRows] = useState<ConfinementBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [confinementName, setConfinementName] = useState("");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    confinementBlock: ConfinementBlock | null;
  }>({ open: false, confinementBlock: null });

  const load = async (id: string) => {
    setLoading(true);
    try {
      const data = await GetConfinementBlocks(id);
      setRows(data);
      
      // Obtener el nombre del confinamiento desde el primer bloque (si existe)
      if (data.length > 0 && data[0].confinement) {
        setConfinementName(data[0].confinement.name);
      }
    } catch (err) {
      console.error("Error loading confinement blocks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (confinementId) {
      load(confinementId);
    }
  }, [confinementId]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("¿Eliminar este requerimiento?")) return;
    try {
      await DeleteConfinementBlock(id);
      setRows(rows.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  const handleEditClick = (confinementBlock: ConfinementBlock) => {
    setEditDialog({ open: true, confinementBlock });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, confinementBlock: null });
  };

  const handleEditSuccess = async () => {
    if (confinementId) {
      await load(confinementId);
    }
    handleEditClose();
  };

  const handleBack = () => {
    navigate("/confinements");
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
          Internamientos
        </Link>
        <Typography color="text.primary">
          Requerimientos {confinementName && `- ${confinementName}`}
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
          📋 Requerimientos {confinementName && `- ${confinementName}`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`new`)}
        >
          Agregar Requerimiento
        </Button>
      </Box>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Bloque</TableCell>
                <TableCell>Preguntas a Realizar</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.block ? row.block.name : ""}</TableCell>
                  <TableCell>{row.questions_to_do}</TableCell>
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
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay requerimientos para este internamiento
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate("new")}
                      sx={{ mt: 1 }}
                    >
                      Agregar el primer requerimiento
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Dialog para editar requerimiento */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Editar Requerimiento
        </DialogTitle>
        <DialogContent>
          {editDialog.confinementBlock && (
            <Form
              initialId={editDialog.confinementBlock.id?.toString()}
              initialConfinementId={confinementId}
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
    </Container>
  );
}
