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
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  Article as ArticleIcon,
  WarningAmber as WarnIcon,
} from "@mui/icons-material";
import { CreateExamRequirement } from "../../../../application/exam/CreateExamRequirement";
import { UpdateExamRequirement } from "../../../../application/exam/UpdateExamRequirement";
import { ExamRequirementApi } from "../../../../infrastructure/api/ExamRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ExamRequirement } from "../../../../models/ExamRequirement";
import type { Block } from "../../../../models/Block";
import ExamTextModal from "./ExamTextModal";

// ─── tipos ────────────────────────────────────────────────────────────────────
type Difficulty = "EASY" | "NORMAL" | "HARD";
type Area = "UNICA" | "BIOMEDICAS" | "SOCIALES" | "INGENIERIAS";

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD"];
const AREAS: Area[] = ["UNICA", "BIOMEDICAS", "SOCIALES", "INGENIERIAS"];

const DIFF_CONFIG: Record<Difficulty, { bg: string; border: string; text: string }> = {
  EASY:   { bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  NORMAL: { bg: "#fffbeb", border: "#fcd34d", text: "#b45309" },
  HARD:   { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c" },
};

const AREA_LABELS: Record<Area, string> = {
  UNICA: "Única",
  BIOMEDICAS: "Biomédicas",
  SOCIALES: "Sociales",
  INGENIERIAS: "Ingenierías",
};

interface NodeValue {
  nQuestions: number;
  splitByDifficulty: boolean;
  diffQuestions: Record<Difficulty, number>;
}

interface TreeNode {
  block: Block;
  depth: number;
  path: Block[];
  childIds: number[];
  directChildIds: number[];
  isLeaf: boolean;
  existing?: ExamRequirement;
  existingDiffChildren?: ExamRequirement[];
}

const emptyDiff = (): Record<Difficulty, number> => ({ EASY: 0, NORMAL: 0, HARD: 0 });
const diffSum = (dq: Record<Difficulty, number>) => DIFFICULTIES.reduce((s, d) => s + (dq[d] ?? 0), 0);

// ─── buildNodes ───────────────────────────────────────────────────────────────
const buildNodes = (blocks: Block[]): TreeNode[] => {
  const nodes: TreeNode[] = [];
  const getDescendantIds = (id: number): number[] => {
    const direct = blocks.filter((b) => b.parent_block_id === id);
    const ids: number[] = [];
    for (const c of direct) { ids.push(c.id); ids.push(...getDescendantIds(c.id)); }
    return ids;
  };
  const recurse = (parentId: number | null, depth: number, path: Block[]) => {
    const children = blocks.filter((b) => b.parent_block_id === parentId).sort((a, b) => a.id - b.id);
    for (const block of children) {
      const p = [...path, block];
      const directChildren = blocks.filter((b) => b.parent_block_id === block.id);
      nodes.push({
        block, depth, path: p,
        childIds: getDescendantIds(block.id),
        directChildIds: directChildren.map((b) => b.id),
        isLeaf: directChildren.length === 0,
      });
      recurse(block.id, depth + 1, p);
    }
  };
  recurse(null, 0, []);
  return nodes;
};

// ─── helpers de color para presupuesto ────────────────────────────────────────
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

// ─── componente ───────────────────────────────────────────────────────────────
export default function ExamRequirementManager({
  initialExamId,
  onSuccess,
}: { initialExamId?: string; onSuccess?: () => void } = {}) {
  const navigate = useNavigate();
  const { examId: urlExamId } = useParams<{ examId: string }>();
  const examId = initialExamId || urlExamId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allNodes, setAllNodes] = useState<TreeNode[]>([]);
  const [existingReqs, setExistingReqs] = useState<ExamRequirement[]>([]);

  // ── navegación ───────────────────────────────────────────────────────────────
  const [selectedArea, setSelectedArea] = useState<Area>("UNICA");
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  const [expandedL2Ids, setExpandedL2Ids] = useState<Set<number>>(new Set());

  // ── valores (solo nivel 3) ───────────────────────────────────────────────────
  const [values, setValues] = useState<Record<number, NodeValue>>({});

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textModal, setTextModal] = useState<{ open: boolean; block: Block | null }>({ open: false, block: null });

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── carga ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [blocksData, reqsData] = await Promise.all([
          GetBlocks(),
          examId ? ExamRequirementApi.getByExam(examId) : Promise.resolve([]),
        ]);
        setExistingReqs(reqsData);
        setAllNodes(buildNodes(blocksData));
      } catch { setErrorMessage("Error al cargar datos"); }
      finally { setLoading(false); }
    };
    load();
  }, [examId]);

  // ── nodos por profundidad ─────────────────────────────────────────────────────
  const l1Nodes = useMemo(() => allNodes.filter((n) => n.depth === 0), [allNodes]);
  const l2Nodes = useMemo(() => allNodes.filter((n) => n.depth === 1), [allNodes]);

  // Un nodo es editable si tiene has_text (depth>=1) o es hoja real (depth>=2)
  const isEditableNode = useCallback((n: TreeNode) =>
    (n.block.has_text && n.depth >= 1) || (n.isLeaf && n.depth >= 2), []);

  const editableNodes = useMemo(() => allNodes.filter(isEditableNode), [allNodes, isEditableNode]);

  // L2 con has_text (fila directa, sin tabla interior)
  //const l2LeafNodes = useMemo(() => l2Nodes.filter((n) => n.block.has_text), [l2Nodes]);

  // Áreas disponibles: solo las que tienen requisitos ya guardados.
  // Fallback a todas si el examen es nuevo.
  const availableAreas = useMemo<Area[]>(() => {
    const fromReqs = [...new Set(existingReqs.map((r) => r.area as Area))].filter(Boolean);
    return fromReqs.length > 0 ? fromReqs : AREAS;
  }, [existingReqs]);


  // ── activar primer L1 por defecto ─────────────────────────────────────────────
  useEffect(() => {
    if (l1Nodes.length > 0 && activeL1Id === null) {
      setActiveL1Id(l1Nodes[0].block.id);
    }
  }, [l1Nodes, activeL1Id]);

  // ── sincronizar selectedArea si el área activa no está disponible ─────────────
  useEffect(() => {
    if (availableAreas.length > 0 && !availableAreas.includes(selectedArea)) {
      setSelectedArea(availableAreas[0]);
    }
  }, [availableAreas]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── expandir todos los L2 al cambiar de tab o área ───────────────────────────
  useEffect(() => {
    if (activeL1Id === null) return;
    const l2sOfL1 = l2Nodes.filter((n) => n.block.parent_block_id === activeL1Id);
    setExpandedL2Ids(new Set(l2sOfL1.map((n) => n.block.id)));
  }, [activeL1Id, selectedArea, l2Nodes]);

  // ── cargar valores al cambiar área (todos los nodos editables) ───────────────
  useEffect(() => {
    if (allNodes.length === 0) return;
    const areaReqs = existingReqs.filter((r) => r.area === selectedArea);
    const reqByBlock = new Map<number, ExamRequirement>();
    const diffByParent = new Map<number, ExamRequirement[]>();

    for (const req of areaReqs) {
      if (!req.block_id) continue;
      if (req.difficulty) {
        if (req.parent_id != null) {
          if (!diffByParent.has(req.parent_id)) diffByParent.set(req.parent_id, []);
          diffByParent.get(req.parent_id)!.push(req);
        }
      } else {
        reqByBlock.set(req.block_id, req);
      }
    }

    const updated = allNodes.map((node) => {
      const existing = reqByBlock.get(node.block.id);
      const existingDiffChildren = existing?.id
        ? (diffByParent.get(existing.id) ?? []).filter((r) => r.block_id === node.block.id)
        : [];
      return { ...node, existing, existingDiffChildren };
    });
    setAllNodes(updated);

    // Cargar valores para TODOS los nodos editables (cualquier profundidad)
    const init: Record<number, NodeValue> = {};
    for (const node of updated) {
      if (!isEditableNode(node)) continue;
      const req = node.existing;
      if (!req?.n_questions) continue;
      const hasDiff = (node.existingDiffChildren ?? []).length > 0;
      const dq = emptyDiff();
      if (hasDiff) {
        for (const dr of node.existingDiffChildren!) {
          if (dr.difficulty) dq[dr.difficulty as Difficulty] = dr.n_questions ?? 0;
        }
      }
      init[node.block.id] = { nQuestions: req.n_questions, splitByDifficulty: hasDiff, diffQuestions: dq };
    }
    setValues(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingReqs, selectedArea]);

  // ── totales por L2 y L1 ───────────────────────────────────────────────────────
  // Para cada nodo editable, su contribución sube por toda la cadena de ancestros.
  // l2UsedMap[l2Id] = suma de todos los nodos editables cuyo path[1] = l2Id
  const l2UsedMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const n of editableNodes) {
      const v = values[n.block.id];
      if (!v?.nQuestions) continue;
      // El ancestro L2 es path[1] para depth>=2, o el propio nodo si depth===1 (has_text L2)
      const l2Anc = n.depth === 1 ? n.block : n.path[1];
      if (l2Anc) m[l2Anc.id] = (m[l2Anc.id] ?? 0) + v.nQuestions;
    }
    return m;
  }, [editableNodes, values]);

  // nodeAutoSumMap: para nodos intermedios no-editables, muestra la suma de sus descendientes
  const nodeAutoSumMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const n of editableNodes) {
      const v = values[n.block.id];
      if (!v?.nQuestions) continue;
      for (const anc of n.path.slice(0, -1)) {
        const ancNode = allNodes.find((node) => node.block.id === anc.id);
        if (ancNode && ancNode.depth >= 1) m[anc.id] = (m[anc.id] ?? 0) + v.nQuestions;
      }
    }
    return m;
  }, [editableNodes, values, allNodes]);

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

  // ── L2 bajo el L1 activo ──────────────────────────────────────────────────────
  const activeL2s = useMemo(
    () => l2Nodes.filter((n) => n.block.parent_block_id === activeL1Id),
    [l2Nodes, activeL1Id],
  );

  // ── handlers ─────────────────────────────────────────────────────────────────
  const setNQuestions = useCallback((blockId: number, n: number) => {
    setValues((prev) => {
      if (n <= 0) { const next = { ...prev }; delete next[blockId]; return next; }
      return {
        ...prev,
        [blockId]: {
          nQuestions: n,
          splitByDifficulty: prev[blockId]?.splitByDifficulty ?? false,
          diffQuestions: prev[blockId]?.diffQuestions ?? emptyDiff(),
        },
      };
    });
  }, []);

  const toggleSplit = useCallback((blockId: number) => {
    setValues((prev) => {
      const cur = prev[blockId];
      if (!cur) return prev;
      const next = !cur.splitByDifficulty;
      return { ...prev, [blockId]: { ...cur, splitByDifficulty: next, diffQuestions: next ? cur.diffQuestions : emptyDiff() } };
    });
  }, []);

  const setDiffQ = useCallback((blockId: number, diff: Difficulty, n: number) => {
    setValues((prev) => {
      const cur = prev[blockId];
      if (!cur) return prev;
      return { ...prev, [blockId]: { ...cur, diffQuestions: { ...cur.diffQuestions, [diff]: Math.max(0, n) } } };
    });
  }, []);

  const clearVal = useCallback((blockId: number) => {
    setValues((prev) => { const next = { ...prev }; delete next[blockId]; return next; });
  }, []);

  const toggleL2 = useCallback((l2Id: number) => {
    setExpandedL2Ids((prev) => {
      const next = new Set(prev);
      if (next.has(l2Id)) next.delete(l2Id);
      else next.add(l2Id);
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

  // ── validaciones ──────────────────────────────────────────────────────────────
  const validationErrors = useMemo(() => {
    const errs: string[] = [];

    // Validación dificultades en todos los nodos editables (L3 + L2 has_text)
    for (const node of editableNodes) {
      const v = values[node.block.id];
      if (!v?.nQuestions) continue;
      if (v.splitByDifficulty) {
        const tot = diffSum(v.diffQuestions);
        if (tot === 0) errs.push(`"${node.block.name}": asigna preguntas a las dificultades.`);
        else if (tot !== v.nQuestions) errs.push(`"${node.block.name}": suma dificultad (${tot}) ≠ total (${v.nQuestions}).`);
      }
    }

    // Validación límite L2 (solo L2 que tienen hijos, no los has_text que son hojas)
    for (const l2 of l2Nodes.filter((n) => !n.block.has_text)) {
      const limit = l2.existing?.n_questions;
      if (!limit) continue;
      const used = l2UsedMap[l2.block.id] ?? 0;
      if (used > limit) errs.push(`"${l2.block.name}": ${used} preguntas exceden el límite (${limit}).`);
    }

    // Validación límite L1
    for (const l1 of l1Nodes) {
      const limit = l1.existing?.n_questions;
      if (!limit) continue;
      const used = l1UsedMap[l1.block.id] ?? 0;
      if (used > limit) errs.push(`"${l1.block.name}": ${used} preguntas exceden el límite (${limit}).`);
    }

    return errs;
  }, [editableNodes, l2Nodes, l1Nodes, values, l2UsedMap, l1UsedMap]);

  // ── submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (validationErrors.length > 0) { setErrorMessage(validationErrors[0]); return; }
    setSaving(true);
    try {
      if (!examId) throw new Error("examId es requerido");
      const activeNodes = editableNodes.filter((n) => values[n.block.id]?.nQuestions);
      if (!activeNodes.length) throw new Error("Ingresa al menos un bloque con preguntas");

      const areaReqs = existingReqs.filter((r) => r.area === selectedArea);
      const createdMap: Record<number, number> = {};
      for (const req of areaReqs) { if (req.block_id && req.id && !req.difficulty) createdMap[req.block_id] = req.id; }
      const existingDiffMap: Record<number, ExamRequirement[]> = {};
      for (const req of areaReqs) {
        if (req.difficulty && req.parent_id) {
          if (!existingDiffMap[req.parent_id]) existingDiffMap[req.parent_id] = [];
          existingDiffMap[req.parent_id].push(req);
        }
      }

      interface PE { nQ: number; depth: number; splitByDifficulty: boolean; diffQuestions: Record<Difficulty, number> }
      const nodeMap: Record<number, PE> = {};

      for (const node of activeNodes) {
        const bv = values[node.block.id]!;
        nodeMap[node.block.id] = { nQ: bv.nQuestions, depth: node.depth, splitByDifficulty: bv.splitByDifficulty, diffQuestions: bv.diffQuestions };
        for (const anc of node.path.slice(0, -1)) {
          const aNode = allNodes.find((n) => n.block.id === anc.id)!;
          if (!nodeMap[anc.id]) nodeMap[anc.id] = { nQ: 0, depth: aNode.depth, splitByDifficulty: false, diffQuestions: emptyDiff() };
          nodeMap[anc.id].nQ += bv.nQuestions;
        }
      }

      const toProcess = Object.entries(nodeMap)
        .map(([id, e]) => ({ blockId: Number(id), ...e }))
        .sort((a, b) => a.depth - b.depth);

      let rootReq = areaReqs.find((r) => r.parent_id == null);
      if (!rootReq) {
        rootReq = await CreateExamRequirement({
          exam_id: examId, area: selectedArea, block_id: undefined,
          n_questions: activeNodes.reduce((s, n) => s + (values[n.block.id]?.nQuestions ?? 0), 0),
          parent_id: undefined, difficulty: undefined,
        });
        areaReqs.push(rootReq);
      }
      const rootId = rootReq.id!;

      for (const item of toProcess) {
        if (!item.nQ) continue;
        const node = allNodes.find((n) => n.block.id === item.blockId)!;
        const parentBId = node.block.parent_block_id;
        const parentReqId = parentBId == null ? rootId : createdMap[parentBId];
        if (parentReqId == null) throw new Error(`No se encontró req padre para bloque ${parentBId}`);

        let thisId: number;
        if (createdMap[item.blockId] != null) {
          await UpdateExamRequirement(createdMap[item.blockId], { n_questions: item.nQ });
          thisId = createdMap[item.blockId];
        } else {
          const c = await CreateExamRequirement({ exam_id: examId, area: selectedArea, block_id: item.blockId, n_questions: item.nQ, parent_id: parentReqId, difficulty: undefined });
          thisId = c.id!; createdMap[item.blockId] = thisId;
        }

        if (item.splitByDifficulty) {
          const kids = existingDiffMap[thisId] ?? [];
          for (const diff of DIFFICULTIES) {
            const nQ = item.diffQuestions[diff] ?? 0;
            if (!nQ) continue;
            const ex = kids.find((r) => r.difficulty === diff);
            if (ex?.id) await UpdateExamRequirement(ex.id, { n_questions: nQ });
            else await CreateExamRequirement({ exam_id: examId, area: selectedArea, block_id: item.blockId, n_questions: nQ, parent_id: thisId, difficulty: diff });
          }
        }
      }

      setSuccessOpen(true);
      setTimeout(() => (onSuccess ? onSuccess() : navigate(-1)), 1200);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error ?? err.message);
    } finally { setSaving(false); }
  };

  // ── render ────────────────────────────────────────────────────────────────────
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
        <Button startIcon={<ArrowBackIcon />} variant="text" size="small"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
          sx={{ color: "text.secondary", flexShrink: 0 }}>
          Volver
        </Button>
        <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1, minWidth: 140 }}>
          Requerimientos del examen
        </Typography>

        {/* Selector de área — solo las áreas del examen */}
        <ToggleButtonGroup size="small" exclusive value={selectedArea} onChange={(_, v) => v && setSelectedArea(v)}>
          {availableAreas.map((area) => (
            <ToggleButton key={area} value={area}
              sx={{ px: 1.5, fontSize: "0.75rem", textTransform: "none", fontWeight: selectedArea === area ? 600 : 400 }}>
              {AREA_LABELS[area]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ display: "flex", gap: 1 }}>
          {activeCount > 0 && <Chip size="small" label={`${activeCount} bloques`} color="primary" variant="outlined" />}
          {grandTotal > 0 && <Chip size="small" label={`${grandTotal} preguntas`} color="primary" sx={{ fontWeight: 600 }} />}
        </Box>
      </Box>

      {/* ── Tabs nivel 1 ── */}
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
                px: 2, py: 1, cursor: "pointer", borderRadius: 2, minWidth: 120,
                border: "1.5px solid",
                borderColor: isOver ? "error.main" : isActive ? "primary.main" : "divider",
                bgcolor: isActive ? (isOver ? "error.50" : "primary.50") : "background.paper",
                transition: "all .15s",
                "&:hover": { borderColor: isOver ? "error.main" : "primary.main" },
                position: "relative",
              }}
            >
              <Typography variant="body2" fontWeight={isActive ? 600 : 400} noWrap
                sx={{ color: isOver ? "error.main" : isActive ? "primary.main" : "text.primary" }}>
                {l1.block.name}
              </Typography>
              <Typography variant="caption" sx={{ color: budgetColor(used, limit), fontSize: "0.7rem", display: "block" }}>
                {used > 0
                  ? limit ? `${used} / ${limit} pregs` : `${used} pregs`
                  : limit ? `Límite: ${limit}` : "Sin asignar"}
              </Typography>
              {isOver && (
                <WarnIcon sx={{ position: "absolute", top: 4, right: 4, fontSize: "0.85rem", color: "error.main" }} />
              )}
            </Paper>
          );
        })}
      </Box>

      {/* ── Contenido del L1 activo ── */}
      {activeL1Node && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Cabecera L1 */}
          <Box sx={{
            px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5,
            bgcolor: budgetBg(l1Used, l1Limit),
            borderBottom: "1px solid", borderColor: "divider",
          }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
              {activeL1Node.block.name}
            </Typography>
            <Chip
              size="small"
              label="edición solo en nivel 3"
              sx={{ fontSize: "0.65rem", bgcolor: "action.hover", color: "text.secondary" }}
            />
            {l1Limit && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.round(l1Used / l1Limit * 100))}
                  color={l1Used > l1Limit ? "error" : l1Used === l1Limit ? "success" : "primary"}
                  sx={{ width: 80, borderRadius: 4, height: 6 }}
                />
                <Typography variant="caption" fontWeight={600}
                  sx={{ color: budgetColor(l1Used, l1Limit), minWidth: 64, fontSize: "0.72rem" }}>
                  {l1Used} / {l1Limit}
                </Typography>
              </Box>
            )}
            {!l1Limit && l1Used > 0 && (
              <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: "0.72rem" }}>
                {l1Used} preguntas
              </Typography>
            )}
          </Box>

          {/* Secciones L2 */}
          {activeL2s.map((l2) => {
            const isLeafL2 = l2.block.has_text;
            const l2Used = l2UsedMap[l2.block.id] ?? 0;
            const l2Limit = l2.existing?.n_questions;
            const l2Pct = l2Limit ? Math.min(100, Math.round(l2Used / l2Limit * 100)) : 0;
            const l2Over = !!l2Limit && l2Used > l2Limit;
            const isOpen = expandedL2Ids.has(l2.block.id);
            //const l3sOfL2 = l3Nodes.filter((n) => n.block.parent_block_id === l2.block.id);

            // ── L2 con has_text: fila editable directa ──────────────────────────
            if (isLeafL2) {
              const bv = values[l2.block.id];
              const hasValue = !!bv?.nQuestions;
              const nQ = bv?.nQuestions ?? 0;
              const split = bv?.splitByDifficulty ?? false;
              const dq = bv?.diffQuestions ?? emptyDiff();
              const exceedsL1 = !!l2Limit && l2Used > l2Limit;
              const refKey = `nq-${l2.block.id}`;

              return (
                <Box key={l2.block.id} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow sx={{
                        bgcolor: hasValue ? "rgba(59,130,246,0.04)" : "background.paper",
                        borderLeft: "3px solid",
                        borderLeftColor: hasValue ? (exceedsL1 ? "error.main" : "primary.light") : "transparent",
                        "&:hover": { bgcolor: "action.hover" },
                      }}>
                        {/* Nombre con badge "has_text" */}
                        <TableCell sx={{ py: 0.75, pl: 3 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ArticleIcon sx={{ fontSize: "0.85rem", color: hasValue ? "info.main" : "text.disabled" }} />
                            <Box>
                              <Typography variant="body2" fontSize="0.83rem" fontWeight={hasValue ? 600 : 500}>
                                {l2.block.name}
                              </Typography>
                              {split && hasValue && (
                                <Chip size="small" label="div. dificultad"
                                  sx={{ mt: 0.3, fontSize: "0.6rem", height: 14, bgcolor: "#ede9fe", color: "#6d28d9", "& .MuiChip-label": { px: 0.75 } }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Código */}
                        <TableCell sx={{ width: 80 }}>
                          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
                            {l2.block.code || "—"}
                          </Typography>
                        </TableCell>

                        {/* N° Preguntas */}
                        <TableCell sx={{ textAlign: "center", py: 0.5, width: 110 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25 }}>
                            <TextField
                              type="number" size="small"
                              value={hasValue ? nQ : ""} placeholder="0"
                              inputRef={(el) => { inputRefs.current[refKey] = el; }}
                              onChange={(e) => setNQuestions(l2.block.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                              onKeyDown={(e) => handleKeyDown(e, refKey)}
                              inputProps={{
                                min: 0,
                                style: { textAlign: "center", padding: "3px 4px", width: 58, fontWeight: hasValue ? 700 : 400, fontSize: "0.85rem" },
                                onWheel: (e) => (e.target as HTMLInputElement).blur(),
                              }}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, "& fieldset": { borderColor: hasValue ? (exceedsL1 ? "#ef4444" : "#3b82f6") : "divider", borderWidth: hasValue ? 1.5 : 1 } } }}
                            />
                            {hasValue && (
                              <Tooltip title="Limpiar">
                                <IconButton size="small" onClick={() => clearVal(l2.block.id)}
                                  sx={{ p: 0.2, color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                  <ClearIcon sx={{ fontSize: "0.8rem" }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                          {hasValue && (
                            <Button size="small" onClick={() => toggleSplit(l2.block.id)}
                              sx={{ mt: 0.3, fontSize: "0.6rem", textTransform: "none", py: 0, px: 0.75, minWidth: 0,
                                color: split ? "#6d28d9" : "text.secondary",
                                border: "1px solid", borderColor: split ? "#c4b5fd" : "divider", borderRadius: 1 }}>
                              {split ? "Quitar dif." : "+ Dificultad"}
                            </Button>
                          )}
                        </TableCell>

                        {/* Columnas dificultad */}
                        {DIFFICULTIES.map((diff, di) => {
                          const cfg = DIFF_CONFIG[diff];
                          const val = dq[diff];
                          const diffRefKey = `diff-${l2.block.id}-${diff}`;
                          return (
                            <TableCell key={diff} sx={{
                              textAlign: "center", py: 0.5, px: 0.75, width: 80,
                              borderLeft: `1px solid ${di === 0 ? "#bbf7d0" : di === 1 ? "#fde68a" : "#fecaca"}`,
                              bgcolor: split && hasValue ? cfg.bg : "transparent", transition: "background .15s",
                            }}>
                              {!hasValue || !split ? (
                                <Typography variant="caption" color="text.disabled">—</Typography>
                              ) : (
                                <TextField type="number" size="small"
                                  value={val || ""} placeholder="0"
                                  inputRef={(el) => { inputRefs.current[diffRefKey] = el; }}
                                  onChange={(e) => setDiffQ(l2.block.id, diff, parseInt(e.target.value || "0", 10))}
                                  onKeyDown={(e) => handleKeyDown(e, diffRefKey)}
                                  inputProps={{
                                    min: 0, max: nQ,
                                    style: { textAlign: "center", padding: "2px 4px", width: 52, fontSize: "0.8rem", fontWeight: val ? 700 : 400, color: val ? cfg.text : undefined },
                                    onWheel: (e) => (e.target as HTMLInputElement).blur(),
                                  }}
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: val ? cfg.bg : "transparent", "& fieldset": { borderColor: val ? cfg.border : "divider", borderWidth: val ? 1.5 : 1 } } }}
                                />
                              )}
                            </TableCell>
                          );
                        })}

                        {/* Textos */}
                        <TableCell sx={{ py: 0.5, textAlign: "center", width: 70 }}>
                          {hasValue ? (
                            <Tooltip title="Gestionar textos">
                              <IconButton size="small" color="info"
                                onClick={() => setTextModal({ open: true, block: l2.block })}
                                sx={{ p: 0.5, border: "1px solid", borderColor: "info.200", borderRadius: 1 }}>
                                <ArticleIcon sx={{ fontSize: "0.9rem" }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Fila estado dificultad */}
                      {split && hasValue && (() => {
                        const ds = diffSum(dq);
                        const diffOk = ds === nQ && ds > 0;
                        const diffMismatch = ds > 0 && ds !== nQ;
                        return (
                          <TableRow sx={{ bgcolor: "rgba(139,92,246,0.03)", borderLeft: "3px solid #8b5cf6" }}>
                            <TableCell colSpan={2} sx={{ py: 0.5, pl: 3 }}>
                              <Typography variant="caption" sx={{ fontStyle: "italic", fontSize: "0.68rem", color: "text.secondary" }}>
                                {l2.block.name} · división activa
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", py: 0.5 }} />
                            {DIFFICULTIES.map((diff, di) => {
                              const cfg = DIFF_CONFIG[diff];
                              const val = dq[diff];
                              return (
                                <TableCell key={diff} sx={{ textAlign: "center", py: 0.5, px: 0.75, borderLeft: `1px solid ${di === 0 ? "#bbf7d0" : di === 1 ? "#fde68a" : "#fecaca"}` }}>
                                  {val > 0
                                    ? <Typography variant="caption" sx={{ fontWeight: 700, color: cfg.text, fontSize: "0.72rem" }}>{val}</Typography>
                                    : <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>0</Typography>}
                                </TableCell>
                              );
                            })}
                            <TableCell sx={{ textAlign: "center", py: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.7rem", color: diffOk ? "success.main" : diffMismatch ? "error.main" : "text.disabled" }}>
                                {diffOk ? `✓ ${ds}` : `${ds}/${nQ}`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </Box>
              );
            }

            // ── L2 normal: acordeón con todos los descendientes ─────────────────
            // Todos los nodos bajo este L2, ordenados por profundidad/id
            const descendantsOfL2 = allNodes.filter(
              (n) => n.depth >= 2 && n.path[1]?.id === l2.block.id,
            );

            return (
              <Box key={l2.block.id} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                {/* Cabecera L2 (acordeón) */}
                <Box
                  onClick={() => toggleL2(l2.block.id)}
                  sx={{
                    px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5,
                    cursor: "pointer", bgcolor: budgetBg(l2Used, l2Limit),
                    "&:hover": { bgcolor: "action.hover" },
                    userSelect: "none",
                  }}
                >
                  <IconButton size="small" sx={{ p: 0.3, pointerEvents: "none" }}>
                    {isOpen
                      ? <ExpandMoreIcon sx={{ fontSize: "0.95rem" }} />
                      : <ChevronRightIcon sx={{ fontSize: "0.95rem" }} />}
                  </IconButton>

                  <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                    {l2.block.name}
                  </Typography>

                  {l2.block.code && (
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled", fontSize: "0.7rem" }}>
                      {l2.block.code}
                    </Typography>
                  )}

                  {l2Limit ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={l2Pct}
                        color={l2Over ? "error" : l2Used === l2Limit ? "success" : "primary"}
                        sx={{ width: 60, borderRadius: 4, height: 5 }}
                      />
                      <Typography variant="caption" fontWeight={600}
                        sx={{ color: budgetColor(l2Used, l2Limit), minWidth: 52, fontSize: "0.7rem" }}>
                        {l2Used} / {l2Limit}
                      </Typography>
                    </Box>
                  ) : l2Used > 0 ? (
                    <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                      {l2Used} pregs
                    </Typography>
                  ) : null}

                  {l2Over && <WarnIcon sx={{ fontSize: "0.85rem", color: "error.main" }} />}
                </Box>

                {/* Tabla L3 */}
                {isOpen && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.72rem", color: "text.secondary", pl: 5 }}>
                          Subtema
                        </TableCell>
                        <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.72rem", color: "text.secondary", width: 80 }}>
                          Código
                        </TableCell>
                        <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.72rem", color: "text.secondary", textAlign: "center", width: 110 }}>
                          N° Preguntas
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#f0fdf4", fontWeight: 600, fontSize: "0.72rem", color: "#15803d", textAlign: "center", width: 80, borderLeft: "1px solid #bbf7d0" }}>
                          Fácil
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#fffbeb", fontWeight: 600, fontSize: "0.72rem", color: "#b45309", textAlign: "center", width: 80, borderLeft: "1px solid #fde68a" }}>
                          Normal
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#fef2f2", fontWeight: 600, fontSize: "0.72rem", color: "#b91c1c", textAlign: "center", width: 80, borderLeft: "1px solid #fecaca" }}>
                          Difícil
                        </TableCell>
                        <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.72rem", color: "text.secondary", textAlign: "center", width: 70 }}>
                          Textos
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {descendantsOfL2.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 3, textAlign: "center", color: "text.disabled", fontStyle: "italic", fontSize: "0.8rem" }}>
                            Sin subtemas
                          </TableCell>
                        </TableRow>
                      ) : (
                        descendantsOfL2.map((node) => {
                          const editable = isEditableNode(node);
                          const bv = values[node.block.id];
                          const hasValue = !!bv?.nQuestions;
                          const nQ = bv?.nQuestions ?? 0;
                          const split = bv?.splitByDifficulty ?? false;
                          const dq = bv?.diffQuestions ?? emptyDiff();
                          const ds = diffSum(dq);
                          const diffOk = split && hasValue && ds === nQ && ds > 0;
                          const diffMismatch = split && hasValue && ds > 0 && ds !== nQ;
                          const exceedsL2 = !!l2Limit && l2Used > l2Limit;
                          const autoSum = nodeAutoSumMap[node.block.id] ?? 0;
                          // indentación según profundidad relativa al L2 (depth 2 = nivel base)
                          const indent = (node.depth - 2) * 14 + 20;
                          const refKey = `nq-${node.block.id}`;

                          return (
                            <React.Fragment key={node.block.id}>
                              <TableRow sx={{
                                bgcolor: hasValue
                                  ? split ? "rgba(139,92,246,0.04)" : "rgba(59,130,246,0.04)"
                                  : !editable && autoSum > 0 ? "action.hover" : "background.paper",
                                borderLeft: "3px solid",
                                borderLeftColor: hasValue ? (exceedsL2 ? "error.main" : "primary.light") : "transparent",
                                "&:hover": { bgcolor: "action.hover" },
                              }}>
                                {/* Nombre con indentación */}
                                <TableCell sx={{ py: 0.75, pl: `${indent}px` }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    {!editable && (
                                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "text.disabled", flexShrink: 0 }} />
                                    )}
                                    <Box>
                                      <Typography variant="body2"
                                        fontSize={node.depth === 2 ? "0.83rem" : "0.78rem"}
                                        fontWeight={!editable ? 500 : hasValue ? 600 : 400}
                                        sx={{ color: !editable ? "text.secondary" : "text.primary" }}>
                                        {node.block.name}
                                      </Typography>
                                      {split && hasValue && (
                                        <Chip size="small" label="div. dificultad"
                                          sx={{ mt: 0.3, fontSize: "0.6rem", height: 14, bgcolor: "#ede9fe", color: "#6d28d9", "& .MuiChip-label": { px: 0.75 } }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </TableCell>

                                {/* Código */}
                                <TableCell>
                                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
                                    {node.block.code || "—"}
                                  </Typography>
                                </TableCell>

                                {/* N° Preguntas */}
                                <TableCell sx={{ textAlign: "center", py: 0.5 }}>
                                  {!editable ? (
                                    /* Nodo intermedio: muestra auto-suma de sus descendientes */
                                    <Tooltip title="Suma de sus sub-bloques">
                                      <Typography variant="body2" fontWeight={autoSum > 0 ? 600 : 400}
                                        sx={{ color: autoSum > 0 ? "text.secondary" : "text.disabled", fontStyle: "italic", fontSize: "0.82rem" }}>
                                        {autoSum > 0 ? autoSum : "—"}
                                      </Typography>
                                    </Tooltip>
                                  ) : (
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25 }}>
                                      <TextField
                                        type="number" size="small"
                                        value={hasValue ? nQ : ""} placeholder="0"
                                        inputRef={(el) => { inputRefs.current[refKey] = el; }}
                                        onChange={(e) => setNQuestions(node.block.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                                        onKeyDown={(e) => handleKeyDown(e, refKey)}
                                        inputProps={{
                                          min: 0,
                                          style: { textAlign: "center", padding: "3px 4px", width: 58, fontWeight: hasValue ? 700 : 400, fontSize: "0.85rem" },
                                          onWheel: (e) => (e.target as HTMLInputElement).blur(),
                                        }}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, "& fieldset": { borderColor: hasValue ? (exceedsL2 ? "#ef4444" : "#3b82f6") : "divider", borderWidth: hasValue ? 1.5 : 1 } } }}
                                      />
                                      {hasValue && (
                                        <Tooltip title="Limpiar">
                                          <IconButton size="small" onClick={() => clearVal(node.block.id)}
                                            sx={{ p: 0.2, color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                            <ClearIcon sx={{ fontSize: "0.8rem" }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  )}
                                  {editable && hasValue && (
                                    <Button size="small" onClick={() => toggleSplit(node.block.id)}
                                      sx={{ mt: 0.3, fontSize: "0.6rem", textTransform: "none", py: 0, px: 0.75, minWidth: 0,
                                        color: split ? "#6d28d9" : "text.secondary",
                                        border: "1px solid", borderColor: split ? "#c4b5fd" : "divider", borderRadius: 1 }}>
                                      {split ? "Quitar dif." : "+ Dificultad"}
                                    </Button>
                                  )}
                                </TableCell>

                                {/* Columnas dificultad */}
                                {DIFFICULTIES.map((diff, di) => {
                                  const cfg = DIFF_CONFIG[diff];
                                  const val = dq[diff];
                                  const diffRefKey = `diff-${node.block.id}-${diff}`;
                                  return (
                                    <TableCell key={diff} sx={{
                                      textAlign: "center", py: 0.5, px: 0.75,
                                      borderLeft: `1px solid ${di === 0 ? "#bbf7d0" : di === 1 ? "#fde68a" : "#fecaca"}`,
                                      bgcolor: split && hasValue ? cfg.bg : "transparent",
                                      transition: "background .15s",
                                    }}>
                                      {!editable || !hasValue || !split ? (
                                        <Typography variant="caption" color="text.disabled">—</Typography>
                                      ) : (
                                        <TextField type="number" size="small"
                                          value={val || ""} placeholder="0"
                                          inputRef={(el) => { inputRefs.current[diffRefKey] = el; }}
                                          onChange={(e) => setDiffQ(node.block.id, diff, parseInt(e.target.value || "0", 10))}
                                          onKeyDown={(e) => handleKeyDown(e, diffRefKey)}
                                          inputProps={{
                                            min: 0, max: nQ,
                                            style: { textAlign: "center", padding: "2px 4px", width: 52, fontSize: "0.8rem", fontWeight: val ? 700 : 400, color: val ? cfg.text : undefined },
                                            onWheel: (e) => (e.target as HTMLInputElement).blur(),
                                          }}
                                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: val ? cfg.bg : "transparent", "& fieldset": { borderColor: val ? cfg.border : "divider", borderWidth: val ? 1.5 : 1 } } }}
                                        />
                                      )}
                                    </TableCell>
                                  );
                                })}

                                {/* Textos */}
                                <TableCell sx={{ py: 0.5, textAlign: "center" }}>
                                  {editable && node.block.has_text && hasValue ? (
                                    <Tooltip title="Gestionar textos">
                                      <IconButton size="small" color="info"
                                        onClick={() => setTextModal({ open: true, block: node.block })}
                                        sx={{ p: 0.5, border: "1px solid", borderColor: "info.200", borderRadius: 1 }}>
                                        <ArticleIcon sx={{ fontSize: "0.9rem" }} />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>

                              {/* Fila estado dificultad */}
                              {editable && split && hasValue && (
                                <TableRow sx={{ bgcolor: "rgba(139,92,246,0.03)", borderLeft: "3px solid #8b5cf6" }}>
                                  <TableCell colSpan={2} sx={{ py: 0.5, pl: `${indent}px` }}>
                                    <Typography variant="caption" sx={{ fontStyle: "italic", fontSize: "0.68rem", color: "text.secondary" }}>
                                      {node.block.name} · división activa
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center", py: 0.5 }} />
                                  {DIFFICULTIES.map((diff, di) => {
                                    const cfg = DIFF_CONFIG[diff];
                                    const val = dq[diff];
                                    return (
                                      <TableCell key={diff} sx={{ textAlign: "center", py: 0.5, px: 0.75, borderLeft: `1px solid ${di === 0 ? "#bbf7d0" : di === 1 ? "#fde68a" : "#fecaca"}` }}>
                                        {val > 0
                                          ? <Typography variant="caption" sx={{ fontWeight: 700, color: cfg.text, fontSize: "0.72rem" }}>{val}</Typography>
                                          : <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>0</Typography>}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell sx={{ textAlign: "center", py: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.7rem", color: diffOk ? "success.main" : diffMismatch ? "error.main" : "text.disabled" }}>
                                      {diffOk ? `✓ ${ds}` : `${ds}/${nQ}`}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}

                      {/* Fila total de la sección L2 */}
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell colSpan={2} sx={{ py: 0.75, pl: 5 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize="0.72rem">
                            Total · {l2.block.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center", py: 0.75 }}>
                          <Typography variant="body2" fontWeight={700}
                            sx={{ color: budgetColor(l2Used, l2Limit), fontSize: "0.85rem" }}>
                            {l2Used > 0 ? l2Limit ? `${l2Used} / ${l2Limit}` : l2Used : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={4} />
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </Box>
            );
          })}

          {/* Total del L1 activo */}
          <Box sx={{
            px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1,
            borderTop: "1px solid", borderColor: "divider",
            bgcolor: l1Used > 0 ? budgetBg(l1Used, l1Limit) : "grey.50",
          }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ flex: 1, fontSize: "0.8rem" }}>
              Total · {activeL1Node.block.name}
            </Typography>
            <Typography variant="body2" fontWeight={700}
              sx={{ color: budgetColor(l1Used, l1Limit), fontSize: "0.9rem" }}>
              {l1Used > 0 ? l1Limit ? `${l1Used} / ${l1Limit}` : `${l1Used} preguntas` : "—"}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* ── Errores de validación ── */}
      {validationErrors.length > 0 && (
        <Box sx={{ mt: 1.5, px: 2, py: 1, bgcolor: "error.50", borderRadius: 1.5, border: "1px solid", borderColor: "error.100" }}>
          {validationErrors.map((err, i) => (
            <Typography key={i} variant="caption" color="error" display="block" fontWeight={500}>
              ⚠ {err}
            </Typography>
          ))}
        </Box>
      )}

      {/* ── Acciones ── */}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5 }}>
        {activeCount > 0 && (
          <Button size="small" color="error" variant="text" onClick={() => setValues({})}
            sx={{ mr: "auto", fontSize: "0.75rem" }}>
            Limpiar todo
          </Button>
        )}
        <Button variant="outlined" color="inherit" size="small"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
          disabled={saving} sx={{ color: "text.secondary", borderColor: "divider" }}>
          Cancelar
        </Button>
        <Button
          variant="contained" size="small"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
          onClick={handleSubmit}
          disabled={saving || grandTotal === 0 || validationErrors.length > 0}
          disableElevation sx={{ minWidth: 190, fontWeight: 600 }}>
          {saving ? "Guardando..." : `Guardar (${grandTotal} preguntas)`}
        </Button>
      </Box>

      {/* ── Modal textos ── */}
      {textModal.open && textModal.block && examId && (
        <ExamTextModal
          open={textModal.open}
          onClose={() => setTextModal({ open: false, block: null })}
          examId={examId}
          area={selectedArea}
          block={textModal.block}
          maxQuestions={values[textModal.block.id]?.nQuestions ?? 0}
        />
      )}

      <Snackbar open={successOpen} autoHideDuration={1500} onClose={() => setSuccessOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>Requerimientos guardados correctamente</Alert>
      </Snackbar>
      <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </Container>
  );
}