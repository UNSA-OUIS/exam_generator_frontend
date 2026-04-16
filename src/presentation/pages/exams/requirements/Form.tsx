import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container, Typography, Button, Box, CircularProgress,
  Snackbar, Alert, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, TextField, Divider, Tooltip, IconButton, Chip,
  LinearProgress, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  Article as ArticleIcon,
  WarningAmber as WarnIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  TuneOutlined as TuneIcon,
  LayersOutlined as LayersIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { CreateExamRequirement } from "../../../../application/exam/CreateExamRequirement";
import { UpdateExamRequirement } from "../../../../application/exam/UpdateExamRequirement";
import { ExamRequirementApi } from "../../../../infrastructure/api/ExamRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ExamRequirement } from "../../../../models/ExamRequirement";
import type { Block } from "../../../../models/Block";
import ExamTextModal from "./ExamTextModal";

// ─── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  white: "#FFFFFF", bg: "#F9FAFB",
  border: "#E5E7EB", borderMid: "#D1D5DB",
  text: "#111827", textMid: "#374151", textLight: "#6B7280", textFaint: "#9CA3AF",
  accent: "#111827", accentHover: "#374151",
  red: "#991B1B", redLight: "#FEF2F2", redBorder: "#FECACA",
  green: "#166534", greenLight: "#F0FDF4", greenBorder: "#BBF7D0",
  amber: "#92400E", amberLight: "#FFFBEB", amberBorder: "#FDE68A",
  locked: "#F3F4F6", lockedText: "#9CA3AF",
  easyBg: "#F0FDF4", easyBorder: "#86EFAC", easyText: "#14532D",
  normalBg: "#FEFCE8", normalBorder: "#FDE047", normalText: "#713F12",
  hardBg: "#FFF1F2", hardBorder: "#FDA4AF", hardText: "#881337",
};

type Difficulty = "EASY" | "NORMAL" | "HARD";
type Area = "UNICA" | "BIOMEDICAS" | "SOCIALES" | "INGENIERIAS";

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD"];
const AREAS: Area[] = ["UNICA", "BIOMEDICAS", "SOCIALES", "INGENIERIAS"];
const AREA_LABELS: Record<Area, string> = {
  UNICA: "Área Única", BIOMEDICAS: "Biomédicas",
  SOCIALES: "Sociales", INGENIERIAS: "Ingenierías",
};
const DIFF_CONFIG: Record<Difficulty, { bg: string; border: string; text: string; label: string; short: string }> = {
  EASY:   { bg: C.easyBg,   border: C.easyBorder,   text: C.easyText,   label: "Fácil",   short: "F" },
  NORMAL: { bg: C.normalBg, border: C.normalBorder,  text: C.normalText, label: "Normal",  short: "N" },
  HARD:   { bg: C.hardBg,   border: C.hardBorder,    text: C.hardText,   label: "Difícil", short: "D" },
};

interface NodeValue {
  nQuestions: number;
  splitByDifficulty: boolean;
  diffQuestions: Record<Difficulty, number>;
}
interface TreeNode {
  block: Block; depth: number; path: Block[];
  childIds: number[]; directChildIds: number[]; isLeaf: boolean;
  existing?: ExamRequirement; existingDiffChildren?: ExamRequirement[];
}

const emptyDiff = (): Record<Difficulty, number> => ({ EASY: 0, NORMAL: 0, HARD: 0 });
const diffSum = (dq: Record<Difficulty, number>) => DIFFICULTIES.reduce((s, d) => s + (dq[d] ?? 0), 0);

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
      nodes.push({ block, depth, path: p, childIds: getDescendantIds(block.id), directChildIds: directChildren.map((b) => b.id), isLeaf: directChildren.length === 0 });
      recurse(block.id, depth + 1, p);
    }
  };
  recurse(null, 0, []);
  return nodes;
};

const budgetColor = (used: number, limit?: number) => {
  if (!limit) return C.textMid;
  if (used > limit) return C.red;
  if (used === limit) return C.green;
  if (used / limit >= 0.8) return C.amber;
  return C.textMid;
};

const inputSx = (active: boolean, over: boolean, locked: boolean) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "4px", bgcolor: locked ? C.locked : C.white, fontSize: "0.85rem",
    "& fieldset": { borderColor: locked ? C.borderMid : active ? (over ? C.red : C.textMid) : C.border, borderWidth: active && !locked ? 2 : 1 },
    "&:hover fieldset": { borderColor: locked ? C.borderMid : over ? C.red : C.textMid },
    "&.Mui-focused fieldset": { borderColor: locked ? C.borderMid : over ? C.red : C.text },
  },
});

// ─── DifficultyCell ───────────────────────────────────────────────────────────
// Celda de dificultad individual con 3 estados: inactiva, hint clickeable, input activo
interface DifficultyCellProps {
  diff: Difficulty;
  di: number;
  hasValue: boolean;
  split: boolean;
  isLocked: boolean;
  editable: boolean;
  val: number;
  nQ: number;
  diffRefKey: string;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onEnable: () => void;
  onSetDiff: (n: number) => void;
  onKeyDown: (e: React.KeyboardEvent, key: string) => void;
}

const DifficultyCell: React.FC<DifficultyCellProps> = ({
  diff, di, hasValue, split, isLocked, editable, val, nQ,
  diffRefKey, inputRefs, onEnable, onSetDiff, onKeyDown,
}) => {
  const cfg = DIFF_CONFIG[diff];
  const borderColorMap = [C.greenBorder, C.amberBorder, C.redBorder];

  // Inactiva (sin preguntas o bloqueada o no editable)
  if (!hasValue || isLocked || !editable) {
    return (
      <TableCell sx={{
        textAlign: "center", py: 0.75, px: 0.75, width: 90,
        borderLeft: `1px solid ${borderColorMap[di]}`,
        bgcolor: "transparent",
      }}>
        <Typography sx={{ color: C.border, fontSize: "0.68rem" }}>—</Typography>
      </TableCell>
    );
  }

  // Hint clickeable (tiene preguntas, no está en modo split)
  if (!split) {
    return (
      <TableCell
        onClick={onEnable}
        sx={{
          textAlign: "center", py: 0.6, px: 0.5, width: 90,
          borderLeft: `1px solid ${borderColorMap[di]}`,
          bgcolor: `${cfg.bg}70`,
          cursor: "pointer",
          transition: "all 0.15s",
          "&:hover": {
            bgcolor: cfg.bg,
            "& .diff-hint-box": { borderStyle: "solid", opacity: 1 },
          },
        }}
      >
        <Box
          className="diff-hint-box"
          sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 0.15, py: 0.4, px: 0.5, borderRadius: "5px",
            border: `1.5px dashed ${cfg.border}`, opacity: 0.75,
            transition: "all 0.15s",
          }}
        >
          <AddIcon sx={{ fontSize: "0.65rem", color: cfg.text }} />
          <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: cfg.text, lineHeight: 1 }}>
            {cfg.label}
          </Typography>
        </Box>
      </TableCell>
    );
  }

  // Activa (input)
  return (
    <TableCell sx={{
      textAlign: "center", py: 0.75, px: 0.75, width: 90,
      borderLeft: `1px solid ${borderColorMap[di]}`,
      bgcolor: cfg.bg,
    }}>
      <TextField
        type="number" size="small" value={val || ""} placeholder="0"
        inputRef={(el) => { inputRefs.current[diffRefKey] = el; }}
        onChange={(e) => onSetDiff(parseInt(e.target.value || "0", 10))}
        onKeyDown={(e) => onKeyDown(e, diffRefKey)}
        inputProps={{
          min: 0, max: nQ,
          style: {
            textAlign: "center", padding: "4px", width: 50, fontSize: "0.8rem",
            fontWeight: val ? 700 : 400, color: val ? cfg.text : undefined,
          },
          onWheel: (e) => (e.target as HTMLInputElement).blur(),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "4px", bgcolor: val ? cfg.bg : C.white,
            "& fieldset": { borderColor: val ? cfg.border : C.border, borderWidth: val ? 1.5 : 1 },
          },
        }}
      />
    </TableCell>
  );
};

