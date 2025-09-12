// presentation/pages/confinements/texts/List.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Paper
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import type { ConfinementText } from "../../../../models/ConfinementText";
import { GetConfinementTexts } from "../../../../application/confinement/GetConfinementTexts";
import { DeleteConfinementText } from "../../../../application/confinement/DeleteConfinementText";

const ConfinementTextsList = () => {
  const { id } = useParams<{ id: string }>(); // 🔹 id es string (UUID)
  const [texts, setTexts] = useState<ConfinementText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTexts = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await GetConfinementTexts(id); // 🔹 Pasa el UUID directamente
      setTexts(data);
    } catch (err) {
      setError("Error al cargar los textos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (textId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este texto?")) return;
    
    try {
      await DeleteConfinementText(textId);
      await fetchTexts();
    } catch (err: any) {
      setError("Error al eliminar el texto");
    }
  };

  useEffect(() => {
    fetchTexts();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando textos...
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
            <Button color="inherit" size="small" onClick={fetchTexts}>
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/confinements"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Volver a Internamientos
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Textos del Internamiento
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to={`/confinements/${id}/texts/create`}
        >
          Agregar Texto
        </Button>
      </Box>

      {/* Contador */}
      <Chip 
        label={`${texts.length} texto${texts.length !== 1 ? 's' : ''}`}
        color="primary"
        variant="outlined"
        sx={{ mb: 2 }}
      />

      {texts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay textos configurados para este internamiento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Agrega tu primer texto usando el botón de arriba
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Bloque</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Textos a Realizar</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Preguntas por Texto</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Total Preguntas</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {texts.map((text) => (
                <TableRow key={text.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {text.block?.name || `Bloque ${text.block_id}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={text.texts_to_do} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={text.questions_per_text} color="secondary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={text.texts_to_do * text.questions_per_text} 
                      color="success" 
                      variant="filled" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Editar texto">
                        <IconButton
                          component={Link}
                          to={`/confinements/${id}/texts/edit/${text.id}`}
                          color="warning"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar texto">
                        <IconButton
                          onClick={() => handleDelete(text.id)}
                          color="error"
                        >
                          <DeleteIcon />
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
    </Box>
  );
};

export default ConfinementTextsList;