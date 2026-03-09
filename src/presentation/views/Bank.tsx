import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { GetQuestions } from "../../application/question/GetQuestions";
import { GetCollaborators } from "../../application/collaborator/GetCollaborators";
import { GetBlocks } from "../../application/block/GetBlocks";
import type { Question } from "../../models/Question";
import type { Collaborator } from "../../models/Collaborator";
import type { Block } from "../../models/Block";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  //Edit as ViewIcon,
  //CheckCircle as CompletedIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

const Bank = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBlockPath, setSelectedBlockPath] = useState<number[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar preguntas, colaboradores y bloques en paralelo
      const [questionsData, collaboratorsData, blocksData] = await Promise.all([
        GetQuestions(),
        GetCollaborators(),
        GetBlocks()
      ]);

      setQuestions(questionsData);
      setFilteredQuestions(questionsData);
      setCollaborators(collaboratorsData);
      setBlocks(blocksData);
    } catch (err) {
      setError("Error al cargar los datos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el nombre del formulador
  const getFormulatorName = (formulatorId: number): string => {
    const collaborator = collaborators.find(collab => collab.id === formulatorId);
    return collaborator?.name || `ID: ${formulatorId}`;
  };

  // Función para eliminar tildes y normalizar texto
  const normalizeText = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Función para obtener bloques hijos
  const getChildrenBlocks = (parentId?: number) =>
    blocks.filter((b) => (parentId ? b.parent_block_id === parentId : !b.parent_block_id));

  // Función recursiva para obtener todos los IDs de bloques hijos (incluyendo nietos, bisnietos, etc.)
  const getAllDescendantBlockIds = (parentId: number, allBlocks: Block[]): number[] => {
    const descendantIds: number[] = [parentId]; // Incluir el propio bloque padre

    const findChildren = (currentParentId: number) => {
      const children = allBlocks.filter(block => block.parent_block_id === currentParentId);
      children.forEach(child => {
        descendantIds.push(child.id);
        findChildren(child.id); // Llamada recursiva para encontrar nietos
      });
    };

    findChildren(parentId);
    return descendantIds;
  };

  // Función para filtrar preguntas basado en searchTerm y bloque seleccionado
  const filterQuestions = (term: string, blockPath: number[]) => {
    let filtered = questions;

    // Aplicar filtro de búsqueda por texto
    if (term.trim()) {
      const normalizedTerm = normalizeText(term);
      filtered = filtered.filter(question =>
        normalizeText(question.statement || "").includes(normalizedTerm)
      );
    }

    // Aplicar filtro por bloque si hay uno seleccionado
    if (blockPath.length > 0) {
      const selectedBlockId = blockPath[blockPath.length - 1]; // El último bloque seleccionado

      // Obtener todos los IDs de bloques descendientes (incluyendo el seleccionado)
      const allBlockIdsInHierarchy = getAllDescendantBlockIds(selectedBlockId, blocks);

      // Filtrar preguntas que tengan block_id en la jerarquía
      filtered = filtered.filter(question =>
        allBlockIdsInHierarchy.includes(question.block_id)
      );
    }

    setFilteredQuestions(filtered);
  };
  console.log({ selectedBlockPath });
  // Efecto para filtrar cuando cambia el searchTerm o selectedBlockPath
  useEffect(() => {
    filterQuestions(searchTerm, selectedBlockPath);
  }, [searchTerm, selectedBlockPath, questions]);

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'USED': return 'warning';
      case 'UNAVAILABLE': return 'error';
      case 'RETIRED': return 'default';
      default: return 'default';
    }
  };
  const translateDifficulty = (difficulty: string) => {
    const map: Record<string, string> = {
      easy: "FÁCIL",
      normal: "MEDIO",
      hard: "DIFÍCIL",
      EASY: "FÁCIL",
      MEDIUM: "MEDIO",
      HARD: "DIFÍCIL",
    };

    return map[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HARD': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          Banco de preguntas
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={() => navigate("/question-import")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Importar preguntas
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros - Barra de Búsqueda y Bloques */}
      <Card sx={{ mb: 3, background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }} >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row", // 🔹 Todo en una sola fila
              flexWrap: "wrap", // 🔹 Permite que se acomode si no hay espacio
              alignItems: "center",
              gap: 2,

            }}
          >
            {/* Barra de búsqueda */}
            <TextField
              placeholder="Buscar por enunciado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                minWidth: 250,
              }}
              size="medium"
            />
            {/* Nivel 1 */}
            {/* Nivel 1 */}
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Nivel 1</InputLabel>
              <Select
                value={selectedBlockPath[0] ?? ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSelectedBlockPath(value ? [value] : []); // 🔹 Limpia todo si no hay nivel 1
                }}
                label="Nivel 1"
              >
                <MenuItem value="">Todos los bloques</MenuItem>
                {getChildrenBlocks().map((block) => (
                  <MenuItem key={block.id} value={block.id}>
                    {block.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Nivel 2 (bloqueado si no hay nivel 1) */}
            <FormControl sx={{ minWidth: 180 }} disabled={!selectedBlockPath[0]}>
              <InputLabel>Nivel 2</InputLabel>
              <Select
                value={selectedBlockPath[1] ?? ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const newPath = [selectedBlockPath[0]!, value].filter(Boolean) as number[];
                  setSelectedBlockPath(newPath);
                }}
                label="Nivel 2"
              >
                <MenuItem value="">Todos los subbloques</MenuItem>
                {selectedBlockPath[0] &&
                  getChildrenBlocks(selectedBlockPath[0]).map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>


            {/* Botón para limpiar filtros */}
            {(searchTerm || selectedBlockPath.length > 0) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedBlockPath([]);
                }}
                sx={{ minWidth: 120 }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>

        </CardContent>
      </Card>

      {/* Resto del código de la tabla permanece igual */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ p: 3, pb: 2, fontWeight: 600 }}>
            Preguntas ({filteredQuestions.length} encontradas)
          </Typography>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>
                    Enunciado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '15%' }}>
                    Formulador
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>
                    Dificultad
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.map((question, index) => (
                  <TableRow
                    key={question.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'grey.25',
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {question.statement || "Sin enunciado"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getFormulatorName(question.formulator_id)}
                      </Typography>
                    </TableCell>

                    <Chip
                      label={translateDifficulty(question.difficulty)}
                      color={getDifficultyColor(question.difficulty)}
                      size="small"
                      variant="outlined"
                    />


                    <TableCell>
                      <Chip
                        label={
                          {
                            AVAILABLE: "Disponible",
                            UNAVAILABLE: "No disponible",
                            USED: "Usada",
                            RETIRED: "Retirada"
                          }[question.status] || question.status
                        }
                        color={getStatusColor(question.status)}
                        size="small"
                        variant={question.status === "AVAILABLE" ? "filled" : "outlined"}
                      />
                    </TableCell>


                    <TableCell>
                      <Box sx={{ display: 'flex', marginLeft: 1.5 }}>

                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            sx={{
                              color: "info.main",
                              "&:hover": { backgroundColor: "info.lighter" },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredQuestions.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm || selectedBlockPath.length > 0
                  ? "No se encontraron preguntas que coincidan con los filtros"
                  : "No se encontraron preguntas"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Bank;