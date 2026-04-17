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
  Button,
} from "@mui/material";
import {
  Visibility as ViewIcon,
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
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [questionsData, collaboratorsData, blocksData] = await Promise.all([
        GetQuestions(),
        GetCollaborators(),
        GetBlocks(),
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

  const getFormulatorName = (formulatorId: number): string => {
    const collaborator = collaborators.find((c) => c.id === formulatorId);
    return collaborator?.name || `ID: ${formulatorId}`;
  };

  const normalizeText = (text: string): string =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const getRootBlocks = () => blocks.filter((b) => !b.parent_block_id);
  const getChildBlocks = (parentId: number) =>
    blocks.filter((b) => b.parent_block_id === parentId);

  const getAllDescendantIds = (parentId: number): number[] => {
    const ids: number[] = [parentId];
    const findChildren = (id: number) => {
      blocks.filter((b) => b.parent_block_id === id).forEach((child) => {
        ids.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(parentId);
    return ids;
  };

  const countQuestionsForBlock = (blockId: number): number => {
    const ids = getAllDescendantIds(blockId);
    return questions.filter((q) => ids.includes(q.block_id)).length;
  };

  const filterQuestions = (term: string, blockId: number | null) => {
    let filtered = questions;
    if (term.trim()) {
      const normalized = normalizeText(term);
      filtered = filtered.filter((q) =>
        normalizeText(q.statement || "").includes(normalized)
      );
    }
    if (blockId !== null) {
      const ids = getAllDescendantIds(blockId);
      filtered = filtered.filter((q) => ids.includes(q.block_id));
    }
    setFilteredQuestions(filtered);
  };

  useEffect(() => {
    filterQuestions(searchTerm, selectedBlockId);
  }, [searchTerm, selectedBlockId, questions]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleBlockClick = (blockId: number) => {
    const isRoot = !blocks.find((b) => b.id === blockId)?.parent_block_id;

    if (isRoot) {
      if (expandedBlockId === blockId) {
        // colapsar y deseleccionar
        setExpandedBlockId(null);
        setSelectedBlockId(null);
      } else {
        setExpandedBlockId(blockId);
        setSelectedBlockId(blockId);
      }
    } else {
      setSelectedBlockId((prev) => (prev === blockId ? expandedBlockId : blockId));
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedBlockId(null);
    setExpandedBlockId(null);
  };

  const countByStatus = (status: string) =>
    filteredQuestions.filter((q) => q.status === status).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "success";
      case "USED": return "warning";
      case "UNAVAILABLE": return "error";
      case "RETIRED": return "default";
      default: return "default";
    }
  };

  const translateStatus = (status: string) => ({
    AVAILABLE: "Disponible",
    UNAVAILABLE: "No disponible",
    USED: "Usada",
    RETIRED: "Retirada",
  }[status] || status);

  const translateDifficulty = (difficulty: string) => ({
    easy: "Fácil", normal: "Medio", hard: "Difícil",
    EASY: "Fácil", MEDIUM: "Medio", HARD: "Difícil",
  }[difficulty] || difficulty);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "success";
      case "MEDIUM": return "warning";
      case "HARD": return "error";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const rootBlocks = getRootBlocks();
  const hasFilters = searchTerm || selectedBlockId !== null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={600}>
          Banco de preguntas
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<CloudUploadIcon />}
          onClick={() => navigate("/question-import")}
          sx={{ textTransform: "none" }}
        >
          Importar preguntas
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Layout principal */}
      <Box sx={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 2, alignItems: "start" }}>

        {/* SIDEBAR */}
        <Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}
          >
            Bloques
          </Typography>

          {/* Todos */}
          <Box
            onClick={handleClear}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              cursor: "pointer",
              mb: 0.5,
              border: "0.5px solid",
              borderColor: selectedBlockId === null && !searchTerm ? "divider" : "transparent",
              backgroundColor: selectedBlockId === null && !searchTerm ? "action.hover" : "transparent",
              "&:hover": { backgroundColor: "action.hover" },
            }}
          >
            <Typography variant="body2">Todos</Typography>
            <Chip label={questions.length} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
          </Box>

          <Box sx={{ height: "0.5px", backgroundColor: "divider", my: 0.75 }} />

          {/* Bloques raíz */}
          {rootBlocks.map((block) => {
            const children = getChildBlocks(block.id);
            const isExpanded = expandedBlockId === block.id;
            const isActive = selectedBlockId === block.id;
            const count = countQuestionsForBlock(block.id);

            return (
              <Box key={block.id}>
                <Box
                  onClick={() => handleBlockClick(block.id)}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "pointer",
                    border: "0.5px solid",
                    borderColor: isActive ? "divider" : "transparent",
                    backgroundColor: isActive ? "action.hover" : "transparent",
                    "&:hover": { backgroundColor: "action.hover" },
                    mb: 0.25,
                  }}
                >
                  <Typography variant="body2" fontWeight={isActive ? 500 : 400}>
                    {block.name}
                  </Typography>
                  <Chip label={count} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                </Box>

                {/* Subbloques */}
                {isExpanded &&
                  children.map((child) => {
                    const isChildActive = selectedBlockId === child.id;
                    const childCount = countQuestionsForBlock(child.id);
                    return (
                      <Box
                        key={child.id}
                        onClick={() => handleBlockClick(child.id)}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pl: 2.5,
                          pr: 1.25,
                          py: 0.6,
                          borderRadius: 1,
                          cursor: "pointer",
                          border: "0.5px solid",
                          borderColor: isChildActive ? "divider" : "transparent",
                          backgroundColor: isChildActive ? "action.hover" : "transparent",
                          "&:hover": { backgroundColor: "action.hover" },
                          mb: 0.25,
                        }}
                      >
                        <Typography variant="body2" color={isChildActive ? "text.primary" : "text.secondary"} fontSize={12}>
                          {child.name}
                        </Typography>
                        <Chip label={childCount} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                      </Box>
                    );
                  })}
              </Box>
            );
          })}
        </Box>

        {/* CONTENIDO PRINCIPAL */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

          {/* Buscador */}
          <Box display="flex" gap={1}>
            <TextField
              placeholder="Buscar por enunciado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {hasFilters && (
              <Button variant="outlined" size="small" onClick={handleClear} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                Limpiar
              </Button>
            )}
          </Box>

          {/* Métricas */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
            {[
              { label: "Mostrando", value: filteredQuestions.length },
              { label: "Disponibles", value: countByStatus("AVAILABLE") },
              { label: "Usadas", value: countByStatus("USED") },
              { label: "No disponibles", value: countByStatus("UNAVAILABLE") },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                  p: 1.25,
                  textAlign: "center",
                }}
              >
                <Typography variant="h6" fontWeight={500}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Tabla */}
          <Card variant="outlined">
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 600, width: "40%" }}>Enunciado</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Formulador</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Dificultad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredQuestions.map((question) => (
                      <TableRow key={question.id} sx={{ "&:hover": { backgroundColor: "action.hover" } }}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
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

                        <TableCell>
                          <Chip
                            label={translateDifficulty(question.difficulty)}
                            color={getDifficultyColor(question.difficulty)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={translateStatus(question.status)}
                            color={getStatusColor(question.status)}
                            size="small"
                            variant={question.status === "AVAILABLE" ? "filled" : "outlined"}
                          />
                        </TableCell>

                        <TableCell>
                          <Tooltip title="Ver detalles">
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredQuestions.length === 0 && (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {hasFilters
                      ? "No se encontraron preguntas con los filtros aplicados"
                      : "No hay preguntas registradas"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Bank;