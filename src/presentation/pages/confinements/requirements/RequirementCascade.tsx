import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  LockOutlined as LockIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  CheckCircleOutline as ActiveIcon,
  SplitscreenOutlined as SplitIcon,
} from "@mui/icons-material";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ConfinementRequirement } from "../../../../models/ConfinementRequirement";
import type { Block } from "../../../../models/Block";

// ─── tipos ────────────────────────────────────────────────────────────────────
type Difficulty = "EASY" | "NORMAL" | "HARD";

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD"];

const DIFF_LABELS: Record<Difficulty, string> = {
  EASY: "Fácil",
  NORMAL: "Normal",
  HARD: "Difícil",
};

const DIFF_COLORS: Record<Difficulty, "success" | "warning" | "error"> = {
  EASY: "success",
  NORMAL: "warning",
  HARD: "error",
};

/**
 * Valor de un nodo en modo sub-bloque (sin dificultad).
 * nQuestions es el total que se asigna al nodo.
 * splitByDifficulty=true habilita la expansión de los 3 sub-nodos de dificultad.
 * diffQuestions guarda las preguntas de cada dificultad cuando splitByDifficulty=true.
 */
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
  existing?: ConfinementRequirement;
  /** Hijos existentes en BD que son hijos de dificultad (mismo block_id que este nodo) */
  existingDiffChildren?: ConfinementRequirement[];
}

type FilterMode = "all" | "active";

