import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Divider,
  Tooltip,
  IconButton,
  Chip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon,
  WarningAmber as WarnIcon,
} from "@mui/icons-material";
import { CreateMatrixRequirement } from "../../../../application/matrix/CreateMatrixRequirement";
import { UpdateMatrixRequirement } from "../../../../application/matrix/UpdateMatrixRequirement";
import { MatrixRequirementApi } from "../../../../infrastructure/api/MatrixRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { MatrixRequirement } from "../../../../models/MatrixRequirement";
import type { Block } from "../../../../models/Block";

type Area = "UNICA" | "BIOMEDICAS" | "SOCIALES" | "INGENIERIAS";

const AREAS: Area[] = ["UNICA", "BIOMEDICAS", "SOCIALES", "INGENIERIAS"];

const AREA_LABELS: Record<Area, string> = {
  UNICA: "Única",
  BIOMEDICAS: "Biomédicas",
  SOCIALES: "Sociales",
  INGENIERIAS: "Ingenierías",
};

// ── Nodo del árbol (solo L1 y L2) ─────────────────────────────────────────────
interface TreeNode {
  block: Block;
  depth: number; // 0 = L1, 1 = L2
  path: Block[];
  directChildIds: number[];
  isLeaf: boolean;
  existing?: MatrixRequirement;
}

