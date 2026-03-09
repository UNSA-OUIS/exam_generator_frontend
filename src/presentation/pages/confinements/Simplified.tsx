import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { GetBlocks } from "../../../application/block/GetBlocks";
import type { Block } from "../../../models/Block";
import type { Confinement } from "../../../models/Confinement";
import axiosClient from "../../../infrastructure/lib/axiosClient";

// Niveles estándar según la imagen
const STANDARD_LEVELS = [
  "Fundamentos",
  "Conceptos Intermedios",
  "Aplicaciones Prácticas",
  "Casos de Estudio",
  "Evaluación Final",
];

interface ComponentRequirement {
  block_id: number;
  block_name: string;
  total_questions: number;
  levels: LevelRequirement[];
  expanded: boolean;
}

interface LevelRequirement {
  name: string;
  block_id?: number;
  questions: number;
  difficulty?: "EASY" | "NORMAL" | "HARD";
}

interface SimplifiedRequirementsEditorProps {
  open: boolean;
  onClose: () => void;
  confinement: Confinement;
  onSuccess: () => void;
}

export default function SimplifiedRequirementsEditor({
  open,
  onClose,
  confinement,
  onSuccess,
}: SimplifiedRequirementsEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [components, setComponents] = useState<ComponentRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar bloques de nivel 1
  useEffect(() => {
    const loadBlocks = async () => {
      setLoading(true);
      try {
        const allBlocks = await GetBlocks();
        setBlocks(allBlocks);
        
        // Inicializar componentes con bloques de nivel 1
        const level1Blocks = allBlocks.filter(b => b.level_id === 1);
        const initialComponents = level1Blocks.map(block => ({
          block_id: block.id,
          block_name: block.name,
          total_questions: 0,
          levels: [],
          expanded: false,
        }));
        setComponents(initialComponents);
      } catch (err) {
        setError("Error al cargar bloques");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadBlocks();
    }
  }, [open]);

  const getChildBlocks = (parentId: number) => {
    return blocks.filter(b => b.parent_block_id === parentId);
  };

  const handleComponentQuestionsChange = (index: number, value: number) => {
    const newComponents = [...components];
    newComponents[index].total_questions = value;
    
    // Si tiene valor mayor a 0 y no tiene niveles, inicializar con niveles estándar
    if (value > 0 && newComponents[index].levels.length === 0) {
      const questionsPerLevel = Math.floor(value / STANDARD_LEVELS.length);
      newComponents[index].levels = STANDARD_LEVELS.map((name) => ({
        name,
        questions: questionsPerLevel,
      }));
    }
    
    setComponents(newComponents);
  };

  const toggleExpanded = (index: number) => {
    const newComponents = [...components];
    newComponents[index].expanded = !newComponents[index].expanded;
    setComponents(newComponents);
  };

  const handleLevelQuestionsChange = (
    componentIndex: number,
    levelIndex: number,
    value: number
  ) => {
    const newComponents = [...components];
    newComponents[componentIndex].levels[levelIndex].questions = value;
    setComponents(newComponents);
  };

  const handleAddLevel = (componentIndex: number) => {
    const newComponents = [...components];
    const childBlocks = getChildBlocks(newComponents[componentIndex].block_id);
    
    newComponents[componentIndex].levels.push({
      name: childBlocks.length > 0 ? "" : newComponents[componentIndex].block_name,
      block_id: undefined,
      questions: 0,
      difficulty: childBlocks.length === 0 ? "EASY" : undefined,
    });
    
    setComponents(newComponents);
  };

  const handleRemoveLevel = (componentIndex: number, levelIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].levels.splice(levelIndex, 1);
    setComponents(newComponents);
  };

  const handleLevelBlockChange = (
    componentIndex: number,
    levelIndex: number,
    blockId: number
  ) => {
    const newComponents = [...components];
    newComponents[componentIndex].levels[levelIndex].block_id = blockId;
    
    // Actualizar nombre
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      newComponents[componentIndex].levels[levelIndex].name = block.name;
    }
    
    setComponents(newComponents);
  };

  const handleLevelDifficultyChange = (
    componentIndex: number,
    levelIndex: number,
    difficulty: "EASY" | "NORMAL" | "HARD"
  ) => {
    const newComponents = [...components];
    newComponents[componentIndex].levels[levelIndex].difficulty = difficulty;
    setComponents(newComponents);
  };

  const validateComponent = (component: ComponentRequirement): string | null => {
    if (component.total_questions === 0) {
      return null; // Skip components with 0 questions
    }

    const totalLevels = component.levels.reduce((sum, level) => sum + level.questions, 0);
    
    if (totalLevels !== component.total_questions) {
      return `${component.block_name}: La suma de niveles (${totalLevels}) debe ser igual al total (${component.total_questions})`;
    }

    for (const level of component.levels) {
      if (level.questions === 0) {
        return `${component.block_name}: El nivel "${level.name}" tiene 0 preguntas`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar todos los componentes
      for (const component of components) {
        const validationError = validateComponent(component);
        if (validationError) {
          setError(validationError);
          setSaving(false);
          return;
        }
      }

      // Construir la estructura de requerimientos
      const requirements = [];

      for (const component of components) {
        if (component.total_questions === 0) continue;

        // Crear el componente principal (hijo del root)
        requirements.push({
          confinement_id: confinement.id,
          block_id: component.block_id,
          n_questions: component.total_questions,
          difficulty: null,
        });

        // Crear los niveles
        for (const level of component.levels) {
          requirements.push({
            confinement_id: confinement.id,
            block_id: level.block_id || component.block_id,
            n_questions: level.questions,
            difficulty: level.difficulty || null,
            parent_block_id: component.block_id,
          });
        }
      }

      // Enviar todo al backend
      const response = await axiosClient.post(
        `/confinements/${confinement.id}/requirements/bulk`,
        { requirements }
      );

      setSuccess(`Se crearon ${response.data.created} requerimientos exitosamente`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar requerimientos");
    } finally {
      setSaving(false);
    }
  };

  const getTotalQuestions = () => {
    return components.reduce((sum, comp) => sum + comp.total_questions, 0);
  };

  const getRemainingQuestions = (component: ComponentRequirement) => {
    const assigned = component.levels.reduce((sum, level) => sum + level.questions, 0);
    return component.total_questions - assigned;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando bloques...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Generar Requerimientos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {confinement.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip 
              label={`Total: ${getTotalQuestions()} / ${confinement.total}`}
              color={getTotalQuestions() === confinement.total ? "success" : getTotalQuestions() > confinement.total ? "error" : "warning"}
              sx={{ fontWeight: 600 }}
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            📋 Instrucciones:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            1. Define el total de preguntas para cada componente (Eje Temático)
            <br />
            2. Haz clic en "Editar" para distribuir las preguntas en bloques o niveles
            <br />
            3. La suma de todos los componentes debe ser igual al total del internamiento ({confinement.total})
          </Typography>
        </Paper>

        {/* Tabla principal de componentes */}
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>Expandir</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Eje Temático / Componente</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 200 }}>Total Preguntas</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {components.map((component, idx) => (
                <>
                  <TableRow 
                    key={component.block_id}
                    sx={{ 
                      bgcolor: component.expanded ? "primary.50" : "inherit",
                      "&:hover": { bgcolor: component.expanded ? "primary.100" : "grey.50" }
                    }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(idx)}
                        disabled={component.total_questions === 0}
                      >
                        {component.expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>
                        {component.block_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={component.total_questions}
                        onChange={(e) =>
                          handleComponentQuestionsChange(idx, parseInt(e.target.value) || 0)
                        }
                        inputProps={{ min: 0 }}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => toggleExpanded(idx)}
                        disabled={component.total_questions === 0}
                        variant={component.expanded ? "contained" : "outlined"}
                        sx={{ minWidth: 90 }}
                      >
                        {component.expanded ? "Cerrar" : "Editar"}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Fila expandible con editor de niveles */}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                      <Collapse in={component.expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 3, bgcolor: "grey.50" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Distribución de preguntas - {component.block_name}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                              <Chip
                                label={`Restante: ${getRemainingQuestions(component)}`}
                                color={getRemainingQuestions(component) === 0 ? "success" : "warning"}
                                size="small"
                              />
                              <Button
                                startIcon={<AddIcon />}
                                onClick={() => handleAddLevel(idx)}
                                variant="outlined"
                                size="small"
                              >
                                Agregar Bloque
                              </Button>
                            </Box>
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          {component.levels.length === 0 ? (
                            <Alert severity="info">
                              No hay bloques definidos. Se han sugerido bloques estándar, ajusta las cantidades según necesites.
                            </Alert>
                          ) : (
                            <TableContainer component={Paper}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Bloque / Nivel</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: 200 }}>Número de Preguntas</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {component.levels.map((level, levelIdx) => {
                                    const childBlocks = getChildBlocks(component.block_id);

                                    return (
                                      <TableRow key={levelIdx}>
                                        <TableCell>
                                          {childBlocks.length > 0 ? (
                                            <FormControl fullWidth size="small">
                                              <Select
                                                value={level.block_id || ""}
                                                onChange={(e) =>
                                                  handleLevelBlockChange(idx, levelIdx, Number(e.target.value))
                                                }
                                                displayEmpty
                                              >
                                                <MenuItem value="">
                                                  <em>Seleccionar bloque hijo</em>
                                                </MenuItem>
                                                {childBlocks.map((block) => (
                                                  <MenuItem key={block.id} value={block.id}>
                                                    {block.name} ({block.code})
                                                  </MenuItem>
                                                ))}
                                              </Select>
                                            </FormControl>
                                          ) : (
                                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                              <TextField
                                                size="small"
                                                value={level.name}
                                                fullWidth
                                                disabled
                                                sx={{ flexGrow: 1 }}
                                              />
                                              {level.difficulty !== undefined && (
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                  <Select
                                                    value={level.difficulty}
                                                    onChange={(e) =>
                                                      handleLevelDifficultyChange(
                                                        idx,
                                                        levelIdx,
                                                        e.target.value as "EASY" | "NORMAL" | "HARD"
                                                      )
                                                    }
                                                  >
                                                    <MenuItem value="EASY">Fácil</MenuItem>
                                                    <MenuItem value="NORMAL">Normal</MenuItem>
                                                    <MenuItem value="HARD">Difícil</MenuItem>
                                                  </Select>
                                                </FormControl>
                                              )}
                                            </Box>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <TextField
                                            type="number"
                                            size="small"
                                            value={level.questions}
                                            onChange={(e) =>
                                              handleLevelQuestionsChange(
                                                idx,
                                                levelIdx,
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                            inputProps={{ min: 0 }}
                                            fullWidth
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleRemoveLevel(idx, levelIdx)}
                                            color="error"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  <TableRow sx={{ bgcolor: "primary.50" }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Total de preguntas:</TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontWeight: 600 }}>
                                        {component.levels.reduce((sum, l) => sum + l.questions, 0)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell />
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, bgcolor: "grey.50" }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Total de preguntas configuradas: <strong>{getTotalQuestions()}</strong> / {confinement.total}
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" disabled={saving} size="large">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || getTotalQuestions() !== confinement.total}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          size="large"
        >
          {saving ? "Generando requerimientos..." : "Generar Requerimientos"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}