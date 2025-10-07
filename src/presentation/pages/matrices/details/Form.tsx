import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  CircularProgress,
} from "@mui/material";
import { createMatrixDetail, updateMatrixDetail, getMatrixDetail } from "../../../../infrastructure/api/MatrixDetailApi";
import { getBlocks } from "../../../../infrastructure/api/BlockApi";
import type { MatrixDetail } from "../../../../models/MatrixDetail";
import type { Block } from "../../../../models/Block";

export default function MatrixDetailForm() {
  const navigate = useNavigate();
  const { matrixId, id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [form, setForm] = useState({
    block_id: "",
    area: "TODAS" as MatrixDetail['area'],
    difficulty: "MEDIO" as MatrixDetail['difficulty'],
    questions_required: 1,
    questions_to_do: 0,
  });

  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // Cargar bloques y datos existentes si es edición
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Cargar bloques
        const blocksData = await getBlocks();
        setBlocks(blocksData);

        // Si es edición, cargar el detalle existente
        if (id) {
          const existingDetail = await getMatrixDetail(parseInt(id));
          setForm({
            block_id: existingDetail.block_id.toString(),
            area: existingDetail.area,
            difficulty: existingDetail.difficulty,
            questions_required: existingDetail.questions_required,
            questions_to_do: existingDetail.questions_to_do,
          });

          
        }
      } catch (err) {
        setError("Error al cargar los datos");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);
  const getChildren = (parentId?: number) =>
    blocks.filter((b) => (parentId ? b.parent_block_id === parentId : !b.parent_block_id));

  const getBlockById = (id: number) => blocks.find(b => b.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.block_id) {
      setError("Debe seleccionar un bloque");
      return;
    }

    if (form.questions_to_do > form.questions_required) {
      setError("Las preguntas a realizar no pueden ser mayores que las requeridas");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = {
        matrix_id: parseInt(matrixId!),
        block_id: parseInt(form.block_id),
        area: form.area,
        difficulty: form.difficulty,
        questions_required: form.questions_required,
        questions_to_do: form.questions_to_do,
      };

      if (id) {
        // Actualizar detalle existente
        await updateMatrixDetail(parseInt(id), formData);
      } else {
        // Crear nuevo detalle
        await createMatrixDetail(formData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/matrices/${matrixId}/details`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el detalle");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSelect = (level: number, blockId: number | '') => {
    const newPath = selectedPath.slice(0, level);
    
    if (blockId) {
      newPath.push(blockId);
      setSelectedPath(newPath);
      
      // Actualizar el block_id del formulario con el último bloque seleccionado
      if (level === newPath.length - 1) {
        setForm(prev => ({ ...prev, block_id: blockId.toString() }));
      }
    } else {
      setSelectedPath(newPath);
      setForm(prev => ({ ...prev, block_id: "" }));
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando datos...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
              {id ? "Editar Detalle de Matriz" : "Crear Detalle de Matriz"}
            </Typography>
          }
        />
        <Divider />
        <CardContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Detalle {id ? "actualizado" : "creado"} exitosamente
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Selects de bloques en cascada */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Selección de Bloque
              </Typography>
              
              {/* Nivel 1 - Bloques raíz */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Nivel 1 - Bloque Principal</InputLabel>
                <Select
                  value={selectedPath[0] || ""}
                  onChange={(e) => handleBlockSelect(0, e.target.value as number | '')}
                  label="Nivel 1 - Bloque Principal"
                >
                  <MenuItem value="">Selecciona un bloque principal</MenuItem>
                  {getChildren().map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.code} - {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Bloques hijos en cascada */}
              {selectedPath.map((blockId, index) => {
                const children = getChildren(blockId);
                if (!children.length) return null;

                return (
                  <FormControl fullWidth sx={{ mb: 2 }} key={`level-${index + 2}`}>
                    <InputLabel>{`Nivel ${index + 2} - Sub-bloque`}</InputLabel>
                    <Select
                      value={selectedPath[index + 1] || ""}
                      onChange={(e) => handleBlockSelect(index + 1, e.target.value as number | '')}
                      label={`Nivel ${index + 2} - Sub-bloque`}
                    >
                      <MenuItem value="">Selecciona un sub-bloque</MenuItem>
                      {children.map((block) => (
                        <MenuItem key={block.id} value={block.id}>
                          {block.code} - {block.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              })}

              {/* Mostrar bloque seleccionado */}
              {form.block_id && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Bloque seleccionado: {getBlockById(parseInt(form.block_id))?.name}
                </Alert>
              )}
            </Box>

            {/* Área y Dificultad en línea */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={form.area}
                  onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value as MatrixDetail['area'] }))}
                  label="Área"
                >
                  <MenuItem value="TODAS">Todas las áreas</MenuItem>
                  <MenuItem value="INGENIERIAS">Ingenierías</MenuItem>
                  <MenuItem value="BIOMEDICAS">Biomédicas</MenuItem>
                  <MenuItem value="SOCIALES">Sociales</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  value={form.difficulty}
                  onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value as MatrixDetail['difficulty'] }))}
                  label="Dificultad"
                >
                  <MenuItem value="FACIL">Fácil</MenuItem>
                  <MenuItem value="MEDIO">Medio</MenuItem>
                  <MenuItem value="DIFICIL">Difícil</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Preguntas Requeridas y a Realizar en línea */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Preguntas Requeridas"
                value={form.questions_required}
                onChange={(e) => setForm(prev => ({ ...prev, questions_required: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 1, max:form.questions_to_do || undefined }}
                helperText={`Máximo: ${form.questions_to_do}`}
        
                required
              />

              <TextField
                fullWidth
                type="number"
                label="Preguntas a Realizar"
                value={form.questions_to_do}
                onChange={(e) => setForm(prev => ({ ...prev, questions_to_do: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0 }}
                required
              />
            </Box>

            {/* Botones */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/matrices/${matrixId}/details`)}
                size="large"
                sx={{ minWidth: 120, borderRadius: 2 }}
                color="secondary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !form.block_id}
                size="large"
                sx={{ minWidth: 120, borderRadius: 2 }}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Guardando..." : id ? "Actualizar" : "Crear"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}