// ─── buildNodes ───────────────────────────────────────────────────────────────
const buildNodes = (blocks: Block[]): TreeNode[] => {
  const nodes: TreeNode[] = [];

  const getDescendantIds = (blockId: number): number[] => {
    const direct = blocks.filter((b) => b.parent_block_id === blockId);
    const ids: number[] = [];
    for (const c of direct) {
      ids.push(c.id);
      ids.push(...getDescendantIds(c.id));
    }
    return ids;
  };

  const recurse = (parentId: number | null, depth: number, path: Block[]) => {
    const children = blocks
      .filter((b) => b.parent_block_id === parentId)
      .sort((a, b) => a.id - b.id);
    for (const block of children) {
      const currentPath = [...path, block];
      const directChildren = blocks.filter((b) => b.parent_block_id === block.id);
      nodes.push({
        block,
        depth,
        path: currentPath,
        childIds: getDescendantIds(block.id),
        directChildIds: directChildren.map((b) => b.id),
      });
      recurse(block.id, depth + 1, currentPath);
    }
  };

  recurse(null, 0, []);
  return nodes;
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const emptyDiffQuestions = (): Record<Difficulty, number> => ({
  EASY: 0,
  NORMAL: 0,
  HARD: 0,
});

const diffTotal = (dq: Record<Difficulty, number>) =>
  DIFFICULTIES.reduce((s, d) => s + (dq[d] ?? 0), 0);

// ─── componente ──────────────────────────────────────────────────────────────
export default function RequirementList({
  initialConfinementId,
  onSuccess,
}: {
  initialConfinementId?: string;
  onSuccess?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { confinementId: urlConfinementId } = useParams<{ confinementId: string }>();
  const confinementId = initialConfinementId || urlConfinementId;

  // ── estado ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allNodes, setAllNodes] = useState<TreeNode[]>([]);
  const [existingReqs, setExistingReqs] = useState<ConfinementRequirement[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [values, setValues] = useState<Record<number, NodeValue>>({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [blocksData, reqsData] = await Promise.all([
          GetBlocks(),
          confinementId
            ? ConfinementRequirementApi.getByConfinement(confinementId)
            : Promise.resolve([]),
        ]);

        setExistingReqs(reqsData);

        const nodes = buildNodes(blocksData);

        // Mapa blockId → req para acceso rápido (solo reqs sin difficulty)
        const reqByBlockId = new Map<number, ConfinementRequirement>();
        // Reqs con difficulty agrupados por su parent_id
        const diffReqsByParentId = new Map<number, ConfinementRequirement[]>();

        for (const req of reqsData) {
          if (!req.block_id) continue;
          if (req.difficulty) {
            // Es un hijo de dificultad
            const parentId = req.parent_id;
            if (parentId !== undefined && parentId !== null) {
              if (!diffReqsByParentId.has(parentId)) diffReqsByParentId.set(parentId, []);
              diffReqsByParentId.get(parentId)!.push(req);
            }
          } else {
            reqByBlockId.set(req.block_id, req);
          }
        }

        const nodesWithExisting = nodes.map((node) => {
          const existing = reqByBlockId.get(node.block.id);
          // Hijos de dificultad = reqs con el mismo block_id que este nodo (mismo bloque, con difficulty)
          // Se identifican por tener parent_id = existing.id y block_id = node.block.id y difficulty != null
          const existingDiffChildren = existing?.id
            ? (diffReqsByParentId.get(existing.id) ?? []).filter(
                (r) => r.block_id === node.block.id
              )
            : [];
          return { ...node, existing, existingDiffChildren };
        });

        setAllNodes(nodesWithExisting);

        // Precarga valores desde BD
        const initValues: Record<number, NodeValue> = {};
        for (const node of nodesWithExisting) {
          const req = node.existing;
          if (!req || !(req.n_questions ?? 0)) continue;

          const hasDiffChildren = (node.existingDiffChildren ?? []).length > 0;
          const diffQuestions = emptyDiffQuestions();

          if (hasDiffChildren) {
            for (const dr of node.existingDiffChildren!) {
              if (dr.difficulty) {
                diffQuestions[dr.difficulty as Difficulty] = dr.n_questions ?? 0;
              }
            }
          }

          initValues[node.block.id] = {
            nQuestions: req.n_questions ?? 0,
            splitByDifficulty: hasDiffChildren,
            diffQuestions,
          };
        }
        setValues(initValues);

        // Expande ancestros de bloques con valor
        const toExpand = new Set<number>();
        for (const [blockId] of Object.entries(initValues)) {
          const node = nodes.find((n) => n.block.id === Number(blockId));
          if (node) node.path.slice(0, -1).forEach((a) => toExpand.add(a.id));
        }
        setExpandedIds(toExpand);
      } catch {
        setErrorMessage("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [confinementId]);

  // ── bloqueados ──────────────────────────────────────────────────────────────
  /**
   * Un nodo está bloqueado si algún ancestro tiene un valor asignado
   * (ya que el ancestro ya "cubre" ese sub-árbol con su propio n_questions).
   * 
   * Excepción: si el ancestro tiene splitByDifficulty=true, sus hijos de bloque
   * (block_id distinto) siguen bloqueados porque la división de dificultad ocurre
   * sobre el mismo block_id, no sobre sub-bloques.
   */
  const blockedIds = useMemo(() => {
    const blocked = new Set<number>();
    for (const node of allNodes) {
      const v = values[node.block.id];
      if (v?.nQuestions) {
        for (const childId of node.childIds) blocked.add(childId);
      }
    }
    return blocked;
  }, [allNodes, values]);

  /**
   * Modo que los hijos DIRECTOS de cada nodo ya establecieron.
   * Necesario para saber si se puede activar splitByDifficulty en un nodo.
   * - "subblock": algún hijo directo tiene valor (modo sub-bloque normal).
   * - "none": ningún hijo tiene valor.
   */
  const childrenModeOf = useMemo((): Record<number, "none" | "subblock"> => {
    const modes: Record<number, "none" | "subblock"> = {};
    for (const node of allNodes) {
      const parentId = node.block.parent_block_id;
      if (parentId === null) continue;
      const v = values[node.block.id];
      if (v?.nQuestions) {
        modes[parentId] = "subblock";
      }
    }
    return modes;
  }, [allNodes, values]);

  // ── totales automáticos ─────────────────────────────────────────────────────
  const autoTotals = useMemo((): Record<number, number> => {
    const totals: Record<number, number> = {};
    for (const node of allNodes) {
      const v = values[node.block.id];
      if (!v?.nQuestions || blockedIds.has(node.block.id)) continue;
      for (const ancestor of node.path.slice(0, -1)) {
        if (!values[ancestor.id]?.nQuestions) {
          totals[ancestor.id] = (totals[ancestor.id] ?? 0) + v.nQuestions;
        }
      }
    }
    return totals;
  }, [allNodes, blockedIds, values]);

  // ── grand total ─────────────────────────────────────────────────────────────
  const grandTotal = useMemo(() => {
    let total = 0;
    for (const node of allNodes) {
      const v = values[node.block.id];
      if (!v?.nQuestions || blockedIds.has(node.block.id)) continue;
      const hasValuedAncestor = node.path.slice(0, -1).some((a) => values[a.id]?.nQuestions);
      if (!hasValuedAncestor) total += v.nQuestions;
    }
    return total;
  }, [allNodes, blockedIds, values]);

  const activeCount = useMemo(
    () => Object.values(values).filter((v) => v.nQuestions > 0).length,
    [values]
  );

  // ── nodos visibles ──────────────────────────────────────────────────────────
  const visibleNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allNodes.filter((node) => {
      if (q) {
        const selfMatch =
          node.block.name.toLowerCase().includes(q) ||
          (node.block.code ?? "").toLowerCase().includes(q);
        const childMatch = node.childIds.some((id) => {
          const cn = allNodes.find((n) => n.block.id === id);
          return (
            cn &&
            (cn.block.name.toLowerCase().includes(q) ||
              (cn.block.code ?? "").toLowerCase().includes(q))
          );
        });
        if (!selfMatch && !childMatch) return false;
      }
      if (filterMode === "active") {
        const hasVal = !!values[node.block.id]?.nQuestions;
        const childHasVal = node.childIds.some((id) => !!values[id]?.nQuestions);
        if (!hasVal && !childHasVal) return false;
      }
      if (!q && filterMode !== "active") {
        if (node.depth === 0) return true;
        return node.path.slice(0, -1).every((a) => expandedIds.has(a.id));
      }
      return true;
    });
  }, [allNodes, expandedIds, searchQuery, filterMode, values]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const setNQuestions = useCallback((blockId: number, n: number) => {
    setValues((prev) => {
      if (n <= 0) {
        const next = { ...prev };
        delete next[blockId];
        return next;
      }
      return {
        ...prev,
        [blockId]: {
          nQuestions: n,
          splitByDifficulty: prev[blockId]?.splitByDifficulty ?? false,
          diffQuestions: prev[blockId]?.diffQuestions ?? emptyDiffQuestions(),
        },
      };
    });
  }, []);

  const toggleSplitByDifficulty = useCallback((blockId: number) => {
    setValues((prev) => {
      const current = prev[blockId];
      if (!current) return prev;
      const newSplit = !current.splitByDifficulty;
      return {
        ...prev,
        [blockId]: {
          ...current,
          splitByDifficulty: newSplit,
          // Al desactivar, limpia las preguntas por dificultad
          diffQuestions: newSplit ? current.diffQuestions : emptyDiffQuestions(),
        },
      };
    });
  }, []);

  const setDiffQuestions = useCallback((blockId: number, diff: Difficulty, n: number) => {
    setValues((prev) => {
      const current = prev[blockId];
      if (!current) return prev;
      return {
        ...prev,
        [blockId]: {
          ...current,
          diffQuestions: {
            ...current.diffQuestions,
            [diff]: Math.max(0, n),
          },
        },
      };
    });
  }, []);

  const clearVal = useCallback((blockId: number) => {
    setValues((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setValues({}), []);

  const toggleExpand = useCallback(
    (blockId: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(blockId)) {
          const node = allNodes.find((n) => n.block.id === blockId);
          if (node) node.childIds.forEach((id) => next.delete(id));
          next.delete(blockId);
        } else {
          next.add(blockId);
        }
        return next;
      });
    },
    [allNodes]
  );

  const expandAll = useCallback(() => {
    setExpandedIds(
      new Set(allNodes.filter((n) => n.directChildIds.length > 0).map((n) => n.block.id))
    );
  }, [allNodes]);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, key: string) => {
      if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        const keys = Object.keys(inputRefs.current);
        const idx = keys.indexOf(key);
        if (idx >= 0 && idx < keys.length - 1) {
          inputRefs.current[keys[idx + 1]]?.focus();
          inputRefs.current[keys[idx + 1]]?.select();
        }
      }
    },
    []
  );

  // ── validaciones antes de submit ────────────────────────────────────────────
  const validationErrors = useMemo((): string[] => {
    const errors: string[] = [];
    for (const node of allNodes) {
      const v = values[node.block.id];
      if (!v?.nQuestions) continue;
      if (v.splitByDifficulty) {
        const total = diffTotal(v.diffQuestions);
        if (total === 0) {
          errors.push(`"${node.block.name}": debes asignar preguntas a las dificultades.`);
        } else if (total !== v.nQuestions) {
          errors.push(
            `"${node.block.name}": la suma por dificultad (${total}) debe ser igual al total (${v.nQuestions}).`
          );
        }
      }
    }
    return errors;
  }, [allNodes, values]);

  // ── submit ──────────────────────────────────────────────────────────────────
  /**
   * Flujo real del backend:
   * 
   * 1. Para un nodo SIN dificultad: se crea/actualiza con n_questions, sin difficulty.
   * 2. Para un nodo CON splitByDifficulty:
   *    a. Se crea/actualiza el nodo padre (mismo block_id, sin difficulty).
   *    b. Luego se crean 3 hijos con el mismo block_id y difficulty=EASY/NORMAL/HARD.
   *       El parent_id de cada hijo = id del nodo padre recién creado/actualizado.
   * 
   * validateDifficultyConsistency en backend verifica:
   *   - block.id === parent.block_id → mismo bloque → requiere difficulty != null
   *   - block.parent_block_id === parent.block_id → sub-bloque → no debe tener difficulty
   */
  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }

    setSaving(true);
    try {
      if (!confinementId) throw new Error("confinementId es requerido");

      const activeNodes = allNodes.filter(
        (n) => values[n.block.id]?.nQuestions && !blockedIds.has(n.block.id)
      );
      if (activeNodes.length === 0)
        throw new Error("Ingresa al menos un bloque con preguntas");

      // Mapa blockId → req.id de los ya existentes en BD (sin difficulty)
      const createdMap: Record<number, number> = {};
      for (const req of existingReqs) {
        if (req.block_id && req.id && !req.difficulty) createdMap[req.block_id] = req.id;
      }

      // Mapa reqId → lista de reqs de dificultad ya en BD
      const existingDiffMap: Record<number, ConfinementRequirement[]> = {};
      for (const req of existingReqs) {
        if (req.difficulty && req.parent_id) {
          if (!existingDiffMap[req.parent_id]) existingDiffMap[req.parent_id] = [];
          existingDiffMap[req.parent_id].push(req);
        }
      }

      // Construye el mapa de proceso: activos + sus ancestros intermedios
      interface ProcessEntry {
        nQ: number;
        depth: number;
        splitByDifficulty: boolean;
        diffQuestions: Record<Difficulty, number>;
      }
      const nodeMap: Record<number, ProcessEntry> = {};

      for (const node of activeNodes) {
        const bv = values[node.block.id]!;
        nodeMap[node.block.id] = {
          nQ: bv.nQuestions,
          depth: node.depth,
          splitByDifficulty: bv.splitByDifficulty,
          diffQuestions: bv.diffQuestions,
        };

        // Ancestros intermedios sin valor propio
        for (const ancestor of node.path.slice(0, -1)) {
          const aVal = values[ancestor.id]?.nQuestions;
          const ancestorNode = allNodes.find((n) => n.block.id === ancestor.id)!;
          if (!aVal) {
            nodeMap[ancestor.id] = {
              nQ: (nodeMap[ancestor.id]?.nQ ?? 0) + bv.nQuestions,
              depth: ancestorNode.depth,
              splitByDifficulty: false,
              diffQuestions: emptyDiffQuestions(),
            };
          } else if (!nodeMap[ancestor.id]) {
            const av = values[ancestor.id]!;
            nodeMap[ancestor.id] = {
              nQ: aVal,
              depth: ancestorNode.depth,
              splitByDifficulty: av.splitByDifficulty,
              diffQuestions: av.diffQuestions,
            };
          }
        }
      }

      // Procesa raíz → hojas
      const toProcess = Object.entries(nodeMap)
        .map(([id, entry]) => ({ blockId: Number(id), ...entry }))
        .sort((a, b) => a.depth - b.depth);

      const rootReq = existingReqs.find(
        (r) => r.parent_id === null || r.parent_id === undefined
      );

      for (const item of toProcess) {
        if (!item.nQ) continue;

        const node = allNodes.find((n) => n.block.id === item.blockId)!;
        const parentBlockId = node.block.parent_block_id;
        let parentReqId = parentBlockId ? (createdMap[parentBlockId] ?? null) : null;
        if (!parentReqId && rootReq?.id) parentReqId = rootReq.id;

        let thisReqId: number;

        if (createdMap[item.blockId] !== undefined) {
          // UPDATE del nodo base
          await UpdateConfinementBlock(createdMap[item.blockId], {
            n_questions: item.nQ,
          });
          thisReqId = createdMap[item.blockId];
        } else {
          // CREATE del nodo base (sin difficulty)
          const payload: Partial<ConfinementRequirement> = {
            confinement_id: confinementId,
            block_id: item.blockId,
            n_questions: item.nQ,
            parent_id: parentReqId ?? undefined,
            // No se incluye difficulty aquí → backend usa validateBlockHierarchy
          };
          const created = await CreateConfinementBlock(payload);
          if (created.id) {
            createdMap[item.blockId] = created.id;
            thisReqId = created.id;
          } else {
            continue;
          }
        }

        // Si el nodo se divide por dificultad, crear/actualizar los 3 hijos
        if (item.splitByDifficulty) {
          const existingDiffChildren = existingDiffMap[thisReqId] ?? [];

          for (const diff of DIFFICULTIES) {
            const nQ = item.diffQuestions[diff] ?? 0;
            if (nQ <= 0) continue;

            const existingDiffReq = existingDiffChildren.find(
              (r) => r.difficulty === diff
            );

            if (existingDiffReq?.id) {
              // UPDATE del hijo de dificultad
              await UpdateConfinementBlock(existingDiffReq.id, {
                n_questions: nQ,
              });
            } else {
              // CREATE del hijo de dificultad:
              // block_id = MISMO que el padre (mismo bloque)
              // difficulty = EASY | NORMAL | HARD
              // parent_id = id del req padre recién creado
              const diffPayload: Partial<ConfinementRequirement> = {
                confinement_id: confinementId,
                block_id: item.blockId, // mismo block_id que el padre
                n_questions: nQ,
                parent_id: thisReqId,
                difficulty: diff,
              };
              await CreateConfinementBlock(diffPayload);
            }
          }
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

  // ── render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={32} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          size="small"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
          sx={{ color: "text.secondary", flexShrink: 0 }}
        >
          Volver
        </Button>
        <Divider orientation="vertical" flexItem />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
          Requerimientos de confinamiento
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {activeCount > 0 && (
            <Chip
              size="small"
              label={`${activeCount} bloques activos`}
              color="primary"
              variant="outlined"
            />
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

      {/* Barra de herramientas */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Buscar bloque o código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: "1 1 220px", minWidth: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: "1rem", color: "text.disabled" }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery("")}>
                  <ClearIcon sx={{ fontSize: "0.9rem" }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={filterMode}
          onChange={(_, v) => v && setFilterMode(v)}
        >
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: "0.75rem", textTransform: "none" }}>
            Todos
          </ToggleButton>
          <ToggleButton value="active" sx={{ px: 1.5, fontSize: "0.75rem", textTransform: "none" }}>
            <Badge
              badgeContent={activeCount}
              color="primary"
              sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem" } }}
            >
              <ActiveIcon sx={{ fontSize: "0.95rem", mr: activeCount > 0 ? 2.5 : 0.5 }} />
            </Badge>
            Con valor
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Expandir todo">
          <IconButton size="small" onClick={expandAll}>
            <ExpandAllIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Colapsar todo">
          <IconButton size="small" onClick={collapseAll}>
            <CollapseAllIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Tooltip>

        {activeCount > 0 && (
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={clearAll}
            sx={{ ml: "auto", fontSize: "0.75rem" }}
          >
            Limpiar todo
          </Button>
        )}
      </Box>

      {/* Leyenda */}
      <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
          <Typography variant="caption" color="text.secondary">
            División por sub-bloque
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "secondary.main" }} />
          <Typography variant="caption" color="text.secondary">
            División por dificultad (mismo bloque)
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LockIcon sx={{ fontSize: "0.85rem", color: "text.disabled" }} />
          <Typography variant="caption" color="text.secondary">
            Bloqueado por ancestro
          </Typography>
        </Box>
      </Box>

      {/* Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 36, bgcolor: "grey.100", p: 0 }} />
              <TableCell
                sx={{ bgcolor: "grey.100", fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}
              >
                Bloque / Tema
              </TableCell>
              <TableCell
                sx={{ width: 90, bgcolor: "grey.100", fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}
              >
                Código
              </TableCell>
              <TableCell
                sx={{ width: 120, bgcolor: "grey.100", fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}
              >
                N° Preguntas
              </TableCell>
              <TableCell
                sx={{ width: 320, bgcolor: "grey.100", fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}
              >
                División por dificultad
                <Tooltip title="Al activar, se crearán 3 sub-requisitos con el mismo bloque: Fácil, Normal y Difícil. La suma debe coincidir con el total.">
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 0.5, color: "text.disabled", cursor: "help" }}
                  >
                    (?)
                  </Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleNodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "text.disabled" }}>
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              visibleNodes.map((node) => {
                const isBlocked = blockedIds.has(node.block.id);
                const bv = values[node.block.id];
                const hasValue = !!bv?.nQuestions;
                const nQuestions = bv?.nQuestions ?? 0;
                const splitByDifficulty = bv?.splitByDifficulty ?? false;
                const diffQuestions = bv?.diffQuestions ?? emptyDiffQuestions();
                const autoTotal = autoTotals[node.block.id] ?? 0;
                const hasChildren = node.directChildIds.length > 0;
                const isExpanded = expandedIds.has(node.block.id);
                const existing = node.existing;
                const isUpdating = existing && (existing.n_questions ?? 0) > 0;

                // El split por dificultad sólo está disponible si:
                // - El nodo tiene valor asignado
                // - No está bloqueado
                // - Sus hijos directos NO están en modo sub-bloque
                //   (no se puede mezclar: si hay hijos de bloque con valor, no se puede dividir por dificultad)
                const childMode = childrenModeOf[node.block.id] ?? "none";
                const splitAvailable = hasValue && !isBlocked && childMode !== "subblock";

                // Suma actual de dificultades
                const currentDiffTotal = diffTotal(diffQuestions);
                const diffMismatch =
                  splitByDifficulty && hasValue && currentDiffTotal > 0 && currentDiffTotal !== nQuestions;
                const diffOk =
                  splitByDifficulty && hasValue && currentDiffTotal === nQuestions && currentDiffTotal > 0;

                return (
                  <>
                    <TableRow
                      key={node.block.id}
                      sx={{
                        bgcolor: hasValue
                          ? splitByDifficulty
                            ? "rgba(156,39,176,0.04)"
                            : "primary.50"
                          : "background.paper",
                        opacity: isBlocked ? 0.35 : 1,
                        transition: "opacity 0.12s, background 0.12s",
                        borderLeft: hasValue ? "3px solid" : "3px solid transparent",
                        borderLeftColor: hasValue
                          ? splitByDifficulty
                            ? "secondary.main"
                            : "primary.main"
                          : "transparent",
                        "&:hover": {
                          bgcolor: isBlocked
                            ? undefined
                            : hasValue
                            ? splitByDifficulty
                              ? "rgba(156,39,176,0.07)"
                              : "primary.50"
                            : "action.hover",
                        },
                      }}
                    >
                      {/* Toggle árbol */}
                      <TableCell sx={{ p: 0, width: 36, textAlign: "center" }}>
                        {hasChildren && (
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(node.block.id)}
                            sx={{ p: 0.5, color: "text.secondary" }}
                          >
                            {isExpanded ? (
                              <ExpandMoreIcon sx={{ fontSize: "1rem" }} />
                            ) : (
                              <ChevronRightIcon sx={{ fontSize: "1rem" }} />
                            )}
                          </IconButton>
                        )}
                      </TableCell>

                      {/* Nombre */}
                      <TableCell sx={{ py: 0.5 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", pl: node.depth * 2.5 }}
                        >
                          {!hasChildren && <Box sx={{ width: 28 }} />}
                          <Typography
                            variant="body2"
                            fontWeight={node.depth === 0 ? 600 : hasValue ? 600 : 400}
                            sx={{ color: isBlocked ? "text.disabled" : "text.primary" }}
                          >
                            {node.block.name}
                          </Typography>

                          {isBlocked && (
                            <Tooltip title="Bloqueado: un ancestro ya tiene preguntas asignadas.">
                              <LockIcon
                                sx={{ ml: 1, fontSize: "0.8rem", color: "text.disabled" }}
                              />
                            </Tooltip>
                          )}

                          {!isBlocked && isUpdating && (
                            <Tooltip
                              title={`BD: ${existing!.n_questions} preguntas. Se actualizará.`}
                            >
                              <Typography
                                variant="caption"
                                sx={{ ml: 1.5, color: "warning.main", fontWeight: 500 }}
                              >
                                (BD: {existing!.n_questions})
                              </Typography>
                            </Tooltip>
                          )}

                          {hasValue && !isBlocked && (
                            <Tooltip
                              title={
                                splitByDifficulty
                                  ? "División por dificultad activa"
                                  : "División por sub-bloque"
                              }
                            >
                              <Box
                                sx={{
                                  ml: 1,
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  bgcolor: splitByDifficulty ? "secondary.main" : "primary.main",
                                  flexShrink: 0,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      {/* Código */}
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {node.block.code || "—"}
                        </Typography>
                      </TableCell>

                      {/* N° Preguntas */}
                      <TableCell sx={{ textAlign: "center", py: 0.5 }}>
                        {isBlocked ? (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        ) : autoTotal > 0 && !hasValue ? (
                          <Tooltip title="Suma automática de sub-bloques hijos.">
                            <Typography
                              variant="body2"
                              color="text.disabled"
                              sx={{ fontStyle: "italic" }}
                            >
                              {autoTotal}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                            }}
                          >
                            <TextField
                              type="number"
                              size="small"
                              value={hasValue ? nQuestions : ""}
                              placeholder="0"
                              inputRef={(el) => {
                                inputRefs.current[`nq-${node.block.id}`] = el;
                              }}
                              onChange={(e) =>
                                setNQuestions(
                                  node.block.id,
                                  Math.max(0, parseInt(e.target.value || "0", 10))
                                )
                              }
                              onKeyDown={(e) => handleKeyDown(e, `nq-${node.block.id}`)}
                              inputProps={{
                                min: 0,
                                style: {
                                  textAlign: "center",
                                  padding: "3px 6px",
                                  width: 64,
                                  fontWeight: hasValue ? 600 : 400,
                                  fontSize: "0.85rem",
                                },
                                onWheel: (e) => (e.target as HTMLInputElement).blur(),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 1,
                                  "& fieldset": {
                                    borderColor: hasValue
                                      ? splitByDifficulty
                                        ? "secondary.main"
                                        : "primary.main"
                                      : "divider",
                                  },
                                },
                              }}
                            />
                            {hasValue && (
                              <Tooltip title="Limpiar valor">
                                <IconButton
                                  size="small"
                                  onClick={() => clearVal(node.block.id)}
                                  sx={{
                                    p: 0.25,
                                    color: "text.disabled",
                                    "&:hover": { color: "error.main" },
                                  }}
                                >
                                  <ClearIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </TableCell>

                      {/* División por dificultad */}
                      <TableCell sx={{ py: 0.5, textAlign: "center" }}>
                        {!hasValue || isBlocked ? (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        ) : !splitAvailable ? (
                          <Tooltip title="Este nodo tiene hijos sub-bloques activos. No se puede mezclar modos.">
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontStyle: "italic" }}
                            >
                              No disponible
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <Tooltip
                              title={
                                splitByDifficulty
                                  ? "Desactivar división por dificultad"
                                  : "Dividir este bloque por dificultad (Fácil / Normal / Difícil)"
                              }
                            >
                              <Button
                                size="small"
                                variant={splitByDifficulty ? "contained" : "outlined"}
                                color="secondary"
                                startIcon={<SplitIcon sx={{ fontSize: "0.9rem" }} />}
                                onClick={() => toggleSplitByDifficulty(node.block.id)}
                                sx={{
                                  fontSize: "0.7rem",
                                  textTransform: "none",
                                  py: 0.25,
                                  px: 1,
                                }}
                              >
                                {splitByDifficulty ? "Activo" : "Dividir"}
                              </Button>
                            </Tooltip>

                            {splitByDifficulty && (
                              <>
                                {diffMismatch && (
                                  <Tooltip
                                    title={`La suma (${currentDiffTotal}) debe ser igual al total (${nQuestions})`}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="error"
                                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                                    >
                                      {currentDiffTotal}/{nQuestions}
                                    </Typography>
                                  </Tooltip>
                                )}
                                {diffOk && (
                                  <Typography
                                    variant="caption"
                                    color="success.main"
                                    sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                                  >
                                    ✓ {currentDiffTotal}/{nQuestions}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Fila expandida de dificultades */}
                    {hasValue && splitByDifficulty && !isBlocked && (
                      <TableRow
                        key={`diff-${node.block.id}`}
                        sx={{
                          bgcolor: "rgba(156,39,176,0.03)",
                          borderLeft: "3px solid",
                          borderLeftColor: "secondary.main",
                        }}
                      >
                        <TableCell sx={{ p: 0, width: 36 }} />
                        <TableCell
                          colSpan={4}
                          sx={{ py: 1, pl: node.depth * 2.5 + 4 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 120 }}
                            >
                              Mismo bloque · Distribución:
                            </Typography>

                            {DIFFICULTIES.map((diff) => {
                              const refKey = `diff-${node.block.id}-${diff}`;
                              return (
                                <Box
                                  key={diff}
                                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                                >
                                  <Chip
                                    size="small"
                                    label={DIFF_LABELS[diff]}
                                    color={DIFF_COLORS[diff]}
                                    sx={{
                                      fontSize: "0.65rem",
                                      height: 20,
                                      minWidth: 48,
                                    }}
                                  />
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={diffQuestions[diff] || ""}
                                    placeholder="0"
                                    inputRef={(el) => {
                                      inputRefs.current[refKey] = el;
                                    }}
                                    onChange={(e) =>
                                      setDiffQuestions(
                                        node.block.id,
                                        diff,
                                        parseInt(e.target.value || "0", 10)
                                      )
                                    }
                                    onKeyDown={(e) => handleKeyDown(e, refKey)}
                                    inputProps={{
                                      min: 0,
                                      max: nQuestions,
                                      style: {
                                        textAlign: "center",
                                        padding: "2px 4px",
                                        width: 52,
                                        fontSize: "0.8rem",
                                        fontWeight: diffQuestions[diff] ? 600 : 400,
                                      },
                                      onWheel: (e) => (e.target as HTMLInputElement).blur(),
                                    }}
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 1,
                                        "& fieldset": {
                                          borderColor:
                                            diffQuestions[diff] > 0
                                              ? diff === "EASY"
                                                ? "success.main"
                                                : diff === "NORMAL"
                                                ? "warning.main"
                                                : "error.main"
                                              : "divider",
                                        },
                                      },
                                    }}
                                  />
                                </Box>
                              );
                            })}

                            {/* Indicador de suma */}
                            <Typography
                              variant="caption"
                              color={
                                currentDiffTotal === 0
                                  ? "text.disabled"
                                  : currentDiffTotal === nQuestions
                                  ? "success.main"
                                  : "error.main"
                              }
                              sx={{ fontWeight: 600, ml: 1 }}
                            >
                              {currentDiffTotal === 0
                                ? `Total: ${nQuestions}`
                                : `${currentDiffTotal} / ${nQuestions}`}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}

            {/* Fila total */}
            <TableRow
              sx={{ bgcolor: "grey.100", borderTop: "2px solid", borderColor: "divider" }}
            >
              <TableCell colSpan={3} sx={{ py: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Total general
                </Typography>
              </TableCell>
              <TableCell sx={{ textAlign: "center", py: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={grandTotal > 0 ? "primary.main" : "text.disabled"}
                >
                  {grandTotal > 0 ? grandTotal : "—"}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>

        <Divider />

        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <Box sx={{ px: 3, py: 1 }}>
            {validationErrors.map((err, i) => (
              <Typography key={i} variant="caption" color="error" display="block">
                ⚠ {err}
              </Typography>
            ))}
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 1.75,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
          }}
        >
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
      </Paper>

      {/* Snackbars */}
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