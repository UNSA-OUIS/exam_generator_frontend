import { useEffect, useState } from "react";
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
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormHelperText,
} from "@mui/material";
import { CreateMatrixRequirement } from "../../../../application/matrix/CreateMatrixRequirement";
import { UpdateMatrixRequirement } from "../../../../application/matrix/UpdateMatrixRequirement";
import { MatrixRequirementApi } from "../../../../infrastructure/api/MatrixRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { MatrixRequirement } from "../../../../models/MatrixRequirement";
import type { Block } from "../../../../models/Block";

export default function MatrixRequirementForm({ 
  initialId, 
  initialMatrixId,
  onSuccess 
}: {
  initialId?: string;
  initialMatrixId?: string;
  onSuccess?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { id: urlId, matrixId: urlMatrixId } = useParams<{ id?: string; matrixId: string }>();

  const id = initialId || urlId;
  const matrixId = initialMatrixId || urlMatrixId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(id));
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [existingRequirements, setExistingRequirements] = useState<MatrixRequirement[]>([]);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<MatrixRequirement>>({
    matrix_id: matrixId || '',
    area: "UNICA",
    block_id: undefined,
    n_questions: 0,
    parent_id: undefined,
  });

  // Cargar bloques y requerimientos existentes
  useEffect(() => {
    const loadData = async () => {
      try {
        const [blocksData, requirementsData] = await Promise.all([
          GetBlocks(),
          matrixId ? MatrixRequirementApi.getByMatrix(matrixId) : Promise.resolve([])
        ]);
        
        setBlocks(blocksData);
        setExistingRequirements(requirementsData);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error al cargar datos");
      }
    };

    loadData();
  }, [matrixId]);

  // Cargar datos del requerimiento si estamos editando
  useEffect(() => {
    if (!id) return setInitialLoading(false);
    
    (async () => {
      setInitialLoading(true);
      try {
        const data = await MatrixRequirementApi.get(Number(id));
        setForm({
          matrix_id: data.matrix_id,
          area: data.area,
          block_id: data.block_id,
          n_questions: data.n_questions,
          parent_id: data.parent_id,
        });
        
        // Si hay un block_id, establecer el path
        if (data.block_id) {
          setSelectedPath([data.block_id]);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("No se pudo cargar el requerimiento");
        if (!onSuccess) navigate(-1);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [id, navigate, onSuccess]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const block_id = selectedPath[selectedPath.length - 1];
      if (!block_id) throw new Error("Debe seleccionar un bloque");
      if (!matrixId) throw new Error("Matrix ID es requerido");

      // Validar que el bloque sea de nivel 1 o 2
      const selectedBlock = blocks.find(b => b.id === block_id);
      if (selectedBlock && selectedBlock.level_id !== 1 && selectedBlock.level_id !== 2) {
        throw new Error("El bloque debe ser de nivel 1 o 2");
      }

      const payload = {
        matrix_id: matrixId,
        area: form.area,
        block_id: block_id,
        n_questions: form.n_questions,
        parent_id: form.parent_id ?? undefined,
      };

      if (id) {
        await UpdateMatrixRequirement(Number(id), payload);
      } else {
        await CreateMatrixRequirement(payload);
      }

      setSuccessOpen(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(-1);
        }
      }, 1000);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      
      if (message.includes("23505") || message.includes("llave duplicada") || message.includes("unique")) {
        setErrorMessage("⚠️ Ya existe un requerimiento con este bloque y área.");
      } else {
        setErrorMessage(`❌ ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getChildren = (parentId?: number) =>
    blocks.filter((b) => (parentId ? b.parent_block_id === parentId : !b.parent_block_id));

  // Filtrar requerimientos que pueden ser padres (excluyendo el actual si estamos editando)
  const getAvailableParents = () => {
    return existingRequirements.filter(req => 
      !id || req.id !== Number(id) // Excluir el requerimiento actual al editar
    );
  };

  // Obtener el nombre completo del bloque para un requerimiento
  const getBlockFullName = (requirement: MatrixRequirement) => {
    if (!requirement.block) return `ID: ${requirement.id}`;
    
    const blockName = requirement.block.name;
    const area = requirement.area ? ` (${requirement.area})` : '';
    const questions = requirement.n_questions ? ` - ${requirement.n_questions} preguntas` : '';
    
    return `${blockName}${area}${questions}`;
  };

  if (initialLoading)
    return (
      <Container sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
        <CardHeader
          title={
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", textAlign: "center" }}>
              {id ? "Editar Requerimiento" : "Crear Requerimiento"}
            </Typography>
          }
        />
        <Divider />
        <CardContent>
          {/* Select para área */}
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Área</InputLabel>
              <Select
                value={form.area || 'UNICA'}
                onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))}
                label="Área"
              >
                <MenuItem value="UNICA">Única (Todas las áreas)</MenuItem>
                <MenuItem value="BIOMEDICAS">Biomédicas</MenuItem>
                <MenuItem value="SOCIALES">Sociales</MenuItem>
                <MenuItem value="INGENIERIAS">Ingenierías</MenuItem>
              </Select>
              <FormHelperText>
                Selecciona el área a la que pertenece este requerimiento
              </FormHelperText>
            </FormControl>
          </Box>

          {/* Select para parent_id - Requerimiento Padre */}
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Requerimiento Padre</InputLabel>
              <Select
                value={form.parent_id || ''}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  parent_id: e.target.value ? Number(e.target.value) : undefined 
                }))}
                label="Requerimiento Padre"
              >
                <MenuItem value="">
                  <em>Ninguno (Requerimiento Raíz)</em>
                </MenuItem>
                {getAvailableParents().map((requirement) => (
                  <MenuItem key={requirement.id} value={requirement.id}>
                    {getBlockFullName(requirement)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecciona un requerimiento padre si este es un sub-requerimiento. Déjalo vacío para crear un requerimiento raíz.
              </FormHelperText>
            </FormControl>
          </Box>

          {/* Selects de bloques en cascada */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Seleccionar Bloque (Nivel 1 o 2 solamente)
            </Typography>
            
            <TextField
              select
              label="Nivel 1"
              value={selectedPath[0] ?? ""}
              onChange={(e) => {
                const value = e.target.value ? [Number(e.target.value)] : [];
                setSelectedPath(value);
              }}
              fullWidth
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Selecciona un bloque raíz</MenuItem>
              {getChildren().map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} {b.code && `(${b.code})`}
                </MenuItem>
              ))}
            </TextField>

            {selectedPath.map((blockId, idx) => {
              const children = getChildren(blockId);
              if (!children.length) return null;
              
              const currentBlock = blocks.find(b => b.id === blockId);
              return (
                <FormControl fullWidth sx={{ mb: 2 }} key={`level-${idx + 2}`}>
                  <InputLabel>{`Sub-bloque de ${currentBlock?.name}`}</InputLabel>
                  <Select
                    value={selectedPath[idx + 1] ?? ""}
                    label={`Sub-bloque de ${currentBlock?.name}`}
                    onChange={(e) => {
                      const newPath = selectedPath.slice(0, idx + 1);
                      if (e.target.value) newPath.push(Number(e.target.value));
                      setSelectedPath(newPath);
                    }}
                  >
                    <MenuItem value="">Selecciona un sub-bloque</MenuItem>
                    {children.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name} {b.code && `(${b.code})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            })}
          </Box>

          {/* Número de preguntas */}
          <TextField
            fullWidth
            type="number"
            label="Número de Preguntas"
            value={form.n_questions ?? 0}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                n_questions: parseInt(e.target.value || "0"),
              }))
            }
            inputProps={{ min: 0 }}
            sx={{ mb: 3 }}
            variant="outlined"
            helperText="Cantidad de preguntas a generar para este bloque"
          />

          {/* Información del bloque seleccionado */}
          {selectedPath.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
              <Typography variant="subtitle2" color="primary">
                Bloque seleccionado:
              </Typography>
              <Typography variant="body2">
                {selectedPath.map((blockId, idx) => {
                  const block = blocks.find(b => b.id === blockId);
                  return block ? `${idx > 0 ? ' → ' : ''}${block.name}` : '';
                }).join('')}
              </Typography>
            </Box>
          )}

          {/* Información del padre seleccionado */}
          {form.parent_id && (
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 3 }}>
              <Typography variant="subtitle2" color="primary">
                Requerimiento Padre seleccionado:
              </Typography>
              <Typography variant="body2">
                {getBlockFullName(existingRequirements.find(req => req.id === form.parent_id)!)}
              </Typography>
            </Box>
          )}

          {/* Botones */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => onSuccess ? onSuccess() : navigate(-1)}
              size="large"
              sx={{ minWidth: 120, borderRadius: 2 }}
              color="secondary"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !selectedPath.length}
              size="large"
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : id ? "Actualizar" : "Crear"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={successOpen}
        autoHideDuration={1000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {id ? "Requerimiento actualizado exitosamente" : "Requerimiento creado exitosamente"}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}