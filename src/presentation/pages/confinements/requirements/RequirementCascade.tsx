import { useEffect, useState, useMemo } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  LockOutlined as LockIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ConfinementRequirement } from "../../../../models/ConfinementRequirement";
import type { Block } from "../../../../models/Block";

// ─── tipos internos ───────────────────────────────────────────────────────────
interface TreeNode {
  block: Block;
  depth: number;
  path: Block[];
  childIds: number[];
  directChildIds: number[];
  nQuestions: number;
  existing?: ConfinementRequirement;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const buildNodes = (blocks: Block[]): TreeNode[] => {
  const nodes: TreeNode[] = [];

  const getDescendantIds = (blockId: number): number[] => {
    const direct = blocks.filter((b) => b.parent_block_id === blockId);
    const ids: number[] = [];
    for (const child of direct) {
      ids.push(child.id);
      ids.push(...getDescendantIds(child.id));
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
        nQuestions: 0,
      });
      recurse(block.id, depth + 1, currentPath);
    }
  };

  recurse(null, 0, []);
  return nodes;
};

// ─── componente principal ─────────────────────────────────────────────────────
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allNodes, setAllNodes] = useState<TreeNode[]>([]);
  const [existingReqs, setExistingReqs] = useState<ConfinementRequirement[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── carga inicial ────────────────────────────────────────────────────────────
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
        const filled = nodes.map((node) => {
          const existing = reqsData.find(
            (r) => r.block_id === node.block.id && !r.difficulty
          );
          return { ...node, nQuestions: existing?.n_questions ?? 0, existing };
        });

        setAllNodes(filled);
      } catch {
        setErrorMessage("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [confinementId]);

  // ── nodos visibles ───────────────────────────────────────────────────────────
  const visibleNodes = useMemo(() => {
    return allNodes.filter((node) => {
      if (node.depth === 0) return true;
      return node.path.slice(0, -1).every((ancestor) =>
        expandedIds.has(ancestor.id)
      );
    });
  }, [allNodes, expandedIds]);

  // ── toggle expandir ──────────────────────────────────────────────────────────
  const toggleExpand = (blockId: number) => {
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
  };

  // ── IDs bloqueados ───────────────────────────────────────────────────────────
  const blockedIds = useMemo(() => {
    const blocked = new Set<number>();
    for (const node of allNodes) {
      if (node.nQuestions > 0) {
        for (const childId of node.childIds) blocked.add(childId);
      }
    }
    return blocked;
  }, [allNodes]);

  // ── totales automáticos ──────────────────────────────────────────────────────
  const autoTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const node of allNodes) {
      if (node.nQuestions > 0 && !blockedIds.has(node.block.id)) {
        for (const ancestor of node.path.slice(0, -1)) {
          const aNode = allNodes.find((n) => n.block.id === ancestor.id);
          if (aNode && aNode.nQuestions === 0) {
            totals[ancestor.id] = (totals[ancestor.id] ?? 0) + node.nQuestions;
          }
        }
      }
    }
    return totals;
  }, [allNodes, blockedIds]);

  // ── total general ────────────────────────────────────────────────────────────
  const grandTotal = useMemo(() => {
    let total = 0;
    for (const node of allNodes) {
      if (node.nQuestions > 0 && !blockedIds.has(node.block.id)) {
        const hasValuedAncestor = node.path
          .slice(0, -1)
          .some((a) => (allNodes.find((n) => n.block.id === a.id)?.nQuestions ?? 0) > 0);
        if (!hasValuedAncestor) total += node.nQuestions;
      }
    }
    return total;
  }, [allNodes, blockedIds]);

  // ── handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (blockId: number, value: string) => {
    const n = Math.max(0, parseInt(value || "0", 10));
    setAllNodes((prev) =>
      prev.map((node) => (node.block.id === blockId ? { ...node, nQuestions: n } : node))
    );
  };

  const handleClear = (blockId: number) => {
    setAllNodes((prev) =>
      prev.map((node) => (node.block.id === blockId ? { ...node, nQuestions: 0 } : node))
    );
  };

  // ── submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (!confinementId) throw new Error("confinementId es requerido");

      const activeNodes = allNodes.filter(
        (n) => n.nQuestions > 0 && !blockedIds.has(n.block.id)
      );

      if (activeNodes.length === 0)
        throw new Error("Ingresa al menos un bloque con preguntas");

      const createdMap: Record<number, number> = {};
      for (const req of existingReqs) {
        if (req.block_id && req.id && !req.difficulty) {
          createdMap[req.block_id] = req.id;
        }
      }

      const nodeQuestions: Record<number, number> = {};
      for (const node of activeNodes) {
        nodeQuestions[node.block.id] = node.nQuestions;
        for (const ancestor of node.path.slice(0, -1)) {
          const aNode = allNodes.find((n) => n.block.id === ancestor.id);
          if (!aNode || aNode.nQuestions === 0) {
            nodeQuestions[ancestor.id] =
              (nodeQuestions[ancestor.id] ?? 0) + node.nQuestions;
          } else {
            if (!nodeQuestions[ancestor.id]) {
              nodeQuestions[ancestor.id] = aNode.nQuestions;
            }
          }
        }
      }

      const toProcess = Object.keys(nodeQuestions)
        .map((id) => ({
          blockId: Number(id),
          depth: allNodes.find((n) => n.block.id === Number(id))?.depth ?? 0,
        }))
        .sort((a, b) => a.depth - b.depth);

      const rootReq = existingReqs.find(
        (r) => r.parent_id === null || r.parent_id === undefined
      );

      for (const { blockId } of toProcess) {
        const nQ = nodeQuestions[blockId];
        if (!nQ) continue;

        const node = allNodes.find((n) => n.block.id === blockId)!;
        const parentBlockId = node.block.parent_block_id;
        let parentReqId = parentBlockId ? (createdMap[parentBlockId] ?? null) : null;

        if (!parentReqId && rootReq?.id) parentReqId = rootReq.id;

        if (createdMap[blockId] !== undefined) {
          await UpdateConfinementBlock(createdMap[blockId], { n_questions: nQ });
        } else {
          const created = await CreateConfinementBlock({
            confinement_id: confinementId,
            block_id: blockId,
            n_questions: nQ,
            parent_id: parentReqId ?? undefined,
          });
          if (created.id) createdMap[blockId] = created.id;
        }
      }

      setSuccessOpen(true);
      setTimeout(() => {
        onSuccess ? onSuccess() : navigate(-1);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={32} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          size="small"
          onClick={() => (onSuccess ? onSuccess() : navigate(-1))}
          sx={{ color: "text.secondary" }}
        >
          Volver
        </Button>
        <Divider orientation="vertical" flexItem />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
          Requerimientos en cascada
        </Typography>
        {grandTotal > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 2, py: 0.5, bgcolor: "primary.main", borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={600} color="white">
              Total: {grandTotal} preguntas
            </Typography>
          </Box>
        )}
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {/* Instrucción */}
        <Box sx={{ px: 3, py: 1.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            Expande los bloques con <strong>▶</strong> para ver sus sub-bloques. Ingresa el numero de preguntas en cualquier nivel. Al asignar un valor a un bloque padre, sus hijos se bloquean automaticamente.
          </Typography>
        </Box>

        {/* Tabla */}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 44, textAlign: "center" }}>
                Nv.
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary" }}>
                Bloque
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 80 }}>
                Codigo
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 160, textAlign: "center" }}>
                N° Preguntas
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleNodes.map((node) => {
              const isBlocked = blockedIds.has(node.block.id);
              const hasValue = node.nQuestions > 0;
              const autoTotal = autoTotals[node.block.id] ?? 0;
              const hasChildren = node.directChildIds.length > 0;
              const isExpanded = expandedIds.has(node.block.id);
              const isUpdating = node.existing && (node.existing.n_questions ?? 0) > 0;

              return (
                <TableRow
                  key={node.block.id}
                  sx={{
                    bgcolor: hasValue ? "primary.50" : "background.paper",
                    opacity: isBlocked ? 0.4 : 1,
                    transition: "opacity 0.15s",
                    borderLeft: hasValue ? "3px solid" : "3px solid transparent",
                    borderLeftColor: hasValue ? "primary.main" : "transparent",
                    "&:hover": { bgcolor: isBlocked ? undefined : hasValue ? "primary.50" : "grey.50" },
                  }}
                >
                  {/* Nivel */}
                  <TableCell sx={{ textAlign: "center", py: 0.75 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: hasValue ? "primary.main" : "text.disabled",
                      }}
                    >
                      {node.depth + 1}
                    </Typography>
                  </TableCell>

                  {/* Nombre */}
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: "flex", alignItems: "center", pl: node.depth * 2.5 }}>
                      {hasChildren ? (
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(node.block.id)}
                          sx={{ p: 0.25, mr: 0.75, color: "text.secondary" }}
                        >
                          {isExpanded ? (
                            <ExpandMoreIcon sx={{ fontSize: "1rem" }} />
                          ) : (
                            <ChevronRightIcon sx={{ fontSize: "1rem" }} />
                          )}
                        </IconButton>
                      ) : (
                        <Box sx={{ width: 30 }} />
                      )}

                      <Typography
                        variant="body2"
                        fontWeight={node.depth === 0 ? 600 : hasValue ? 600 : 400}
                        sx={{ color: isBlocked ? "text.disabled" : "text.primary" }}
                      >
                        {node.block.name}
                      </Typography>

                      {isBlocked && (
                        <Tooltip title="Un bloque padre ya tiene valor asignado">
                          <LockIcon sx={{ ml: 1, fontSize: "0.8rem", color: "text.disabled" }} />
                        </Tooltip>
                      )}

                      {!isBlocked && isUpdating && (
                        <Tooltip title={`Valor actual en BD: ${node.existing!.n_questions}. Se actualizara.`}>
                          <Typography
                            variant="caption"
                            sx={{ ml: 1.5, color: "warning.main", fontWeight: 500 }}
                          >
                            (BD: {node.existing!.n_questions})
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Codigo */}
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="caption" color="text.disabled">
                      {node.block.code || "—"}
                    </Typography>
                  </TableCell>

                  {/* Input */}
                  <TableCell sx={{ textAlign: "center", py: 0.75 }}>
                    {isBlocked ? (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <TextField
                          type="number"
                          size="small"
                          value={hasValue ? node.nQuestions : ""}
                          placeholder={autoTotal > 0 ? `${autoTotal}` : "0"}
                          onChange={(e) => handleChange(node.block.id, e.target.value)}
                          inputProps={{
                            min: 0,
                            style: {
                              textAlign: "center",
                              padding: "3px 8px",
                              width: 80,
                              fontWeight: hasValue ? 600 : 400,
                              fontSize: "0.875rem",
                            },
                            onWheel: (e) => (e.target as HTMLInputElement).blur(),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                              "& fieldset": {
                                borderColor: hasValue ? "primary.main" : "divider",
                              },
                            },
                          }}
                        />
                        {hasValue && node.childIds.length > 0 && (
                          <Tooltip title="Limpiar y desbloquear hijos">
                            <IconButton
                              size="small"
                              onClick={() => handleClear(node.block.id)}
                              sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "error.main" } }}
                            >
                              <Typography sx={{ fontSize: "0.75rem", lineHeight: 1 }}>✕</Typography>
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Fila total */}
            <TableRow sx={{ bgcolor: "grey.100", borderTop: "2px solid", borderColor: "divider" }}>
              <TableCell colSpan={3} sx={{ py: 1.25 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Total general
                </Typography>
              </TableCell>
              <TableCell sx={{ textAlign: "center", py: 1.25 }}>
                <Typography variant="body2" fontWeight={700} color={grandTotal > 0 ? "primary.main" : "text.disabled"}>
                  {grandTotal > 0 ? grandTotal : "—"}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider />

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
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
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
            onClick={handleSubmit}
            disabled={saving || grandTotal === 0}
            disableElevation
            sx={{ minWidth: 160, fontWeight: 600 }}
          >
            {saving ? "Guardando..." : `Guardar (${grandTotal} preguntas)`}
          </Button>
        </Box>
      </Paper>

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