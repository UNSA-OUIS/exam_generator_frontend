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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Paper,
} from "@mui/material";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ConfinementRequirement } from "../../../../models/ConfinementRequirement";
import type { Block } from "../../../../models/Block";

export default function RequirementForm({ 
  initialId, 
  initialConfinementId,
  onSuccess 
}: {
  initialId?: string;
  initialConfinementId?: string;
  onSuccess?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { id: urlId, confinementId: urlConfinementId } = useParams<{ id?: string; confinementId: string }>();

  const id = initialId || urlId;
  const confinementId = initialConfinementId || urlConfinementId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(id));
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [existingRequirements, setExistingRequirements] = useState<ConfinementRequirement[]>([]);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<ConfinementRequirement>>({
    confinement_id: confinementId ,
    block_id: undefined,
    n_questions: 0,
    difficulty: undefined,
    parent_id: undefined,
  });

  const [nodeType, setNodeType] = useState<"block" | "difficulty">("block");

  // Cargar bloques y requerimientos existentes
  useEffect(() => {
    const loadData = async () => {
      try {
        const [blocksData, requirementsData] = await Promise.all([
          GetBlocks(),
          confinementId ? ConfinementRequirementApi.getByConfinement(confinementId) : Promise.resolve([])
        ]);
        
        setBlocks(blocksData);
        setExistingRequirements(requirementsData);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error al cargar datos");
      }
    };

    loadData();
  }, [confinementId]);

  // Cargar datos del requerimiento si estamos editando
  useEffect(() => {
    if (!id) return setInitialLoading(false);
    
    (async () => {
      setInitialLoading(true);
      try {
        const data = await ConfinementRequirementApi.get(Number(id));
        setForm({
          confinement_id: data.confinement_id,
          block_id: data.block_id,
          n_questions: data.n_questions,
          difficulty: data.difficulty || undefined,
          parent_id: data.parent_id,
        });
        
        // Si hay un block_id, establecer el path
        if (data.block_id) {
          setSelectedPath([data.block_id]);
        }

        // Determinar tipo de nodo basado en los datos
        if (data.difficulty) {
          setNodeType("difficulty");
        } else {
          setNodeType("block");
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

  // Obtener el requerimiento padre seleccionado
  const selectedParent = form.parent_id 
    ? existingRequirements.find(req => req.id === form.parent_id)
    : null;

  // Determinar tipo de nodo disponible basado en el padre
  useEffect(() => {
    if (selectedParent) {
      if (selectedParent.difficulty) {
        // Si el padre tiene dificultad, solo puede ser bloque (hereda dificultad)
        setNodeType("block");
        setForm(prev => ({ ...prev, difficulty: selectedParent.difficulty }));
      } else {
        // Si el padre no tiene dificultad, puede ser bloque o dificultad
        setNodeType("block");
        setForm(prev => ({ ...prev, difficulty: undefined }));
      }
    } else {
      // Si no hay padre (raíz), solo puede ser bloque sin dificultad
      setNodeType("block");
      setForm(prev => ({ ...prev, difficulty: undefined }));
    }
  }, [selectedParent]);

  // Obtener bloques disponibles basado en el padre seleccionado
  const getAvailableBlocks = (): Block[] => {
    if (!selectedParent) {
      // Raíz - solo bloques de nivel 1
      return blocks.filter((b) => b.level_id === 1 && b.parent_block_id === null);
    }

    if (!selectedParent.block) {
      return [];
    }

    if (selectedParent.difficulty) {
      // Padre con dificultad - bloques del siguiente nivel que sean hijos del bloque del padre
      return blocks.filter((b) => 
        b.parent_block_id === selectedParent.block!.id && 
        b.level_id === selectedParent.block!.level_id + 1
      );
    } else {
      // Padre sin dificultad - bloques del siguiente nivel
      return blocks.filter((b) => 
        b.parent_block_id === selectedParent.block!.id && 
        b.level_id === selectedParent.block!.level_id + 1
      );
    }
  };

  // Verificar si ya existe un hermano con el mismo bloque y dificultad
  const siblingHasSameBlockAndDifficulty = (blockId: number | null, difficulty: string | null) => {
    if (!selectedParent) return false;
    
    const siblings = existingRequirements.filter(req => 
      req.parent_id === selectedParent.id && 
      req.id !== Number(id) // Excluir el actual si estamos editando
    );

    return siblings.some(sibling => 
      sibling.block_id === blockId && 
      sibling.difficulty === difficulty
    );
  };

const handleSubmit = async () => {
  setLoading(true);
  try {
    if (!confinementId) throw new Error("Confinement ID es requerido");
    
    let block_id: number | null = null;
    let difficulty: string | null = null;

    if (nodeType === "block") {
      block_id = selectedPath[selectedPath.length - 1];
      if (!block_id) throw new Error("Debe seleccionar un bloque");
      
      // Si el padre tiene dificultad, heredarla
      if (selectedParent?.difficulty) {
        difficulty = selectedParent.difficulty;
      } else {
        difficulty = null;
      }
    } else if (nodeType === "difficulty") {
      // Para nodos de dificultad, usar el mismo bloque del padre
      if (!selectedParent?.block_id) throw new Error("El padre debe tener un bloque para crear nodos de dificultad");
      block_id = selectedParent.block_id;
      difficulty = form.difficulty as string;
    }

    // Validar que no exista un hermano con mismo bloque y dificultad
    if (siblingHasSameBlockAndDifficulty(block_id, difficulty)) {
      throw new Error("Ya existe un requerimiento con el mismo bloque y dificultad");
    }

    // Validar número de preguntas
    if (!form.n_questions || form.n_questions <= 0) {
      throw new Error("El número de preguntas debe ser mayor a 0");
    }

    // CAMBIO AQUÍ: Encontrar el primer nodo raíz del confinement
    let parent_id = selectedParent?.id;
    
    if (!parent_id) {
      // Buscar el primer requerimiento raíz (sin padre) del confinement actual
      const rootRequirement = existingRequirements.find(req => 
        req.confinement_id === confinementId && req.parent_id === null
      );
      
      if (rootRequirement) {
        parent_id = rootRequirement.id;
      }
      // Si no existe rootRequirement, parent_id queda como undefined (será nodo raíz)
    }

    // Validar límite de preguntas del padre
    if (parent_id) {
      const parentRequirement = existingRequirements.find(req => req.id === parent_id);
      if (parentRequirement) {
        const siblingsSum = existingRequirements
          .filter(req => req.parent_id === parent_id && req.id !== Number(id))
          .reduce((sum, req) => sum + req.n_questions, 0);
        
        if (form.n_questions + siblingsSum > parentRequirement.n_questions) {
          throw new Error(`El número de preguntas excede el límite del padre. Máximo disponible: ${parentRequirement.n_questions - siblingsSum}`);
        }
      }
    }

    const payload: any = {
      confinement_id: confinementId,
      n_questions: form.n_questions,
      parent_id: parent_id || null, // Si no hay padre, será nodo raíz
    };

    if (block_id) {
      payload.block_id = block_id;
    }
    if (difficulty !== null) {
      payload.difficulty = difficulty;
    }

    console.log("Enviando payload:", payload);

    if (id) {
      await UpdateConfinementBlock(Number(id), payload);
    } else {
      await CreateConfinementBlock(payload);
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
    setErrorMessage(`❌ ${message}`);
  } finally {
    setLoading(false);
  }
};

  const getChildren = (parentId?: number) =>
    blocks.filter((b) => (parentId ? b.parent_block_id === parentId : !b.parent_block_id));

  // Filtrar requerimientos que pueden ser padres (excluyendo el actual si estamos editando)
  const getAvailableParents = () => {
    return existingRequirements.filter(req => 
      (!id || req.id !== Number(id)) && // Excluir el actual al editar
      (!req.difficulty || req.children?.length === 0) // Solo padres sin dificultad o sin hijos
    );
  };

  // Obtener el nombre completo del bloque para un requerimiento
  const getBlockFullName = (requirement: ConfinementRequirement) => {
    if (!requirement.block) return `ID: ${requirement.id}`;
    
    const blockName = requirement.block.name;
    const difficulty = requirement.difficulty ? ` (${requirement.difficulty})` : '';
    const questions = ` - ${requirement.n_questions} preguntas`;
    const remaining = requirement.n_questions - (requirement.children?.reduce((sum, child) => sum + child.n_questions, 0) || 0);
    const remainingText = ` - Disponible: ${remaining}`;
    
    return `${blockName}${difficulty}${questions}${remainingText}`;
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

          {/* Información del padre seleccionado */}
          {selectedParent && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Requerimiento Padre seleccionado:
              </Typography>
              <Typography variant="body2">
                {getBlockFullName(selectedParent)}
              </Typography>
              {selectedParent.difficulty && (
                <Typography variant="caption" color="text.secondary">
                  Este padre tiene dificultad: {selectedParent.difficulty}. Los hijos heredarán esta dificultad.
                </Typography>
              )}
            </Paper>
          )}

          {/* Selección de tipo de nodo */}
          {selectedParent && !selectedParent.difficulty && (
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Tipo de nodo hijo</FormLabel>
              <RadioGroup 
                value={nodeType} 
                onChange={(e) => setNodeType(e.target.value as "block" | "difficulty")}
                row
              >
                <FormControlLabel value="block" control={<Radio />} label="Bloque" />
                <FormControlLabel value="difficulty" control={<Radio />} label="Dificultad" />
              </RadioGroup>
              <FormHelperText>
                {nodeType === "block" 
                  ? "Crear un sub-bloque del bloque padre" 
                  : "Dividir el bloque padre por dificultad"
                }
              </FormHelperText>
            </FormControl>
          )}

          {/* Selects de bloques en cascada - Solo para tipo "block" */}
          {nodeType === "block" && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Seleccionar Bloque
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
                disabled={!!selectedParent?.difficulty} // Deshabilitar si el padre tiene dificultad
              >
                <MenuItem value="">Selecciona un bloque raíz</MenuItem>
                {getAvailableBlocks().map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} {b.code && `(${b.code})`} - Nivel {b.level_id}
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
                          {b.name} {b.code && `(${b.code})`} - Nivel {b.level_id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              })}
            </Box>
          )}

          {/* Dificultad - Solo para tipo "difficulty" */}
          {nodeType === "difficulty" && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Dificultad</InputLabel>
              <Select 
                value={form.difficulty || ""}
                label="Dificultad" 
                onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                <MenuItem value="EASY">Fácil</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HARD">Difícil</MenuItem>
              </Select>
              <FormHelperText>
                Dividir el bloque padre ({selectedParent?.block?.name}) por dificultad
              </FormHelperText>
            </FormControl>
          )}

          {/* Información del bloque seleccionado */}
          {nodeType === "block" && selectedPath.length > 0 && (
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
            inputProps={{ min: 1 }}
            sx={{ mb: 3 }}
            variant="outlined"
            helperText={
              selectedParent 
                ? `Máximo disponible: ${selectedParent.n_questions - existingRequirements
                    .filter(req => req.parent_id === selectedParent.id && req.id !== Number(id))
                    .reduce((sum, req) => sum + req.n_questions, 0)} preguntas`
                : "Cantidad de preguntas a generar para este bloque"
            }
          />

          {/* Resumen de la creación */}
          <Paper sx={{ p: 2, bgcolor: 'info.50', mb: 3 }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              Resumen:
            </Typography>
            <Typography variant="body2">
              {selectedParent 
                ? `Creando ${nodeType === 'block' ? 'sub-bloque' : 'división por dificultad'} del padre: ${selectedParent.block?.name}`
                : 'Creando requerimiento raíz'
              }
            </Typography>
            {nodeType === 'difficulty' && (
              <Typography variant="body2">
                Dificultad: {form.difficulty} | Bloque: {selectedParent?.block?.name}
              </Typography>
            )}
            <Typography variant="body2">
              Preguntas: {form.n_questions}
            </Typography>
          </Paper>

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
              disabled={loading || 
                (nodeType === "block" && !selectedPath.length) ||
                (nodeType === "difficulty" && !form.difficulty) ||
                !form.n_questions
              }
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
        autoHideDuration={6000}
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