interface NodeValue {
  nQuestions: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildNodes = (blocks: Block[]): TreeNode[] => {
  const nodes: TreeNode[] = [];
  const recurse = (parentId: number | null, depth: number, path: Block[]) => {
    // Solo construimos hasta depth 1 (L2)
    if (depth > 1) return;
    const children = blocks
      .filter((b) => (parentId === null ? !b.parent_block_id : b.parent_block_id === parentId))
      .sort((a, b) => a.id - b.id);
    for (const block of children) {
      const p = [...path, block];
      const directChildren = blocks.filter((b) => b.parent_block_id === block.id);
      nodes.push({
        block,
        depth,
        path: p,
        directChildIds: directChildren.map((b) => b.id),
        isLeaf: depth === 1, // L2 siempre es hoja en este contexto
      });
      recurse(block.id, depth + 1, p);
    }
  };
  recurse(null, 0, []);
  return nodes;
};

const budgetColor = (used: number, limit: number | undefined) => {
  if (!limit) return "text.secondary";
  if (used > limit) return "error.main";
  if (used === limit) return "success.main";
  if (used / limit >= 0.8) return "warning.main";
  return "primary.main";
};

const budgetBg = (used: number, limit: number | undefined) => {
  if (!limit || used === 0) return "transparent";
  if (used > limit) return "#fef2f2";
  if (used === limit) return "#f0fdf4";
  return "#eff6ff";
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function MatrixRequirementManager({
  initialMatrixId,
  onSuccess,
}: { initialMatrixId?: string; onSuccess?: () => void } = {}) {
  const navigate = useNavigate();
  const { matrixId: urlMatrixId } = useParams<{ matrixId: string }>();
  const matrixId = initialMatrixId || urlMatrixId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allNodes, setAllNodes] = useState<TreeNode[]>([]);
  const [existingReqs, setExistingReqs] = useState<MatrixRequirement[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area>("UNICA");
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  const [values, setValues] = useState<Record<number, NodeValue>>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [blocksData, reqsData] = await Promise.all([
          GetBlocks(),
          matrixId ? MatrixRequirementApi.getByMatrix(matrixId) : Promise.resolve([]),
        ]);
        setExistingReqs(reqsData);
        setAllNodes(buildNodes(blocksData));
      } catch {
        setErrorMessage("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matrixId]);

  const l1Nodes = useMemo(() => allNodes.filter((n) => n.depth === 0), [allNodes]);
  const l2Nodes = useMemo(() => allNodes.filter((n) => n.depth === 1), [allNodes]);

  // Áreas disponibles (desde reqs existentes o todas)
  const availableAreas = useMemo<Area[]>(() => {
    const fromReqs = [...new Set(existingReqs.map((r) => r.area as Area))].filter(Boolean);
    return fromReqs.length > 0 ? fromReqs : AREAS;
  }, [existingReqs]);

  // L1 activo inicial
  useEffect(() => {
    if (l1Nodes.length > 0 && activeL1Id === null) {
      setActiveL1Id(l1Nodes[0].block.id);
    }
  }, [l1Nodes, activeL1Id]);

  // Sincronizar área seleccionada
  useEffect(() => {
    if (availableAreas.length > 0 && !availableAreas.includes(selectedArea)) {
      setSelectedArea(availableAreas[0]);
    }
  }, [availableAreas]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poblar values desde reqs existentes cuando cambia área ───────────────
  useEffect(() => {
    if (allNodes.length === 0) return;
    const areaReqs = existingReqs.filter((r) => r.area === selectedArea );

    // Enriquecer nodos con existing
    const reqByBlock = new Map<number, MatrixRequirement>();
    for (const req of areaReqs) {
      if (req.block_id) reqByBlock.set(req.block_id, req);
    }

    const updated = allNodes.map((node) => ({
      ...node,
      existing: reqByBlock.get(node.block.id),
    }));
    setAllNodes(updated);

    const init: Record<number, NodeValue> = {};
    for (const node of updated) {
      // Solo L2 son editables
      if (node.depth !== 1) continue;
      const req = node.existing;
      if (!req?.n_questions) continue;
      init[node.block.id] = { nQuestions: req.n_questions };
    }
    setValues(init);
  }, [existingReqs, selectedArea]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mapas de uso ─────────────────────────────────────────────────────────
  const l2UsedMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const n of l2Nodes) {
      const v = values[n.block.id];
      if (v?.nQuestions) m[n.block.id] = v.nQuestions;
    }
    return m;
  }, [l2Nodes, values]);

  const l1UsedMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const l2 of l2Nodes) {
      const pid = l2.block.parent_block_id!;
      m[pid] = (m[pid] ?? 0) + (l2UsedMap[l2.block.id] ?? 0);
    }
    return m;
  }, [l2Nodes, l2UsedMap]);

  const grandTotal = useMemo(
    () => l1Nodes.reduce((s, n) => s + (l1UsedMap[n.block.id] ?? 0), 0),
    [l1Nodes, l1UsedMap],
  );

  const activeCount = useMemo(
    () => Object.values(values).filter((v) => v.nQuestions > 0).length,
    [values],
  );

  const activeL2s = useMemo(
    () => l2Nodes.filter((n) => n.block.parent_block_id === activeL1Id),
    [l2Nodes, activeL1Id],
  );

  // ── Setters ───────────────────────────────────────────────────────────────
  const setNQuestions = useCallback((blockId: number, n: number) => {
    setValues((prev) => {
      if (n <= 0) {
        const next = { ...prev };
        delete next[blockId];
        return next;
      }
      return { ...prev, [blockId]: { nQuestions: n } };
    });
  }, []);

  const clearVal = useCallback((blockId: number) => {
    setValues((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      const keys = Object.keys(inputRefs.current);
      const idx = keys.indexOf(key);
      if (idx >= 0 && idx < keys.length - 1) {
        inputRefs.current[keys[idx + 1]]?.focus();
        inputRefs.current[keys[idx + 1]]?.select();
      }
    }
  }, []);

  // ── Validaciones ──────────────────────────────────────────────────────────
  const validationErrors = useMemo(() => {
    const errs: string[] = [];

    // Validar límite L1
    for (const l1 of l1Nodes) {
      const limit = l1.existing?.n_questions;
      if (!limit) continue;
      const used = l1UsedMap[l1.block.id] ?? 0;
      if (used > limit)
        errs.push(`"${l1.block.name}": ${used} preguntas exceden el límite (${limit}).`);
    }

    // Validar límite L2
    for (const l2 of l2Nodes) {
      const limit = l2.existing?.n_questions;
      if (!limit) continue;
      const used = l2UsedMap[l2.block.id] ?? 0;
      if (used > limit)
        errs.push(`"${l2.block.name}": ${used} preguntas exceden el límite (${limit}).`);
    }

    return errs;
  }, [l1Nodes, l2Nodes, l1UsedMap, l2UsedMap]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }
    setSaving(true);
    try {
      if (!matrixId) throw new Error("matrixId es requerido");

      const activeL2Nodes = l2Nodes.filter((n) => values[n.block.id]?.nQuestions);
      if (!activeL2Nodes.length) throw new Error("Ingresa al menos un bloque con preguntas");

      const areaReqs = existingReqs.filter((r) => r.area === selectedArea);
      // Mapa blockId → reqId para reqs existentes
      const createdMap: Record<number, number> = {};
      for (const req of areaReqs) {
        if (req.block_id && req.id) createdMap[req.block_id] = req.id;
      }

      // Primero asegurar que existan los reqs de L1 (padre de L2)
      // Calcular qué L1s tienen L2 activos
      const activeL1Ids = new Set(activeL2Nodes.map((n) => n.block.parent_block_id!));

      for (const l1Id of activeL1Ids) {
        //const l1Node = l1Nodes.find((n) => n.block.id === l1Id)!;
        const l1Used = l1UsedMap[l1Id] ?? 0;

        if (createdMap[l1Id] != null) {
          // Actualizar n_questions del L1 con la suma de sus L2
          await UpdateMatrixRequirement(createdMap[l1Id], { n_questions: l1Used });
        } else {
          // Necesitamos el req raíz (parent_id del L1)
          // El backend requiere parent_id; buscar req raíz de la matriz/área
          let rootReq = areaReqs.find((r) => r.parent_id == null);
          if (!rootReq) {
            rootReq = await CreateMatrixRequirement({
              matrix_id: matrixId,
              area: selectedArea,
              block_id: undefined,
              n_questions: grandTotal,
              parent_id: undefined,
            });
            areaReqs.push(rootReq);
          }

          const created = await CreateMatrixRequirement({
            matrix_id: matrixId,
            area: selectedArea,
            block_id: l1Id,
            n_questions: l1Used,
            parent_id: rootReq.id,
          });
          createdMap[l1Id] = created.id!;
        }
      }

      // Ahora procesar L2
      for (const l2Node of activeL2Nodes) {
        const nQ = values[l2Node.block.id]!.nQuestions;
        const parentReqId = createdMap[l2Node.block.parent_block_id!];
        if (parentReqId == null)
          throw new Error(`No se encontró req padre para bloque ${l2Node.block.parent_block_id}`);

        if (createdMap[l2Node.block.id] != null) {
          await UpdateMatrixRequirement(createdMap[l2Node.block.id], { n_questions: nQ });
        } else {
          const created = await CreateMatrixRequirement({
            matrix_id: matrixId,
            area: selectedArea,
            block_id: l2Node.block.id,
            n_questions: nQ,
            parent_id: parentReqId,
          });
          createdMap[l2Node.block.id] = created.id!;
        }
      }

      setSuccessOpen(true);
      setTimeout(() => (onSuccess ? onSuccess() : navigate(-1)), 1200);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={32} />
      </Container>
    );
  }

  const activeL1Node = l1Nodes.find((n) => n.block.id === activeL1Id);
  const l1Limit = activeL1Node?.existing?.n_questions;
  const l1Used = activeL1Id ? (l1UsedMap[activeL1Id] ?? 0) : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          size="small"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
          sx={{ color: "text.secondary", flexShrink: 0 }}
        >
          Volver
        </Button>
        <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1, minWidth: 140 }}>
          Requerimientos de la matriz
        </Typography>

        {/* Selector de área */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={selectedArea}
          onChange={(_, v) => v && setSelectedArea(v)}
        >
          {availableAreas.map((area) => (
            <ToggleButton
              key={area}
              value={area}
              sx={{
                px: 1.5,
                fontSize: "0.75rem",
                textTransform: "none",
                fontWeight: selectedArea === area ? 600 : 400,
              }}
            >
              {AREA_LABELS[area]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ display: "flex", gap: 1 }}>
          {activeCount > 0 && (
            <Chip size="small" label={`${activeCount} bloques`} color="primary" variant="outlined" />
          )}
          {grandTotal > 0 && (
            <Chip
              size="small"
              label={`${grandTotal} preguntas`}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {/* ── Tabs L1 ── */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {l1Nodes.map((l1) => {
          const used = l1UsedMap[l1.block.id] ?? 0;
          const limit = l1.existing?.n_questions;
          const isActive = l1.block.id === activeL1Id;
          const isOver = !!limit && used > limit;
          return (
            <Paper
              key={l1.block.id}
              variant="outlined"
              onClick={() => setActiveL1Id(l1.block.id)}
              sx={{
                px: 2,
                py: 1,
                cursor: "pointer",
                borderRadius: 2,
                minWidth: 120,
                border: "1.5px solid",
                borderColor: isOver ? "error.main" : isActive ? "primary.main" : "divider",
                bgcolor: isActive ? (isOver ? "error.50" : "primary.50") : "background.paper",
                transition: "all .15s",
                "&:hover": { borderColor: isOver ? "error.main" : "primary.main" },
                position: "relative",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={isActive ? 600 : 400}
                noWrap
                sx={{ color: isOver ? "error.main" : isActive ? "primary.main" : "text.primary" }}
              >
                {l1.block.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: budgetColor(used, limit), fontSize: "0.7rem", display: "block" }}
              >
                {used > 0
                  ? limit
                    ? `${used} / ${limit} pregs`
                    : `${used} pregs`
                  : limit
                  ? `Límite: ${limit}`
                  : "Sin asignar"}
              </Typography>
              {isOver && (
                <WarnIcon
                  sx={{ position: "absolute", top: 4, right: 4, fontSize: "0.85rem", color: "error.main" }}
                />
              )}
            </Paper>
          );
        })}
      </Box>

      {/* ── Contenido del L1 activo ── */}
      {activeL1Node && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Cabecera L1 */}
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: budgetBg(l1Used, l1Limit),
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
              {activeL1Node.block.name}
            </Typography>
            <Chip
              size="small"
              label="edición en nivel 2"
              sx={{ fontSize: "0.65rem", bgcolor: "action.hover", color: "text.secondary" }}
            />
            {l1Limit && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.round((l1Used / l1Limit) * 100))}
                  color={l1Used > l1Limit ? "error" : l1Used === l1Limit ? "success" : "primary"}
                  sx={{ width: 80, borderRadius: 4, height: 6 }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ color: budgetColor(l1Used, l1Limit), minWidth: 64, fontSize: "0.72rem" }}
                >
                  {l1Used} / {l1Limit}
                </Typography>
              </Box>
            )}
            {!l1Limit && l1Used > 0 && (
              <Typography
                variant="caption"
                color="primary.main"
                fontWeight={600}
                sx={{ fontSize: "0.72rem" }}
              >
                {l1Used} preguntas
              </Typography>
            )}
          </Box>

          {/* Tabla L2 */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: "grey.50",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    pl: 3,
                  }}
                >
                  Subtema
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "grey.50",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    width: 100,
                  }}
                >
                  Código
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "grey.50",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    textAlign: "center",
                    width: 140,
                  }}
                >
                  N° Preguntas
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeL2s.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{
                      py: 3,
                      textAlign: "center",
                      color: "text.disabled",
                      fontStyle: "italic",
                      fontSize: "0.8rem",
                    }}
                  >
                    Sin subtemas disponibles
                  </TableCell>
                </TableRow>
              ) : (
                activeL2s.map((l2) => {
                  const bv = values[l2.block.id];
                  const hasValue = !!bv?.nQuestions;
                  const nQ = bv?.nQuestions ?? 0;
                  const l2Limit = l2.existing?.n_questions;
                  const exceedsLimit = !!l2Limit && nQ > l2Limit;
                  const refKey = `nq-${l2.block.id}`;

                  return (
                    <TableRow
                      key={l2.block.id}
                      sx={{
                        bgcolor: hasValue ? "rgba(59,130,246,0.04)" : "background.paper",
                        borderLeft: "3px solid",
                        borderLeftColor: hasValue
                          ? exceedsLimit
                            ? "error.main"
                            : "primary.light"
                          : "transparent",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      {/* Nombre */}
                      <TableCell sx={{ py: 0.75, pl: 3 }}>
                        <Typography
                          variant="body2"
                          fontSize="0.83rem"
                          fontWeight={hasValue ? 600 : 400}
                        >
                          {l2.block.name}
                        </Typography>
                        {l2Limit && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: budgetColor(nQ, l2Limit),
                              fontSize: "0.68rem",
                              display: "block",
                            }}
                          >
                            Límite: {l2Limit} preguntas
                          </Typography>
                        )}
                      </TableCell>

                      {/* Código */}
                      <TableCell>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                        >
                          {l2.block.code || "—"}
                        </Typography>
                      </TableCell>

                      {/* N° Preguntas */}
                      <TableCell sx={{ textAlign: "center", py: 0.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.25,
                          }}
                        >
                          <TextField
                            type="number"
                            size="small"
                            value={hasValue ? nQ : ""}
                            placeholder="0"
                            inputRef={(el) => {
                              inputRefs.current[refKey] = el;
                            }}
                            onChange={(e) =>
                              setNQuestions(
                                l2.block.id,
                                Math.max(0, parseInt(e.target.value || "0", 10)),
                              )
                            }
                            onKeyDown={(e) => handleKeyDown(e, refKey)}
                            inputProps={{
                              min: 0,
                              style: {
                                textAlign: "center",
                                padding: "3px 4px",
                                width: 68,
                                fontWeight: hasValue ? 700 : 400,
                                fontSize: "0.85rem",
                              },
                              onWheel: (e) => (e.target as HTMLInputElement).blur(),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 1,
                                "& fieldset": {
                                  borderColor: hasValue
                                    ? exceedsLimit
                                      ? "#ef4444"
                                      : "#3b82f6"
                                    : "divider",
                                  borderWidth: hasValue ? 1.5 : 1,
                                },
                              },
                            }}
                          />
                          {hasValue && (
                            <Tooltip title="Limpiar">
                              <IconButton
                                size="small"
                                onClick={() => clearVal(l2.block.id)}
                                sx={{
                                  p: 0.2,
                                  color: "text.disabled",
                                  "&:hover": { color: "error.main" },
                                }}
                              >
                                <ClearIcon sx={{ fontSize: "0.8rem" }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        {exceedsLimit && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ fontSize: "0.65rem", display: "block", textAlign: "center" }}
                          >
                            Excede límite ({l2Limit})
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Fila total L1 */}
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell colSpan={2} sx={{ py: 0.75, pl: 3 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    fontSize="0.72rem"
                  >
                    Total · {activeL1Node.block.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ textAlign: "center", py: 0.75 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: budgetColor(l1Used, l1Limit), fontSize: "0.85rem" }}
                  >
                    {l1Used > 0 ? (l1Limit ? `${l1Used} / ${l1Limit}` : l1Used) : "—"}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Footer total L1 */}
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: l1Used > 0 ? budgetBg(l1Used, l1Limit) : "grey.50",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              color="text.secondary"
              sx={{ flex: 1, fontSize: "0.8rem" }}
            >
              Total · {activeL1Node.block.name}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: budgetColor(l1Used, l1Limit), fontSize: "0.9rem" }}
            >
              {l1Used > 0
                ? l1Limit
                  ? `${l1Used} / ${l1Limit}`
                  : `${l1Used} preguntas`
                : "—"}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* ── Errores de validación ── */}
      {validationErrors.length > 0 && (
        <Box
          sx={{
            mt: 1.5,
            px: 2,
            py: 1,
            bgcolor: "error.50",
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "error.100",
          }}
        >
          {validationErrors.map((err, i) => (
            <Typography key={i} variant="caption" color="error" display="block" fontWeight={500}>
              ⚠ {err}
            </Typography>
          ))}
        </Box>
      )}

      {/* ── Acciones ── */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {activeCount > 0 && (
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => setValues({})}
            sx={{ mr: "auto", fontSize: "0.75rem" }}
          >
            Limpiar todo
          </Button>
        )}
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
          disabled={saving}
          sx={{ color: "text.secondary", borderColor: "divider" }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : <AddIcon />
          }
          onClick={handleSubmit}
          disabled={saving || grandTotal === 0 || validationErrors.length > 0}
          disableElevation
          sx={{ minWidth: 190, fontWeight: 600 }}
        >
          {saving ? "Guardando..." : `Guardar (${grandTotal} preguntas)`}
        </Button>
      </Box>

      {/* ── Snackbars ── */}
      <Snackbar
        open={successOpen}
        autoHideDuration={1500}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          Requerimientos guardados correctamente
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}