// ─── DifficultyHeaderPanel ────────────────────────────────────────────────────
// Panel de dificultad para el header del accordion L2
interface DifficultyHeaderPanelProps {
  blockId: number;
  nQ: number;
  hasValue: boolean;
  split: boolean;
  dq: Record<Difficulty, number>;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onToggle: () => void;
  onSetDiff: (diff: Difficulty, n: number) => void;
}

const DifficultyHeaderPanel: React.FC<DifficultyHeaderPanelProps> = ({
  blockId, nQ, split, dq, inputRefs, onToggle, onSetDiff,
}) => {
  const ds = diffSum(dq);
  const diffOk = split && ds === nQ && ds > 0;
  const diffMismatch = split && ds > 0 && ds !== nQ;

  return (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 0.5,
        px: 1, py: 0.4, borderRadius: "6px",
        border: `1px solid ${split ? C.borderMid : C.border}`,
        bgcolor: split ? C.bg : "transparent",
        transition: "all 0.15s",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <TuneIcon sx={{ fontSize: "0.7rem", color: split ? C.textMid : C.textFaint, flexShrink: 0 }} />
      <Typography sx={{
        fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.05em",
        textTransform: "uppercase", color: split ? C.textMid : C.textFaint,
        mr: 0.25, flexShrink: 0,
      }}>
        Dif.
      </Typography>

      {DIFFICULTIES.map((diff) => {
        const cfg = DIFF_CONFIG[diff];
        const val = dq[diff];
        const diffRefKey = `l2diff-${blockId}-${diff}`;

        if (!split) {
          // Hint chip clickeable
          return (
            <Tooltip key={diff} title={`Clic para distribuir por ${cfg.label.toLowerCase()}`}>
              <Box
                onClick={onToggle}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.25,
                  px: 0.75, py: 0.25, borderRadius: "4px", cursor: "pointer",
                  border: `1.5px dashed ${cfg.border}`,
                  bgcolor: `${cfg.bg}80`,
                  color: cfg.text, opacity: 0.8,
                  transition: "all 0.12s",
                  "&:hover": { opacity: 1, bgcolor: cfg.bg, border: `1.5px solid ${cfg.border}` },
                }}
              >
                <AddIcon sx={{ fontSize: "0.5rem" }} />
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, lineHeight: 1 }}>
                  {cfg.label}
                </Typography>
              </Box>
            </Tooltip>
          );
        }

        // Input activo
        return (
          <Box
            key={diff}
            sx={{
              display: "flex", flexDirection: "column", alignItems: "center",
              px: 0.25, py: 0.2, borderRadius: "4px",
              bgcolor: cfg.bg, border: `1px solid ${cfg.border}`,
            }}
          >
            <Typography sx={{
              fontSize: "0.48rem", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.04em", color: cfg.text, lineHeight: 1.2, mb: 0.1,
            }}>
              {cfg.label}
            </Typography>
            <TextField
              type="number" size="small" value={val || ""} placeholder="0"
              inputRef={(el) => { inputRefs.current[diffRefKey] = el; }}
              onChange={(e) => onSetDiff(diff, parseInt(e.target.value || "0", 10))}
              inputProps={{
                min: 0, max: nQ,
                style: {
                  textAlign: "center", padding: "2px 4px", width: 36, fontSize: "0.76rem",
                  fontWeight: val ? 700 : 400, color: val ? cfg.text : undefined,
                },
                onWheel: (e) => (e.target as HTMLInputElement).blur(),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "3px", bgcolor: "transparent",
                  "& fieldset": { border: "none" },
                  height: 22,
                },
              }}
            />
          </Box>
        );
      })}

      {split && (
        <>
          <Typography sx={{
            fontWeight: 700, fontSize: "0.66rem",
            color: diffOk ? C.green : diffMismatch ? C.red : C.textFaint,
            minWidth: 40, ml: 0.25,
          }}>
            {ds} / {nQ}
          </Typography>
          {diffOk && <CheckCircleIcon sx={{ fontSize: "0.7rem", color: C.green }} />}
          <Tooltip title="Quitar distribución por dificultad">
            <IconButton
              size="small" onClick={onToggle}
              sx={{ p: 0.25, color: C.textFaint, ml: 0.25, "&:hover": { color: C.red, bgcolor: C.redLight } }}
            >
              <ClearIcon sx={{ fontSize: "0.65rem" }} />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExamRequirementManager({
  initialExamId, onSuccess,
}: { initialExamId?: string; onSuccess?: () => void } = {}) {
  const navigate = useNavigate();
  const { examId: urlExamId } = useParams<{ examId: string }>();
  const examId = initialExamId || urlExamId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allNodes, setAllNodes] = useState<TreeNode[]>([]);
  const [existingReqs, setExistingReqs] = useState<ExamRequirement[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area>("UNICA");
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  const [expandedL2Ids, setExpandedL2Ids] = useState<Set<number>>(new Set());
  const [values, setValues] = useState<Record<number, NodeValue>>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textModal, setTextModal] = useState<{ open: boolean; block: Block | null; openKey: number }>({ open: false, block: null, openKey: 0 });

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const openTextModal = useCallback((block: Block) => {
    setTextModal({ open: false, block: null, openKey: 0 });
    setTimeout(() => setTextModal({ open: true, block, openKey: Date.now() }), 0);
  }, []);

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
      } catch { setErrorMessage("Error al cargar los datos."); }
      finally { setLoading(false); }
    };
    load();
  }, [examId]);

  const l1Nodes = useMemo(() => allNodes.filter((n) => n.depth === 0), [allNodes]);
  const l2Nodes = useMemo(() => allNodes.filter((n) => n.depth === 1), [allNodes]);

  const isEditableNode = useCallback(
    (n: TreeNode) => (n.block.has_text && n.depth >= 1) || n.depth >= 2,
    []
  );
  const editableNodes = useMemo(() => allNodes.filter(isEditableNode), [allNodes, isEditableNode]);

  const availableAreas = useMemo<Area[]>(() => {
    const fromReqs = [...new Set(existingReqs.map((r) => r.area as Area))].filter(Boolean);
    return fromReqs.length > 0 ? fromReqs : AREAS;
  }, [existingReqs]);

  useEffect(() => {
    if (l1Nodes.length > 0 && activeL1Id === null) setActiveL1Id(l1Nodes[0].block.id);
  }, [l1Nodes, activeL1Id]);

  useEffect(() => {
    if (availableAreas.length > 0 && !availableAreas.includes(selectedArea)) setSelectedArea(availableAreas[0]);
  }, [availableAreas]);

  useEffect(() => {
    if (activeL1Id === null) return;
    setExpandedL2Ids(new Set());
  }, [activeL1Id, selectedArea]);

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
      } else { reqByBlock.set(req.block_id, req); }
    }
    const updated = allNodes.map((node) => {
      const existing = reqByBlock.get(node.block.id);
      const existingDiffChildren = existing?.id
        ? (diffByParent.get(existing.id) ?? []).filter((r) => r.block_id === node.block.id)
        : [];
      return { ...node, existing, existingDiffChildren };
    });
    setAllNodes(updated);
    const init: Record<number, NodeValue> = {};
    for (const node of updated) {
      if (!isEditableNode(node)) continue;
      const req = node.existing;
      if (!req?.n_questions) continue;
      const hasDiff = (node.existingDiffChildren ?? []).length > 0;
      const dq = emptyDiff();
      if (hasDiff) for (const dr of node.existingDiffChildren!) if (dr.difficulty) dq[dr.difficulty as Difficulty] = dr.n_questions ?? 0;
      init[node.block.id] = { nQuestions: req.n_questions, splitByDifficulty: hasDiff, diffQuestions: dq };
    }
    setValues(init);
  }, [existingReqs, selectedArea]);

  const lockedNodeIds = useMemo(() => {
    const locked = new Set<number>();
    for (const node of allNodes) {
      if (!isEditableNode(node)) continue;
      const v = values[node.block.id];
      if (v?.nQuestions) {
        for (const childId of node.childIds) locked.add(childId);
      }
    }
    for (const l2 of l2Nodes) {
      const v = values[l2.block.id];
      if (v?.splitByDifficulty) {
        for (const childId of l2.childIds) locked.add(childId);
      }
    }
    return locked;
  }, [allNodes, l2Nodes, values, isEditableNode]);

  const l2UsedMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const n of editableNodes) {
      const v = values[n.block.id];
      if (!v?.nQuestions) continue;
      const l2Anc = n.depth === 1 ? n.block : n.path[1];
      if (l2Anc) m[l2Anc.id] = (m[l2Anc.id] ?? 0) + v.nQuestions;
    }
    return m;
  }, [editableNodes, values]);

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

  const grandTotal = useMemo(() => l1Nodes.reduce((s, n) => s + (l1UsedMap[n.block.id] ?? 0), 0), [l1Nodes, l1UsedMap]);
  const activeCount = useMemo(() => Object.values(values).filter((v) => v.nQuestions > 0).length, [values]);
  const activeL2s = useMemo(() => l2Nodes.filter((n) => n.block.parent_block_id === activeL1Id), [l2Nodes, activeL1Id]);

  const setNQuestions = useCallback((blockId: number, n: number) => {
    setValues((prev) => {
      if (n <= 0) { const next = { ...prev }; delete next[blockId]; return next; }
      return { ...prev, [blockId]: { nQuestions: n, splitByDifficulty: prev[blockId]?.splitByDifficulty ?? false, diffQuestions: prev[blockId]?.diffQuestions ?? emptyDiff() } };
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

  // Habilitar split y enfocar un diff específico
  const enableSplitAndFocus = useCallback((blockId: number, diff: Difficulty, refKeyPrefix: string) => {
    setValues((prev) => {
      const cur = prev[blockId];
      if (!cur || cur.splitByDifficulty) return prev;
      return { ...prev, [blockId]: { ...cur, splitByDifficulty: true } };
    });
    setTimeout(() => {
      const key = `${refKeyPrefix}-${blockId}-${diff}`;
      inputRefs.current[key]?.focus();
      inputRefs.current[key]?.select();
    }, 60);
  }, []);

  const setDiffQ = useCallback((blockId: number, diff: Difficulty, n: number) => {
    setValues((prev) => {
      const cur = prev[blockId];
      if (!cur) return prev;
      return { ...prev, [blockId]: { ...cur, diffQuestions: { ...cur.diffQuestions, [diff]: Math.max(0, n) } } };
    });
  }, []);

  const clearVal = useCallback(
    (blockId: number) => setValues((prev) => { const n = { ...prev }; delete n[blockId]; return n; }),
    []
  );

  const toggleL2 = useCallback(
    (l2Id: number) => setExpandedL2Ids((prev) => { const n = new Set(prev); n.has(l2Id) ? n.delete(l2Id) : n.add(l2Id); return n; }),
    []
  );

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

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    for (const node of editableNodes) {
      const v = values[node.block.id];
      if (!v?.nQuestions) continue;
      if (v.splitByDifficulty) {
        const tot = diffSum(v.diffQuestions);
        if (tot === 0) errs.push(`"${node.block.name}": asigna preguntas a las dificultades.`);
        else if (tot !== v.nQuestions) errs.push(`"${node.block.name}": suma por dificultad (${tot}) no coincide con el total (${v.nQuestions}).`);
      }
    }
    for (const l2 of l2Nodes) {
      const v = values[l2.block.id];
      if (!v?.splitByDifficulty || !v.nQuestions) continue;
      const ds = diffSum(v.diffQuestions);
      if (ds > 0 && ds !== v.nQuestions) errs.push(`"${l2.block.name}": suma de dificultades (${ds}) no coincide con el total (${v.nQuestions}).`);
    }
    for (const l2 of l2Nodes.filter((n) => !n.block.has_text)) {
      const limit = l2.existing?.n_questions;
      if (!limit) continue;
      const used = l2UsedMap[l2.block.id] ?? 0;
      if (used > limit) errs.push(`"${l2.block.name}": ${used} preguntas exceden el límite (${limit}).`);
    }
    for (const l1 of l1Nodes) {
      const limit = l1.existing?.n_questions;
      if (!limit) continue;
      const used = l1UsedMap[l1.block.id] ?? 0;
      if (used > limit) errs.push(`"${l1.block.name}": ${used} preguntas exceden el límite (${limit}).`);
    }
    return errs;
  }, [editableNodes, l2Nodes, l1Nodes, values, l2UsedMap, l1UsedMap]);

  const handleSubmit = async () => {
    if (validationErrors.length > 0) { setErrorMessage(validationErrors[0]); return; }
    setSaving(true);
    try {
      if (!examId) throw new Error("examId es requerido");
      const activeNodes = editableNodes.filter((n) => values[n.block.id]?.nQuestions);
      const activeL2WithDiff = l2Nodes.filter((n) => values[n.block.id]?.splitByDifficulty);
      if (!activeNodes.length && !activeL2WithDiff.length) throw new Error("Ingresa al menos un bloque con preguntas");

      const areaReqs = existingReqs.filter((r) => r.area === selectedArea);
      const createdMap: Record<number, number> = {};
      for (const req of areaReqs) if (req.block_id && req.id && !req.difficulty) createdMap[req.block_id] = req.id;

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
      for (const l2 of activeL2WithDiff) {
        const bv = values[l2.block.id]!;
        if (!nodeMap[l2.block.id]) nodeMap[l2.block.id] = { nQ: bv.nQuestions, depth: l2.depth, splitByDifficulty: true, diffQuestions: bv.diffQuestions };
        else { nodeMap[l2.block.id].splitByDifficulty = true; nodeMap[l2.block.id].diffQuestions = bv.diffQuestions; }
      }

      const toProcess = Object.entries(nodeMap).map(([id, e]) => ({ blockId: Number(id), ...e })).sort((a, b) => a.depth - b.depth);

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
          thisId = c.id!;
          createdMap[item.blockId] = thisId;
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
      setTimeout(() => (onSuccess ? onSuccess() : navigate(-1)), 1400);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error ?? err.message);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 2 }}>
        <CircularProgress size={24} sx={{ color: C.text }} />
        <Typography variant="body2" sx={{ color: C.textFaint, fontSize: "0.78rem" }}>Cargando datos del examen…</Typography>
      </Box>
    );
  }

  const activeL1Node = l1Nodes.find((n) => n.block.id === activeL1Id);
  const l1Limit = activeL1Node?.existing?.n_questions;
  const l1Used = activeL1Id ? (l1UsedMap[activeL1Id] ?? 0) : 0;
  const l1Pct = l1Limit ? Math.min(100, Math.round((l1Used / l1Limit) * 100)) : 0;

  const cellHSx = {
    bgcolor: C.bg, fontWeight: 700, fontSize: "0.66rem", letterSpacing: "0.06em",
    textTransform: "uppercase" as const, color: C.textLight,
    borderBottom: `1px solid ${C.border}`, py: 0.9, whiteSpace: "nowrap" as const,
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Header ── */}
      <Paper elevation={0} sx={{ mb: 2.5, borderRadius: "6px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <Box sx={{ height: 2, bgcolor: C.text }} />
        <Box sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", bgcolor: C.white }}>
          <Button startIcon={<ArrowBackIcon sx={{ fontSize: "0.8rem !important" }} />}
            onClick={() => (onSuccess ? onSuccess() : navigate(-1))} size="small"
            sx={{ color: C.textMid, border: `1px solid ${C.border}`, borderRadius: "4px", textTransform: "none", fontWeight: 600, fontSize: "0.76rem", px: 1.5, py: 0.5, "&:hover": { bgcolor: C.bg } }}>
            Volver
          </Button>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 180 }}>
            <AssignmentIcon sx={{ fontSize: "1rem", color: C.textLight }} />
            <Box>
              <Typography sx={{ fontWeight: 700, color: C.text, fontSize: "0.9rem", lineHeight: 1.2 }}>Requerimientos del Examen</Typography>
              <Typography sx={{ color: C.textFaint, fontSize: "0.67rem" }}>Distribución de preguntas por bloque temático</Typography>
            </Box>
          </Box>
          {/* Selector área */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ color: C.textLight, fontWeight: 600, fontSize: "0.66rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Área:</Typography>
            <ToggleButtonGroup size="small" exclusive value={selectedArea} onChange={(_, v) => v && setSelectedArea(v)}>
              {availableAreas.map((area) => (
                <ToggleButton key={area} value={area}
                  sx={{ px: 1.5, py: 0.4, fontSize: "0.72rem", textTransform: "none", fontWeight: selectedArea === area ? 700 : 400, borderColor: C.border, color: selectedArea === area ? C.white : C.textMid, bgcolor: selectedArea === area ? `${C.text} !important` : "transparent", "&:hover": { bgcolor: C.bg }, "&.Mui-selected": { color: C.white }, borderRadius: "4px !important" }}>
                  {AREA_LABELS[area]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          {/* Chips */}
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {activeCount > 0 && <Chip size="small" label={`${activeCount} bloques activos`} sx={{ bgcolor: C.bg, color: C.textMid, border: `1px solid ${C.border}`, fontWeight: 600, fontSize: "0.66rem", height: 20 }} />}
            {grandTotal > 0 && <Chip size="small" label={`${grandTotal} preguntas`} sx={{ bgcolor: C.text, color: C.white, fontWeight: 700, fontSize: "0.66rem", height: 20 }} />}
          </Box>
        </Box>
      </Paper>

      {/* ── L1 tabs ── */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ color: C.textFaint, fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75, display: "block" }}>Área temática</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {l1Nodes.map((l1) => {
            const used = l1UsedMap[l1.block.id] ?? 0;
            const limit = l1.existing?.n_questions;
            const isActive = l1.block.id === activeL1Id;
            const isOver = !!limit && used > limit;
            const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            return (
              <Paper key={l1.block.id} variant="outlined" onClick={() => setActiveL1Id(l1.block.id)}
                sx={{ px: 2, py: 1, cursor: "pointer", borderRadius: "6px", minWidth: 120, border: "1.5px solid", borderColor: isOver ? C.redBorder : isActive ? C.text : C.border, bgcolor: isActive ? C.text : C.white, transition: "all 0.1s", "&:hover": { borderColor: isActive ? C.text : C.borderMid } }}>
                <Typography noWrap sx={{ fontWeight: isActive ? 700 : 500, color: isOver ? C.red : isActive ? C.white : C.text, fontSize: "0.8rem" }}>{l1.block.name}</Typography>
                <Typography sx={{ color: isActive ? C.textFaint : budgetColor(used, limit), fontSize: "0.63rem", mt: 0.2, fontWeight: 600 }}>
                  {used > 0 ? (limit ? `${used} / ${limit}` : `${used} pregs.`) : (limit ? `Límite: ${limit}` : "Sin asignar")}
                </Typography>
                {limit && used > 0 && (
                  <LinearProgress variant="determinate" value={pct}
                    sx={{ mt: 0.5, height: 2, borderRadius: 2, bgcolor: isActive ? "rgba(255,255,255,0.15)" : C.border, "& .MuiLinearProgress-bar": { bgcolor: isOver ? C.red : used === limit ? C.green : isActive ? C.white : C.textMid } }} />
                )}
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* ── Panel L1 activo ── */}
      {activeL1Node && (
        <Paper elevation={0} sx={{ borderRadius: "6px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {/* Cabecera L1 */}
          <Box sx={{ px: 2.5, py: 1.25, display: "flex", alignItems: "center", gap: 1.5, bgcolor: C.text }}>
            <Typography sx={{ flex: 1, color: C.white, fontWeight: 700, fontSize: "0.86rem" }}>{activeL1Node.block.name}</Typography>
            {/* ── Leyenda de dificultad visible siempre ── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: "5px", bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <TuneIcon sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }} />
              <Typography sx={{ fontSize: "0.57rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", mr: 0.5 }}>
                Dificultad:
              </Typography>
              {DIFFICULTIES.map((diff) => {
                const cfg = DIFF_CONFIG[diff];
                return (
                  <Box key={diff} sx={{ px: 0.6, py: 0.15, borderRadius: "3px", bgcolor: `${cfg.bg}25`, border: `1px solid ${cfg.border}40` }}>
                    <Typography sx={{ fontSize: "0.57rem", fontWeight: 700, color: cfg.bg }}>{cfg.label}</Typography>
                  </Box>
                );
              })}
              <Typography sx={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.35)", ml: 0.25 }}>
                · clic en columna para asignar
              </Typography>
            </Box>
            {l1Limit && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinearProgress variant="determinate" value={l1Pct}
                  sx={{ width: 80, borderRadius: 2, height: 3, bgcolor: "rgba(255,255,255,0.15)", "& .MuiLinearProgress-bar": { bgcolor: l1Used > l1Limit ? C.red : l1Used === l1Limit ? C.green : C.white, borderRadius: 2 } }} />
                <Typography sx={{ color: l1Used > l1Limit ? "#FCA5A5" : l1Used === l1Limit ? "#86EFAC" : C.white, fontWeight: 700, fontSize: "0.72rem", minWidth: 52 }}>
                  {l1Used} / {l1Limit}
                </Typography>
              </Box>
            )}
            {!l1Limit && l1Used > 0 && <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.72rem" }}>{l1Used} preguntas</Typography>}
          </Box>

          {activeL2s.map((l2) => {
            const isLeafL2 = l2.block.has_text;
            const l2Used = l2UsedMap[l2.block.id] ?? 0;
            const l2Limit = l2.existing?.n_questions;
            const l2Pct = l2Limit ? Math.min(100, Math.round((l2Used / l2Limit) * 100)) : 0;
            const l2Over = !!l2Limit && l2Used > l2Limit;
            const isOpen = expandedL2Ids.has(l2.block.id);

            // ── L2 con texto (hoja) ──────────────────────────────────────
            if (isLeafL2) {
              const bv = values[l2.block.id];
              const hasValue = !!bv?.nQuestions;
              const nQ = bv?.nQuestions ?? 0;
              const split = bv?.splitByDifficulty ?? false;
              const dq = bv?.diffQuestions ?? emptyDiff();
              const isLocked = lockedNodeIds.has(l2.block.id);
              const refKey = `nq-${l2.block.id}`;
              const ds = diffSum(dq);
              const diffOk = split && hasValue && ds === nQ && ds > 0;
              const diffMismatch = split && hasValue && ds > 0 && ds !== nQ;

              return (
                <Box key={l2.block.id} sx={{ borderBottom: `1px solid ${C.border}` }}>
                  <Table size="small"><TableBody>
                    <TableRow sx={{ bgcolor: isLocked ? C.locked : hasValue ? C.bg : C.white, borderLeft: `3px solid ${hasValue && !isLocked ? C.text : "transparent"}` }}>
                      <TableCell sx={{ py: 0.9, pl: 3, width: "40%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          {isLocked ? <LockIcon sx={{ fontSize: "0.72rem", color: C.lockedText, flexShrink: 0 }} /> : <ArticleIcon sx={{ fontSize: "0.78rem", color: hasValue ? C.textMid : C.textFaint, flexShrink: 0 }} />}
                          <Box>
                            <Typography sx={{ fontSize: "0.81rem", fontWeight: hasValue ? 600 : 400, color: isLocked ? C.lockedText : C.text }}>{l2.block.name}</Typography>
                            {isLocked && <Typography sx={{ fontSize: "0.6rem", color: C.lockedText, fontStyle: "italic" }}>Bloqueado — nodo padre asignado</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: 90 }}><Typography sx={{ color: C.textFaint, fontFamily: "monospace", fontSize: "0.65rem" }}>{l2.block.code || "—"}</Typography></TableCell>
                      {/* Celda preguntas */}
                      <TableCell sx={{ textAlign: "center", py: 0.75, width: 140 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <TextField type="number" size="small" value={hasValue ? nQ : ""} placeholder="0" disabled={isLocked}
                            inputRef={(el) => { inputRefs.current[refKey] = el; }}
                            onChange={(e) => setNQuestions(l2.block.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                            onKeyDown={(e) => handleKeyDown(e, refKey)}
                            inputProps={{ min: 0, style: { textAlign: "center", padding: "5px 6px", width: 58, fontWeight: hasValue ? 700 : 400, fontSize: "0.86rem", color: isLocked ? C.lockedText : undefined }, onWheel: (e) => (e.target as HTMLInputElement).blur() }}
                            sx={inputSx(hasValue, l2Over, isLocked)} />
                          {hasValue && !isLocked && <Tooltip title="Limpiar"><IconButton size="small" onClick={() => clearVal(l2.block.id)} sx={{ p: 0.3, color: C.textFaint, "&:hover": { color: C.red, bgcolor: C.redLight } }}><ClearIcon sx={{ fontSize: "0.78rem" }} /></IconButton></Tooltip>}
                        </Box>
                        {/* Indicador de estado diff */}
                        {hasValue && !isLocked && split && (
                          <Typography sx={{ fontSize: "0.58rem", mt: 0.3, fontWeight: 700, color: diffOk ? C.green : diffMismatch ? C.red : C.textFaint }}>
                            {diffOk ? "✓ dist. correcta" : diffMismatch ? `${ds}/${nQ} — ajusta` : "asigna dificultades →"}
                          </Typography>
                        )}
                        {hasValue && !isLocked && !split && (
                          <Typography sx={{ fontSize: "0.58rem", mt: 0.3, color: C.textFaint, fontStyle: "italic" }}>
                            ← clic en col. para dist.
                          </Typography>
                        )}
                      </TableCell>
                      {/* Celdas de dificultad */}
                      {DIFFICULTIES.map((diff, di) => (
                        <DifficultyCell
                          key={diff}
                          diff={diff} di={di}
                          hasValue={hasValue} split={split} isLocked={isLocked} editable={true}
                          val={dq[diff]} nQ={nQ}
                          diffRefKey={`diff-${l2.block.id}-${diff}`}
                          inputRefs={inputRefs}
                          onEnable={() => enableSplitAndFocus(l2.block.id, diff, "diff")}
                          onSetDiff={(n) => setDiffQ(l2.block.id, diff, n)}
                          onKeyDown={handleKeyDown}
                        />
                      ))}
                      {/* Columna textos / quitar dificultad */}
                      <TableCell sx={{ py: 0.75, textAlign: "center", width: 72 }}>
                        {hasValue && !isLocked ? (
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.4 }}>
                            {split && (
                              <Tooltip title="Quitar distribución por dificultad">
                                <IconButton size="small" onClick={() => toggleSplit(l2.block.id)}
                                  sx={{ p: 0.3, border: `1px solid ${C.redBorder}`, borderRadius: "4px", color: C.red, bgcolor: C.redLight, "&:hover": { bgcolor: "#fecaca" } }}>
                                  <ClearIcon sx={{ fontSize: "0.7rem" }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Gestionar textos">
                              <IconButton size="small" onClick={() => openTextModal(l2.block)}
                                sx={{ p: 0.4, border: `1px solid ${C.border}`, borderRadius: "4px", color: C.textLight, "&:hover": { bgcolor: C.bg } }}>
                                <ArticleIcon sx={{ fontSize: "0.78rem" }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : <Typography sx={{ color: C.border, fontSize: "0.7rem" }}>—</Typography>}
                      </TableCell>
                    </TableRow>
                  </TableBody></Table>
                </Box>
              );
            }

            // ── L2 con hijos (accordion) ─────────────────────────────────
            const descendantsOfL2 = allNodes.filter((n) => n.depth >= 2 && n.path[1]?.id === l2.block.id);
            const l2bv = values[l2.block.id];
            const l2HasDiff = l2bv?.splitByDifficulty ?? false;
            const l2dq = l2bv?.diffQuestions ?? emptyDiff();
            const l2nQ = l2bv?.nQuestions ?? l2.existing?.n_questions ?? 0;
            

            return (
              <Box key={l2.block.id} sx={{ borderBottom: `1px solid ${C.border}` }}>
                {/* Accordion header con panel de dificultad rediseñado */}
                <Box
                  onClick={() => toggleL2(l2.block.id)}
                  sx={{ px: 2.5, py: 0.9, display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer", bgcolor: isOpen ? C.bg : C.white, "&:hover": { bgcolor: C.bg }, userSelect: "none", borderLeft: `3px solid ${isOpen ? C.text : "transparent"}` }}
                >
                  <Box sx={{ width: 18, height: 18, borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: isOpen ? C.text : C.bg }}>
                    {isOpen ? <ExpandMoreIcon sx={{ fontSize: "0.75rem", color: C.white }} /> : <ChevronRightIcon sx={{ fontSize: "0.75rem", color: C.textLight }} />}
                  </Box>
                  <Typography sx={{ flex: 1, fontWeight: 600, color: C.text, fontSize: "0.82rem" }}>{l2.block.name}</Typography>
                  {l2.block.code && <Typography sx={{ fontFamily: "monospace", color: C.textFaint, fontSize: "0.64rem" }}>{l2.block.code}</Typography>}

                  {/* Panel de dificultad rediseñado para L2 */}
                  {l2nQ > 0 && (
                    <DifficultyHeaderPanel
                      blockId={l2.block.id}
                      nQ={l2nQ}
                      hasValue={l2nQ > 0}
                      split={l2HasDiff}
                      dq={l2dq}
                      inputRefs={inputRefs}
                      onToggle={() => {
                        if (!l2bv) setValues((p) => ({ ...p, [l2.block.id]: { nQuestions: l2nQ, splitByDifficulty: true, diffQuestions: emptyDiff() } }));
                        else toggleSplit(l2.block.id);
                      }}
                      onSetDiff={(diff, n) => setDiffQ(l2.block.id, diff, n)}
                    />
                  )}

                  {l2Limit ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress variant="determinate" value={l2Pct}
                        sx={{ width: 56, borderRadius: 2, height: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: l2Over ? C.red : l2Used === l2Limit ? C.green : C.textMid, borderRadius: 2 } }} />
                      <Typography sx={{ fontWeight: 700, color: budgetColor(l2Used, l2Limit), fontSize: "0.67rem", minWidth: 44 }}>{l2Used} / {l2Limit}</Typography>
                    </Box>
                  ) : l2Used > 0 ? (
                    <Typography sx={{ color: C.textMid, fontWeight: 600, fontSize: "0.67rem" }}>{l2Used} pregs.</Typography>
                  ) : (
                    <Typography sx={{ color: C.textFaint, fontSize: "0.64rem" }}>Sin asignar</Typography>
                  )}
                  {l2Over && <WarnIcon sx={{ fontSize: "0.78rem", color: C.red }} />}
                </Box>

                {isOpen && (
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ ...cellHSx, pl: 5 }}>Bloque / Subtema</TableCell>
                        <TableCell sx={{ ...cellHSx, width: 90 }}>Código</TableCell>
                        <TableCell sx={{ ...cellHSx, textAlign: "center", width: 140 }}>Preguntas</TableCell>
                        {DIFFICULTIES.map((diff, di) => (
                          <TableCell key={diff} sx={{
                            ...cellHSx, textAlign: "center", width: 88,
                            color: DIFF_CONFIG[diff].text, bgcolor: DIFF_CONFIG[diff].bg,
                            borderLeft: `1px solid ${di === 0 ? C.greenBorder : di === 1 ? C.amberBorder : C.redBorder}`,
                          }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: "0.66rem", color: DIFF_CONFIG[diff].text }}>{DIFF_CONFIG[diff].label}</Typography>
                              <Typography sx={{ fontSize: "0.52rem", color: DIFF_CONFIG[diff].text, opacity: 0.6, fontWeight: 500 }}>
                                clic para asignar
                              </Typography>
                            </Box>
                          </TableCell>
                        ))}
                        <TableCell sx={{ ...cellHSx, textAlign: "center", width: 72 }}>Textos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {descendantsOfL2.length === 0 ? (
                        <TableRow><TableCell colSpan={7} sx={{ py: 3, textAlign: "center", color: C.textFaint, fontStyle: "italic", fontSize: "0.76rem" }}>No hay subtemas registrados.</TableCell></TableRow>
                      ) : (
                        descendantsOfL2.map((node) => {
                          const editable = isEditableNode(node);
                          const lockedByL2Diff = l2HasDiff;
                          const isLocked = lockedNodeIds.has(node.block.id) || lockedByL2Diff;
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
                          const indent = (node.depth - 2) * 16 + 20;
                          const refKey = `nq-${node.block.id}`;

                          return (
                            <React.Fragment key={node.block.id}>
                              <TableRow sx={{
                                bgcolor: isLocked ? C.locked : hasValue ? C.bg : C.white,
                                borderLeft: `3px solid ${isLocked ? C.borderMid : hasValue ? (exceedsL2 ? C.red : C.text) : "transparent"}`,
                                "&:hover td": { bgcolor: isLocked ? C.locked : C.bg },
                                opacity: isLocked ? 0.7 : 1,
                              }}>
                                {/* Nombre */}
                                <TableCell sx={{ py: 0.8, pl: `${indent}px` }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    {isLocked ? <LockIcon sx={{ fontSize: "0.7rem", color: C.lockedText, flexShrink: 0 }} />
                                      : !editable ? <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: C.borderMid, flexShrink: 0 }} /> : null}
                                    <Box>
                                      <Typography sx={{ fontSize: node.depth === 2 ? "0.8rem" : "0.75rem", fontWeight: hasValue ? 600 : 400, color: isLocked ? C.lockedText : !editable ? C.textLight : C.text }}>
                                        {node.block.name}
                                      </Typography>
                                      {isLocked && (
                                        <Typography sx={{ fontSize: "0.58rem", color: C.lockedText, fontStyle: "italic" }}>
                                          {lockedByL2Diff ? "Bloqueado — dificultad asignada al nivel superior" : "Bloqueado — nodo padre asignado"}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </TableCell>
                                {/* Código */}
                                <TableCell><Typography sx={{ color: C.textFaint, fontFamily: "monospace", fontSize: "0.64rem" }}>{node.block.code || "—"}</Typography></TableCell>
                                {/* Preguntas */}
                                <TableCell sx={{ textAlign: "center", py: 0.75 }}>
                                  {!editable ? (
                                    <Tooltip title="Calculado por la suma de sub-bloques">
                                      <Typography sx={{ fontWeight: autoSum > 0 ? 600 : 400, color: autoSum > 0 ? C.textMid : C.textFaint, fontStyle: "italic", fontSize: "0.78rem", cursor: "help" }}>
                                        {autoSum > 0 ? autoSum : "—"}
                                      </Typography>
                                    </Tooltip>
                                  ) : isLocked ? (
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: C.lockedText }}>
                                      <LockIcon sx={{ fontSize: "0.68rem" }} />
                                      <Typography sx={{ fontSize: "0.74rem" }}>—</Typography>
                                    </Box>
                                  ) : (
                                    <Box>
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                        <TextField type="number" size="small" value={hasValue ? nQ : ""} placeholder="0"
                                          inputRef={(el) => { inputRefs.current[refKey] = el; }}
                                          onChange={(e) => setNQuestions(node.block.id, Math.max(0, parseInt(e.target.value || "0", 10)))}
                                          onKeyDown={(e) => handleKeyDown(e, refKey)}
                                          inputProps={{ min: 0, style: { textAlign: "center", padding: "5px 6px", width: 58, fontWeight: hasValue ? 700 : 400, fontSize: "0.86rem" }, onWheel: (e) => (e.target as HTMLInputElement).blur() }}
                                          sx={inputSx(hasValue, exceedsL2, false)} />
                                        {hasValue && <Tooltip title="Limpiar"><IconButton size="small" onClick={() => clearVal(node.block.id)} sx={{ p: 0.3, color: C.textFaint, "&:hover": { color: C.red, bgcolor: C.redLight } }}><ClearIcon sx={{ fontSize: "0.78rem" }} /></IconButton></Tooltip>}
                                      </Box>
                                      {/* Mini-hint de estado diff */}
                                      {hasValue && split && (
                                        <Typography sx={{ fontSize: "0.56rem", mt: 0.25, fontWeight: 700, color: diffOk ? C.green : diffMismatch ? C.red : C.textFaint, textAlign: "center" }}>
                                          {diffOk ? "✓ distribuido" : diffMismatch ? `${ds}/${nQ}` : "↓ asigna dif."}
                                        </Typography>
                                      )}
                                      {hasValue && !split && (
                                        <Typography sx={{ fontSize: "0.54rem", mt: 0.25, color: C.textFaint, fontStyle: "italic", textAlign: "center" }}>
                                          ← clic en col.
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </TableCell>
                                {/* Celdas de dificultad */}
                                {DIFFICULTIES.map((diff, di) => (
                                  <DifficultyCell
                                    key={diff}
                                    diff={diff} di={di}
                                    hasValue={hasValue} split={split}
                                    isLocked={isLocked} editable={editable}
                                    val={dq[diff]} nQ={nQ}
                                    diffRefKey={`diff-${node.block.id}-${diff}`}
                                    inputRefs={inputRefs}
                                    onEnable={() => enableSplitAndFocus(node.block.id, diff, "diff")}
                                    onSetDiff={(n) => setDiffQ(node.block.id, diff, n)}
                                    onKeyDown={handleKeyDown}
                                  />
                                ))}
                                {/* Textos / quitar distribución */}
                                <TableCell sx={{ py: 0.75, textAlign: "center" }}>
                                  {editable && hasValue && !isLocked ? (
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.4 }}>
                                      {split && (
                                        <Tooltip title="Quitar distribución por dificultad">
                                          <IconButton size="small" onClick={() => toggleSplit(node.block.id)}
                                            sx={{ p: 0.3, border: `1px solid ${C.redBorder}`, borderRadius: "4px", color: C.red, bgcolor: C.redLight, "&:hover": { bgcolor: "#fecaca" } }}>
                                            <ClearIcon sx={{ fontSize: "0.68rem" }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {node.block.has_text && (
                                        <Tooltip title="Gestionar textos">
                                          <IconButton size="small" onClick={() => openTextModal(node.block)}
                                            sx={{ p: 0.4, border: `1px solid ${C.border}`, borderRadius: "4px", color: C.textLight, "&:hover": { bgcolor: C.bg } }}>
                                            <ArticleIcon sx={{ fontSize: "0.76rem" }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {!node.block.has_text && !split && (
                                        <Typography sx={{ color: C.border, fontSize: "0.68rem" }}>—</Typography>
                                      )}
                                    </Box>
                                  ) : <Typography sx={{ color: C.border, fontSize: "0.68rem" }}>—</Typography>}
                                </TableCell>
                              </TableRow>
                              {/* Fila resumen diff */}
                              {editable && split && hasValue && !isLocked && (
                                <TableRow sx={{ bgcolor: C.bg, borderLeft: `3px solid ${C.borderMid}` }}>
                                  <TableCell colSpan={2} sx={{ py: 0.4, pl: `${indent}px` }}>
                                    <Typography sx={{ fontStyle: "italic", fontSize: "0.62rem", color: C.textLight }}>{node.block.name} · distribución</Typography>
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center", py: 0.4 }} />
                                  {DIFFICULTIES.map((diff, di) => {
                                    const cfg = DIFF_CONFIG[diff]; const val = dq[diff];
                                    return (
                                      <TableCell key={diff} sx={{ textAlign: "center", py: 0.4, px: 0.75, borderLeft: `1px solid ${di === 0 ? C.greenBorder : di === 1 ? C.amberBorder : C.redBorder}` }}>
                                        {val > 0 ? <Typography sx={{ fontWeight: 700, color: cfg.text, fontSize: "0.67rem" }}>{val}</Typography> : <Typography sx={{ color: C.border, fontSize: "0.64rem" }}>0</Typography>}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell sx={{ textAlign: "center", py: 0.4 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.66rem", color: diffOk ? C.green : diffMismatch ? C.red : C.textFaint }}>
                                      {diffOk ? `✓ ${ds}` : `${ds} / ${nQ}`}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                      {/* Subtotal L2 */}
                      <TableRow sx={{ bgcolor: C.bg, borderTop: `1px solid ${C.border}` }}>
                        <TableCell colSpan={2} sx={{ py: 0.7, pl: 5 }}>
                          <Typography sx={{ color: C.textLight, fontWeight: 700, fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subtotal — {l2.block.name}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center", py: 0.7 }}>
                          <Typography sx={{ fontWeight: 700, color: budgetColor(l2Used, l2Limit), fontSize: "0.82rem" }}>
                            {l2Used > 0 ? (l2Limit ? `${l2Used} / ${l2Limit}` : l2Used) : "—"}
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

          {/* Footer L1 */}
          <Box sx={{ px: 2.5, py: 1.1, display: "flex", alignItems: "center", gap: 1.5, bgcolor: C.bg, borderTop: `1px solid ${C.border}` }}>
            <LayersIcon sx={{ fontSize: "0.82rem", color: C.textLight }} />
            <Typography sx={{ flex: 1, color: C.textLight, fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total — {activeL1Node.block.name}
            </Typography>
            {l1Used > 0 && l1Limit && (
              <LinearProgress variant="determinate" value={l1Pct}
                sx={{ width: 80, borderRadius: 2, height: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: l1Used > l1Limit ? C.red : l1Used === l1Limit ? C.green : C.text, borderRadius: 2 } }} />
            )}
            <Typography sx={{ fontWeight: 800, color: budgetColor(l1Used, l1Limit), fontSize: "0.9rem" }}>
              {l1Used > 0 ? (l1Limit ? `${l1Used} / ${l1Limit} preguntas` : `${l1Used} preguntas`) : "—"}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Errores */}
      {validationErrors.length > 0 && (
        <Paper elevation={0} sx={{ mt: 2, px: 2.5, py: 1.1, bgcolor: C.redLight, borderRadius: "5px", border: `1px solid ${C.redBorder}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
            <WarnIcon sx={{ fontSize: "0.82rem", color: C.red }} />
            <Typography sx={{ color: C.red, fontWeight: 700, fontSize: "0.7rem" }}>Corrija los errores antes de guardar:</Typography>
          </Box>
          {validationErrors.map((err, i) => (
            <Typography key={i} sx={{ color: C.red, fontWeight: 500, fontSize: "0.69rem", pl: 2, display: "block" }}>· {err}</Typography>
          ))}
        </Paper>
      )}

      {/* Barra de acciones */}
      <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
        {activeCount > 0 && (
          <Button size="small" onClick={() => setValues({})}
            sx={{ mr: "auto", fontSize: "0.7rem", textTransform: "none", color: C.textFaint, "&:hover": { color: C.red, bgcolor: C.redLight } }}>
            Limpiar todo
          </Button>
        )}
        <Button variant="outlined" size="small" onClick={() => (onSuccess ? onSuccess() : navigate(-1))} disabled={saving}
          sx={{ borderRadius: "5px", textTransform: "none", fontWeight: 600, borderColor: C.border, color: C.textMid, "&:hover": { borderColor: C.borderMid, bgcolor: C.bg } }}>
          Cancelar
        </Button>
        <Button variant="contained" size="small" disableElevation
          startIcon={saving ? <CircularProgress size={11} color="inherit" /> : grandTotal > 0 ? <CheckCircleIcon sx={{ fontSize: "0.84rem !important" }} /> : <AddIcon sx={{ fontSize: "0.84rem !important" }} />}
          onClick={handleSubmit}
          disabled={saving || grandTotal === 0 || validationErrors.length > 0}
          sx={{
            minWidth: 200, fontWeight: 700, borderRadius: "5px", textTransform: "none", fontSize: "0.8rem",
            bgcolor: saving || grandTotal === 0 ? undefined : C.text, "&:hover": { bgcolor: C.accentHover },
            "&.Mui-disabled": { bgcolor: C.bg, color: C.textFaint },
          }}>
          {saving ? "Guardando…" : grandTotal === 0 ? "Asigna preguntas para guardar" : `Guardar requerimientos — ${grandTotal} preguntas`}
        </Button>
      </Box>

      {/* Modal textos */}
      {textModal.block && examId && (
        <ExamTextModal key={textModal.openKey} open={textModal.open} onClose={() => setTextModal({ open: false, block: null, openKey: 0 })}
          examId={examId} area={selectedArea} block={textModal.block} maxQuestions={values[textModal.block.id]?.nQuestions ?? 0} />
      )}

      {/* Snackbars */}
      <Snackbar open={successOpen} autoHideDuration={1600} onClose={() => setSuccessOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="success" variant="filled" icon={<CheckCircleIcon />} sx={{ width: "100%", fontWeight: 600, borderRadius: "5px", bgcolor: C.green }}>
          Requerimientos guardados correctamente.
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="error" variant="filled" sx={{ width: "100%", fontWeight: 600, borderRadius: "5px", bgcolor: C.red }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}