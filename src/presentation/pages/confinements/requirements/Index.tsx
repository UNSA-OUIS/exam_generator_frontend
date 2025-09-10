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
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton
} from "@mui/material";
import { 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

// Simulación de datos de bloques por nivel
const mockBlocksByLevel = {
  1: [
    { id: 1, name: "Matemáticas" },
    { id: 2, name: "Ciencias" },
    { id: 3, name: "Lenguaje" }
  ],
  2: [
    { id: 4, name: "Álgebra" },
    { id: 5, name: "Geometría" },
    { id: 6, name: "Aritmética" }
  ],
  3: [
    { id: 7, name: "Ecuaciones" },
    { id: 8, name: "Polinomios" },
    { id: 9, name: "Funciones" }
  ],
  4: [
    { id: 10, name: "Derivadas" },
    { id: 11, name: "Integrales" },
    { id: 12, name: "Límites" }
  ],
  5: [
    { id: 13, name: "Cálculo I" },
    { id: 14, name: "Cálculo II" },
    { id: 15, name: "Cálculo III" }
  ]
};

interface RequirementRow {
  id: number;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
  questions: number;
}

export default function RequirementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confinement, setConfinement] = useState<any>(null);
  const [rows, setRows] = useState<RequirementRow[]>([
    { id: 1, level1: '', level2: '', level3: '', level4: '', level5: '', questions: 0 }
  ]);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      setLoading(true);
      try {
        // Aquí irían las llamadas a la API real
        setTimeout(() => {
          setConfinement({
            id: id,
            name: `Internamiento ${id}`,
            total: 100,
            start_date: "2024-01-01",
            end_date: "2024-12-31"
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const addRow = () => {
    setRows([...rows, { 
      id: Date.now(), 
      level1: '', 
      level2: '', 
      level3: '', 
      level4: '', 
      level5: '', 
      questions: 0 
    }]);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: number, field: keyof RequirementRow, value: string | number) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = () => {
    console.log("Requerimientos a guardar:", rows);
    // Aquí iría la lógica para guardar en la API
    alert("Requerimientos guardados exitosamente");
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
          Requerimientos - {confinement?.name}
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
        📋 Gestión de Requerimientos por Bloques
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        {confinement?.name} - Configure los bloques y preguntas requeridas
      </Typography>

      {/* Encabezados de la tabla */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.100' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={2}>
            <Typography variant="subtitle2" fontWeight="bold">
              Bloque Nivel 1
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" fontWeight="bold">
              Bloque Nivel 2
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" fontWeight="bold">
              Bloque Nivel 3
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" fontWeight="bold">
              Bloque Nivel 4
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" fontWeight="bold">
              Bloque Nivel 5
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              Preguntas
            </Typography>
          </Grid>
          <Grid item xs={1}>
            {/* Espacio para el botón de eliminar */}
          </Grid>
        </Grid>
      </Paper>

      {/* Filas de requerimientos */}
      {rows.map((row, index) => (
        <Paper key={row.id} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Bloque Nivel 1 */}
            <Grid item xs={2}>
                <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Nivel 1</InputLabel>
                <Select
                  value={row.level1}
                  onChange={(e) => updateRow(row.id, 'level1', e.target.value)}
                  label="Nivel 1"
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {mockBlocksByLevel[1].map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Bloque Nivel 2 */}
            <Grid item xs={2}>
                <FormControl fullWidth size="large" sx={{ minWidth: 160 }}>
                <InputLabel>Nivel 2</InputLabel>
                <Select
                  value={row.level2}
                  onChange={(e) => updateRow(row.id, 'level2', e.target.value)}
                  label="Nivel 2"
                  disabled={!row.level1}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {mockBlocksByLevel[2].map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Bloque Nivel 3 */}
            <Grid item xs={2}>
                <FormControl fullWidth size="large" sx={{ minWidth: 160 }}>
                <InputLabel>Nivel 3</InputLabel>
                <Select
                  value={row.level3}
                  onChange={(e) => updateRow(row.id, 'level3', e.target.value)}
                  label="Nivel 3"
                  disabled={!row.level2}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {mockBlocksByLevel[3].map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Bloque Nivel 4 */}
            <Grid item xs={2}>
                <FormControl fullWidth size="large" sx={{ minWidth: 160 }}>
                <InputLabel>Nivel 4</InputLabel>
                <Select
                  value={row.level4}
                  onChange={(e) => updateRow(row.id, 'level4', e.target.value)}
                  label="Nivel 4"
                  disabled={!row.level3}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {mockBlocksByLevel[4].map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Bloque Nivel 5 */}
            <Grid item xs={2}>
            <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Nivel 5</InputLabel>
                <Select
                  value={row.level5}
                  onChange={(e) => updateRow(row.id, 'level5', e.target.value)}
                  label="Nivel 5"
                  disabled={!row.level4}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {mockBlocksByLevel[5].map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Input de preguntas */}
            <Grid item xs={1}>
              <TextField
                type="number"
                value={row.questions}
                onChange={(e) => updateRow(row.id, 'questions', parseInt(e.target.value) || 0)}
                size="small"
                fullWidth
                inputProps={{ min: 0 }}
                label="Cantidad"
              />
            </Grid>

            {/* Botón de eliminar */}
            <Grid item xs={1}>
              {rows.length > 1 && (
                <IconButton
                  onClick={() => removeRow(row.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Paper>
      ))}

      {/* Botón para agregar más filas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addRow}
          sx={{ mb: 2 }}
        >
          Agregar Otro Bloque
        </Button>
      </Box>

      {/* Resumen total */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Resumen Total
        </Typography>
        <Typography variant="body1">
          Total de preguntas requeridas: {rows.reduce((sum, row) => sum + row.questions, 0)}
        </Typography>
        <Typography variant="body1">
          Cantidad de bloques configurados: {rows.length}
        </Typography>
      </Paper>

      {/* Acciones */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate("/confinements")}
          size="large"
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          size="large"
          disabled={rows.some(row => row.questions === 0)}
        >
          Guardar Requerimientos
        </Button>
      </Box>
    </Container>
  );
}