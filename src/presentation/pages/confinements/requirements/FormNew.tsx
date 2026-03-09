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
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ConfinementRequirement } from "../../../../models/ConfinementRequirement";
import type { Block } from "../../../../models/Block";

export default function RequirementCascade({ 
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
  const [missingNodes, setMissingNodes] = useState<Array<{block: Block, level: number}>>([]);

  const [form, setForm] = useState<Partial<ConfinementRequirement>>({
    confinement_id: confinementId,
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
        
        if (data.block_id) {
          setSelectedPath([data.block_id]);
        }

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

  // Función para encontrar nodos faltantes en el path
  const findMissingNodes = (targetBlockId: number): Array<{block: Block, level: number, parentBlockId: number | null}> => {
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!targetBlock) return [];

    const path: Block[] = [];
    let currentBlock: Block | undefined = targetBlock;

    // Construir el path completo desde el bloque objetivo hasta la raíz
    while (currentBlock) {
      path.unshift(currentBlock);
      currentBlock = currentBlock.parent_block_id 
        ? blocks.find(b => b.id === currentBlock!.parent_block_id) 
        : undefined;
    }

    // Verificar qué nodos faltan
    const missing: Array<{block: Block, level: number, parentBlockId: number | null}> = [];
    
    for (let i = 0; i < path.length; i++) {
      const block = path[i];
      const parentBlock = i > 0 ? path[i - 1] : null;
      
      // Verificar si existe un requirement para este bloque
      const exists = existingRequirements.some(req => 
        req.block_id === block.id && 
        !req.difficulty // Solo bloques sin dificultad
      );

      if (!exists) {
        missing.push({
          block,
          level: i,
          parentBlockId: parentBlock?.id || null
        });
      }
    }

    return missing;
  };

  // Función para encontrar ancestros existentes que necesitan actualización
  const findAncestorsToUpdate = (targetBlockId: number): ConfinementRequirement[] => {
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!targetBlock) return [];

    const path: Block[] = [];
    let currentBlock: Block | undefined = targetBlock;

    // Construir el path completo
    while (currentBlock) {
      path.unshift(currentBlock);
      currentBlock = currentBlock.parent_block_id 
        ? blocks.find(b => b.id === currentBlock!.parent_block_id) 
        : undefined;
    }

    // Encontrar requerimientos existentes en el path
    const ancestorsToUpdate: ConfinementRequirement[] = [];
    
    for (let i = 0; i < path.length - 1; i++) { // -1 porque el último es el objetivo
      const block = path[i];
      const existingReq = existingRequirements.find(req => 
        req.block_id === block.id && 
        !req.difficulty
      );
      
      if (existingReq) {
        ancestorsToUpdate.push(existingReq);
      }
    }

    return ancestorsToUpdate;
  };

  // Actualizar nodos faltantes cuando cambia el path
  useEffect(() => {
    if (selectedPath.length > 0 && !id) {
      const targetBlockId = selectedPath[selectedPath.length - 1];
      const missing = findMissingNodes(targetBlockId);
      setMissingNodes(missing.map(m => ({ block: m.block, level: m.level })));
    } else {
      setMissingNodes([]);
    }
  }, [selectedPath, existingRequirements, blocks, id]);

  const selectedParent = form.parent_id 
    ? existingRequirements.find(req => req.id === form.parent_id)
    : null;

  useEffect(() => {
    if (selectedParent) {
      if (selectedParent.difficulty) {
        setNodeType("block");
        setForm(prev => ({ ...prev, difficulty: selectedParent.difficulty }));
      } else {
        setNodeType("block");
        setForm(prev => ({ ...prev, difficulty: undefined }));
      }
    } else {
      setNodeType("block");
      setForm(prev => ({ ...prev, difficulty: undefined }));
    }
  }, [selectedParent]);

  const getAvailableBlocks = (): Block[] => {
    if (!selectedParent) {
      return blocks.filter((b) => b.level_id === 1 && b.parent_block_id === null);
    }

    if (!selectedParent.block) {
      return [];
    }

    if (selectedParent.difficulty) {
      return blocks.filter((b) => 
        b.parent_block_id === selectedParent.block!.id && 
        b.level_id === selectedParent.block!.level_id + 1
      );
    } else {
      return blocks.filter((b) => 
        b.parent_block_id === selectedParent.block!.id && 
        b.level_id === selectedParent.block!.level_id + 1
      );
    }
  };

  const siblingHasSameBlockAndDifficulty = (blockId: number | null, difficulty: string | null) => {
    if (!selectedParent) return false;
    
    const siblings = existingRequirements.filter(req => 
      req.parent_id === selectedParent.id && 
      req.id !== Number(id)
    );

    return siblings.some(sibling => 
      sibling.block_id === blockId && 
      sibling.difficulty === difficulty
    );
  };

  // Función para actualizar ancestros con incremento de preguntas
  const updateAncestorsQuestions = async (ancestorsToUpdate: ConfinementRequirement[], additionalQuestions: number) => {
    // Actualizar de arriba hacia abajo (desde raíz hacia el objetivo)
    for (const ancestor of ancestorsToUpdate) {
      const newTotal = ancestor.n_questions + additionalQuestions;
      
      console.log(`Actualizando ancestro ID ${ancestor.id} (${ancestor.block?.name}): ${ancestor.n_questions} -> ${newTotal}`);
      
      await UpdateConfinementBlock(ancestor.id!, { 
        n_questions: newTotal 
      });
      
      // Actualizar localmente para las siguientes validaciones
      ancestor.n_questions = newTotal;
    }
  };

  // Función para crear nodos en cascada
  const createNodesInCascade = async (targetBlockId: number, nQuestions: number) => {
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!targetBlock) throw new Error("Bloque objetivo no encontrado");

    // Construir el path completo
    const path: Block[] = [];
    let currentBlock: Block | undefined = targetBlock;
    
    while (currentBlock) {
      path.unshift(currentBlock);
      currentBlock = currentBlock.parent_block_id 
        ? blocks.find(b => b.id === currentBlock!.parent_block_id) 
        : undefined;
    }

    // PASO 1: Actualizar ancestros existentes
    const ancestorsToUpdate = findAncestorsToUpdate(targetBlockId);
    if (ancestorsToUpdate.length > 0) {
      console.log("=== PASO 1: Actualizando ancestros existentes ===");
      await updateAncestorsQuestions(ancestorsToUpdate, nQuestions);
    }

    // PASO 2: Crear nodos faltantes
    console.log("=== PASO 2: Creando nodos faltantes ===");
    
    // Encontrar o crear el nodo raíz
    let rootRequirement = existingRequirements.find(req => 
      req.confinement_id === confinementId && req.parent_id === null
    );

    let parentRequirementId = rootRequirement?.id;
    
    // Crear nodos faltantes en orden
    for (let i = 0; i < path.length; i++) {
      const block = path[i];
      
      // Verificar si ya existe
      let existing = existingRequirements.find(req => 
        req.block_id === block.id && 
        !req.difficulty &&
        (i === 0 ? req.parent_id === parentRequirementId : true)
      );

      if (!existing) {
        // Crear el nodo
        const payload: any = {
          confinement_id: confinementId,
          block_id: block.id,
          n_questions: nQuestions,
          parent_id: parentRequirementId || null,
        };

        console.log(`Creando nodo nivel ${i} (${block.name}):`, payload);
        
        const created = await CreateConfinementBlock(payload);
        
        // Actualizar la lista de requerimientos existentes
        existingRequirements.push(created);
        
        // Este nodo creado será el padre del siguiente
        parentRequirementId = created.id;
      } else {
        // Si existe, usarlo como padre para el siguiente nivel
        parentRequirementId = existing.id;
      }
    }

    return parentRequirementId;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!confinementId) throw new Error("Confinement ID es requerido");
      
      // Validar número de preguntas
      if (!form.n_questions || form.n_questions <= 0) {
        throw new Error("El número de preguntas debe ser mayor a 0");
      }

      if (id) {
        // MODO EDICIÓN - mantener lógica original
        let block_id: number | null = null;
        let difficulty: string | null = null;

        if (nodeType === "block") {
          block_id = selectedPath[selectedPath.length - 1];
          if (!block_id) throw new Error("Debe seleccionar un bloque");
          
          if (selectedParent?.difficulty) {
            difficulty = selectedParent.difficulty;
          } else {
            difficulty = null;
          }
        } else if (nodeType === "difficulty") {
          if (!selectedParent?.block_id) throw new Error("El padre debe tener un bloque para crear nodos de dificultad");
          block_id = selectedParent.block_id;
          difficulty = form.difficulty as string;
        }

        if (siblingHasSameBlockAndDifficulty(block_id, difficulty)) {
          throw new Error("Ya existe un requerimiento con el mismo bloque y dificultad");
        }

        let parent_id = selectedParent?.id;
        
        if (!parent_id) {
          const rootRequirement = existingRequirements.find(req => 
            req.confinement_id === confinementId && req.parent_id === null
          );
          
          if (rootRequirement) {
            parent_id = rootRequirement.id;
          }
        }

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
          parent_id: parent_id || null,
        };

        if (block_id) {
          payload.block_id = block_id;
        }
        if (difficulty !== null) {
          payload.difficulty = difficulty;
        }

        await UpdateConfinementBlock(Number(id), payload);
      } else {
        // MODO CREACIÓN - nueva lógica en cascada
        if (nodeType === "block") {
          const targetBlockId = selectedPath[selectedPath.length - 1];
          if (!targetBlockId) throw new Error("Debe seleccionar un bloque");

          console.log("=== INICIANDO CREACIÓN EN CASCADA ===");
          console.log("Bloque objetivo:", targetBlockId);
          console.log("Preguntas:", form.n_questions);

          // Crear todos los nodos faltantes en cascada (incluyendo actualización de ancestros)
          await createNodesInCascade(targetBlockId, form.n_questions);
          
          console.log("=== CREACIÓN COMPLETADA ===");
        } else if (nodeType === "difficulty") {
          // Para nodos de dificultad, mantener lógica original
          if (!selectedParent?.block_id) throw new Error("El padre debe tener un bloque para crear nodos de dificultad");
          
          const block_id = selectedParent.block_id;
          const difficulty = form.difficulty as string;

          if (siblingHasSameBlockAndDifficulty(block_id, difficulty)) {
            throw new Error("Ya existe un requerimiento con el mismo bloque y dificultad");
          }

          const payload: any = {
            confinement_id: confinementId,
            block_id: block_id,
            n_questions: form.n_questions,
            difficulty: difficulty,
            parent_id: selectedParent.id,
          };

          await CreateConfinementBlock(payload);
        }
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

  const getAvailableParents = () => {
    return existingRequirements.filter(req => 
      (!id || req.id !== Number(id)) &&
      (!req.difficulty || req.children?.length === 0)
    );
  };

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

  const ancestorsToUpdate = selectedPath.length > 0 && !id
    ? findAncestorsToUpdate(selectedPath[selectedPath.length - 1])
    : [];

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
          {/* Select para parent_id */}
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
                disabled={!!selectedParent?.difficulty}
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

          {/* Mostrar ancestros que se actualizarán */}
          {!id && ancestorsToUpdate.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="subtitle2" color="info.dark" gutterBottom>
                ℹ️ Se actualizarán los siguientes nodos existentes (+{form.n_questions} preguntas):
              </Typography>
              <List dense>
                {ancestorsToUpdate.map((ancestor) => (
                  <ListItem key={ancestor.id}>
                    <ListItemText 
                      primary={`${ancestor.block?.name}`}
                      secondary={`${ancestor.n_questions} → ${ancestor.n_questions + (form.n_questions ?? 0)} preguntas`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Mostrar nodos que se crearán */}
          {!id && missingNodes.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.main' }}>
              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                ⚠️ Se crearán los siguientes nodos nuevos:
              </Typography>
              <List dense>
                {missingNodes.map((node, idx) => (
                  <ListItem key={idx}>
                    <ListItemText 
                      primary={`Nivel ${node.level + 1}: ${node.block.name}`}
                      secondary={`Código: ${node.block.code || 'N/A'} - ${form.n_questions} preguntas`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

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
            inputProps={{ onWheel: (e) => (e.target as HTMLInputElement).blur() }}
            sx={{ mb: 3 }}
            variant="outlined"
            helperText={
              selectedParent 
                ? `Máximo disponible: ${selectedParent.n_questions - existingRequirements
                    .filter(req => req.parent_id === selectedParent.id && req.id !== Number(id))
                    .reduce((sum, req) => sum + req.n_questions, 0)} preguntas`
                : !id && (ancestorsToUpdate.length > 0 || missingNodes.length > 0)
                  ? "Este número se sumará a los ancestros y se asignará a los nuevos nodos"
                  : "Cantidad de preguntas a generar para este bloque"
            }
          />

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
            {!id && ancestorsToUpdate.length > 0 && (
              <Typography variant="body2" color="info.dark" sx={{ mt: 1 }}>
                ✏️ Se actualizarán {ancestorsToUpdate.length} nodo(s) existente(s)
              </Typography>
            )}
            {!id && missingNodes.length > 0 && (
              <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
                ➕ Se crearán {missingNodes.length} nodo(s) nuevo(s)
              </Typography>
            )}
            {nodeType === 'difficulty' && (
              <Typography variant="body2">
                Dificultad: {form.difficulty} | Bloque: {selectedParent?.block?.name}
              </Typography>
            )}
            <Typography variant="body2">
              Preguntas: {form.n_questions}
            </Typography>
          </Paper>

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
          {id ? "Requerimiento actualizado exitosamente" : "Requerimiento(s) creado(s) exitosamente"}
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