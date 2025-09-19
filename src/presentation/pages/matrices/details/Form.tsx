import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
} from "@mui/material";

// Datos de prueba para bloques
const mockBlocks = [
  { id: 1, name: "Álgebra", parent_block_id: null },
  { id: 2, name: "Geometría", parent_block_id: null },
  { id: 3, name: "Trigonometría", parent_block_id: null },
  { id: 4, name: "Aritmética", parent_block_id: null },
  { id: 5, name: "Ecuaciones", parent_block_id: 1 },
  { id: 6, name: "Polinomios", parent_block_id: 1 },
  { id: 7, name: "Geometría Plana", parent_block_id: 2 },
  { id: 8, name: "Geometría Espacial", parent_block_id: 2 },
];

export default function MatrixDetailForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    block_id: "",
    questions_count: 0,
    alternatives_count: 0,
  });

  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular envío de formulario
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    }, 1500);
  };

  const getChildren = (parentId?: number) =>
    mockBlocks.filter((b) => (parentId ? b.parent_block_id === parentId : !b.parent_block_id));

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 6,
          background: "linear-gradient(145deg, #f9f9f9, #ffffff)",
        }}
      >
        <CardHeader
          title={
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", textAlign: "center" }}>
              Crear Detalle de Matriz
            </Typography>
          }
        />
        <Divider />
        <CardContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Detalle creado exitosamente (simulación)
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* selects de bloques en cascada */}
            <Box sx={{ mb: 3 }}>
              <TextField
                select
                label="Nivel 1"
                value={selectedPath[0] || ""}
                onChange={(e) => {
                  const value = e.target.value ? [Number(e.target.value)] : [];
                  setSelectedPath(value);
                }}
                fullWidth
                sx={{ mb: 3 }}
              >
                <MenuItem value="">Selecciona un bloque</MenuItem>
                {getChildren().map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>

              {selectedPath.map((blockId, idx) => {
                const children = getChildren(blockId);
                if (!children.length) return null;
                return (
                  <FormControl fullWidth sx={{ mb: 3 }} key={`level-${idx + 2}`}>
                    <InputLabel>{`Nivel ${idx + 2}`}</InputLabel>
                    <Select
                      value={selectedPath[idx + 1] || ""}
                      onChange={(e) => {
                        const newPath = selectedPath.slice(0, idx + 1);
                        if (e.target.value) newPath.push(Number(e.target.value));
                        setSelectedPath(newPath);
                      }}
                    >
                      <MenuItem value="">Selecciona un bloque</MenuItem>
                      {children.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              })}
            </Box>

            {/* Preguntas */}
            <TextField
              fullWidth
              type="number"
              label="Cantidad de Preguntas"
              value={form.questions_count}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  questions_count: parseInt(e.target.value || "0"),
                }))
              }
              sx={{ mb: 3 }}
              variant="outlined"
            />

            {/* Alternativas */}
            <TextField
              fullWidth
              type="number"
              label="Cantidad de Alternativas"
              value={form.alternatives_count}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  alternatives_count: parseInt(e.target.value || "0"),
                }))
              }
              sx={{ mb: 3 }}
              variant="outlined"
            />

            {/* botones */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                size="large"
                sx={{ minWidth: 120, borderRadius: 2 }}
                color="secondary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                sx={{ minWidth: 120, borderRadius: 2, backgroundColor: "#1976d2" }}
              >
                {loading ? "Guardando..." : "Crear"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}