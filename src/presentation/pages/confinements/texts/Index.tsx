import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Breadcrumbs,
  Link,
  Paper,
  Alert,
  CircularProgress
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

// Simulación de datos - luego reemplazar con API real
const mockConfinement = {
  id: "1",
  name: "Internamiento 2024",
  total: 100,
  start_date: "2024-01-01",
  end_date: "2024-12-31"
};

const mockTexts = [
  { id: 1, block_name: "Bloque A", texts_to_do: 5, questions_per_text: 4 },
  { id: 2, block_name: "Bloque B", texts_to_do: 3, questions_per_text: 6 },
  { id: 3, block_name: "Bloque C", texts_to_do: 2, questions_per_text: 8 }
];

export default function TextsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confinement, setConfinement] = useState<any>(null);
  const [texts, setTexts] = useState<any[]>([]);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      setLoading(true);
      try {
        // Aquí irían las llamadas a la API real
        setTimeout(() => {
          setConfinement(mockConfinement);
          setTexts(mockTexts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          onClick={() => navigate("/confinements")}
          sx={{ cursor: 'pointer', textDecoration: 'none' }}
        >
          Internamientos
        </Link>
        <Typography color="text.primary">
          Textos - {confinement?.name}
        </Typography>
      </Breadcrumbs>

      {/* Botón de volver */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/confinements")}
        sx={{ mb: 3 }}
      >
        Volver a Internamientos
      </Button>

      {/* Título */}
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 2
        }}
      >
        📝 Gestión de Textos
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        {confinement?.name} - Configuración de textos por bloque
      </Typography>

      {/* Lista de textos */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configuraciones de Texto
        </Typography>
        
        {texts.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No hay configuraciones de texto para este internamiento.
          </Alert>
        ) : (
          texts.map((text) => (
            <Paper key={text.id} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {text.block_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Textos a realizar: {text.texts_to_do}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Preguntas por texto: {text.questions_per_text}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="medium">
                  Total: {text.texts_to_do * text.questions_per_text} preguntas
                </Typography>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* Acciones */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate("/confinements")}>
          Cancelar
        </Button>
        <Button variant="contained">
          Editar Configuraciones
        </Button>
      </Box>
    </Container>
  );
}