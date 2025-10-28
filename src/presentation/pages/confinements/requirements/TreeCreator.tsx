import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import * as d3 from "d3";

import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementRequirements";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";

/** ---------- MODELS (tu definición exacta) ---------- */
export interface Block {
  id: number;
  level_id: number;
  code: string;
  name: string;
  parent_block_id: number | null;
  created_at: string;
  updated_at: string;
  level?: Level;
  parentBlock?: Block;
  has_text: boolean;
}

export interface Level {
  id: number;
  stage: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfinementRequirement {
  id?: number;
  confinement_id: string;
  block_id?: number;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL" | string;
  n_questions: number;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  block?: Block;
  confinement?: any;
  parent?: ConfinementRequirement;
  children?: ConfinementRequirement[];
}

/** ---------- NodeData (para D3) ---------- */
type Condition = "COMPLETE" | "INCOMPLETE" | "INVALID";
interface NodeData {
  id: number;
  block: Block | null;
  n_questions: number;
  condition: Condition;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL" | null;
  children: NodeData[];
  parent_id?: number | null;
  total_questions_required?: number;
}

/** ---------- HELPERS para construir / buscar árbol ---------- */
function buildConfinementTree(requirements: ConfinementRequirement[]): NodeData {
  const map: Record<number, NodeData> = {};

  requirements.forEach((r) => {
    if (typeof r.id !== "number") return;
    map[r.id] = {
      id: r.id,
      block: r.block ?? null,
      n_questions: r.n_questions,
      condition: "INCOMPLETE",
      difficulty: (r.difficulty as NodeData["difficulty"]) ?? null,
      children: [],
      parent_id: r.parent_id ?? null,
    };
  });

  const roots: NodeData[] = [];

  requirements.forEach((r) => {
    if (typeof r.id !== "number") return;
    const node = map[r.id];
    if (r.parent_id && map[r.parent_id]) {
      map[r.parent_id].children.push(node);
    } else {
      roots.push(node);
    }
  });

  const calcTotal = (n: NodeData): number =>
    n.children.length === 0 ? n.n_questions : n.children.reduce((s, c) => s + calcTotal(c), 0);

  const addTotals = (n: NodeData): NodeData => ({
    ...n,
    total_questions_required: calcTotal(n),
    children: n.children.map(addTotals),
  });

  let rootNode: NodeData;
  if (roots.length === 1) rootNode = roots[0];
  else
    rootNode = {
      id: 0,
      block: null,
      n_questions: roots.reduce((s, r) => s + r.n_questions, 0),
      condition: "INCOMPLETE",
      difficulty: null,
      children: roots,
    };

  return addTotals(rootNode);
}


/** ---------- D3 Tree component (sin zoom; tamaños adaptativos) ---------- */
function Tree({
  data,
  onNodeClick,
  onNodeContext,
}: {
  data: NodeData;
  onNodeClick: (node: NodeData) => void;
  onNodeContext: (node: NodeData, clientX: number, clientY: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
const zoomBehavior = d3
  .zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.2, 7])
  .on("zoom", (event) => g.attr("transform", event.transform));

svg.call(zoomBehavior.transform,
  d3.zoomIdentity.translate(600, 50).scale(7));
    // Tooltip (cleanup must return void)
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "#fff")
      .style("padding", "6px 10px")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("opacity", 0)
      .style("z-index", "9999");

    // No zoom/pan — el contenedor vertical hará scroll al crecer

    const root = d3.hierarchy<NodeData>(data);

    // Decide tamaños según la altura del árbol
    // height = treeRoot.height (número de niveles desde node hasta leaves)
    const tempLayout = d3.tree<NodeData>().nodeSize([100, 130]);
    const tempRoot = tempLayout(root);
    const depth = tempRoot.height; // número de niveles por debajo del root

    // adaptative sizes
    let nodeRadius = 28;
    let nodeSizeX = 100;
    let nodeSizeY = 130;
    if (depth <= 3) {
      nodeRadius = 28;
      nodeSizeX = 100;
      nodeSizeY = 130;
    } else if (depth <= 6) {
      nodeRadius = 22;
      nodeSizeX = 80;
      nodeSizeY = 110;
    } else {
      nodeRadius = 18;
      nodeSizeX = 60;
      nodeSizeY = 90;
    }

    const layout = d3.tree<NodeData>().nodeSize([nodeSizeX, nodeSizeY]);
    const treeRoot = layout(root);

    const linkGen = d3.linkVertical<any, any>().x((d: any) => d.x).y((d: any) => d.y);

    g.selectAll("path.link")
      .data(treeRoot.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#bbb")
      .attr("stroke-width", 1.2)
      .attr("d", (d: any) => linkGen(d));

    const node = g
      .selectAll("g.node")
      .data(treeRoot.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .on("click", (_, d: any) => onNodeClick(d.data))
      .on("contextmenu", (event: any, d: any) => {
        event.preventDefault();
        onNodeContext(d.data, event.clientX, event.clientY);
      })
      .on("mouseover", (event: any, d: any) => {
        const nd: NodeData = d.data;
        let html = `<strong>${nd.block?.name ?? "Total"}</strong><br/>Preguntas: ${nd.n_questions}`;
        if (nd.difficulty) html += ` | Dificultad: ${nd.difficulty}`;
        if (nd.block) html += ` | Código: ${nd.block.code} | Nivel: ${nd.block.level_id}`;
        tooltip.style("opacity", 1).html(html).style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
      })
      .on("mousemove", (event: any) => tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`))
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Circle: tamaño dinámico
    node
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: any) => {
        if (!d.data.block) return "#e5e7eb";
        if (!d.data.difficulty) {
          const level = d.data.block.level_id;
          if (level === 1) return "#3b82f6";
          if (level === 2) return "#8b5cf6";
          if (level === 3) return "#ec4899";
          return "#6b7280";
        }
        return "#fbbf24";
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5);

    // Center number (font size adapt to radius)
    node
      .append("text")
      .attr("dy", nodeRadius / 4)
      .attr("text-anchor", "middle")
      .style("font-size", nodeRadius > 24 ? "14px" : "12px")
      .style("font-weight", "700")
      .attr("fill", "#111")
      .text((d: any) => d.data.n_questions);

    // block code under node + difficulty initial
    node
      .append("text")
      .attr("dy", nodeRadius + 12)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#374151")
      .text((d: any) => {
        if (!d.data.block) return "(root)";
        const code = d.data.block.code ?? "";
        const diffInitial = d.data.difficulty ? ` • ${d.data.difficulty.charAt(0)}` : "";
        return `${code}${diffInitial}`;
      });

    // difficulty badge
    node
      .filter((d: any) => !!d.data.difficulty)
      .append("g")
      .attr("transform", `translate(${-Math.round(nodeRadius * 0.65)},${-Math.round(nodeRadius * 0.6)})`)
      .call((g: any) => {
        g.append("rect")
          .attr("x", -Math.round(nodeRadius * 0.35))
          .attr("y", -Math.round(nodeRadius * 0.45))
          .attr("width", Math.round(nodeRadius * 0.7))
          .attr("height", Math.round(nodeRadius * 0.7))
          .attr("rx", 4)
          .attr("fill", "#fff")
          .attr("stroke", "#333")
          .attr("stroke-width", 0.5)
          .attr("opacity", 0.95);
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("x", 0)
          .attr("y", Math.round(nodeRadius * 0.12))
          .attr("font-size", Math.round(nodeRadius * 0.35) + "px")
          .attr("font-weight", "700")
          .text((d: any) => (d.data.difficulty ? d.data.difficulty.charAt(0) : ""));
      });


    return () => {
      tooltip.remove();
    };
  }, [data, onNodeClick, onNodeContext]);

  return (
    <div style={{ width: "100%", height: "80vh", overflow: "auto" }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 800 5000`} className="border rounded-md bg-white shadow" />
    </div>
  );
}

/** ---------- TreeCreator: lógica de UI / creación / edición / eliminación ---------- */
export default function TreeCreator() {
  const navigate = useNavigate();
  const { confinementId } = useParams<{ confinementId: string }>();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [treeData, setTreeData] = useState<NodeData | null>(null);

  // create modal
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [nodeType, setNodeType] = useState<"block" | "difficulty">("block");
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"FACIL" | "MEDIO" | "DIFICIL">("MEDIO");
  const [nQuestions, setNQuestions] = useState<number>(0);

  // edit (only n_questions)
  const [editNode, setEditNode] = useState<NodeData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editQuestions, setEditQuestions] = useState<number>(0);

  // context menu
  const [contextAnchor, setContextAnchor] = useState<{ mouseX: number; mouseY: number; node: NodeData } | null>(null);

  // ui
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // initial load
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [blks, reqs] = await Promise.all([
          GetBlocks(),
          confinementId ? ConfinementRequirementApi.getByConfinement(confinementId) : Promise.resolve([]),
        ]);
        setBlocks(blks);
        setTreeData(buildConfinementTree(reqs));
      } catch (err) {
        console.error(err);
        setErrorMessage("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [confinementId]);

  // availability
  const getAvailableBlocks = (): Block[] => {
    if (!selectedNode) return blocks.filter((b) => b.level_id === 1 && b.parent_block_id === null);
    if (!selectedNode.block) return blocks.filter((b) => b.level_id === 1 && b.parent_block_id === null);

    // if parent has difficulty -> child blocks are parent_block_id === parent.block.id and level = parent.level + 1
    if (selectedNode.difficulty) {
      return blocks.filter((b) => b.parent_block_id === selectedNode.block!.id && b.level_id === selectedNode.block!.level_id + 1);
    }
    // if parent has no difficulty -> allow same (you might change rules here)
    return blocks.filter((b) => b.parent_block_id === selectedNode.block!.id && b.level_id === selectedNode.block!.level_id + 1);
  };

  const difficultyExists = (diff: string) => {
    if (!selectedNode) return false;
    return selectedNode.children.some((c) => c.difficulty === diff);
  };

  const siblingHasSameBlockAndDifficulty = (blockId: number | null, difficulty: string | null) => {
    if (!selectedNode) return false;
    const block = blocks.find((b) => b.id === blockId);
    const code = block?.code ?? null;
    return selectedNode.children.some((c) => c.block?.code === code && c.difficulty === difficulty);
  };

  // handle click open create modal
  const handleNodeClick = (node: NodeData) => {
    const used = node.children.reduce((s, c) => s + c.n_questions, 0);
    const remaining = node.n_questions - used;

    if (remaining <= 0) {
      setErrorMessage("❌ No puedes agregar más hijos: las preguntas del padre ya están distribuidas.");
      return;
    }

    setSelectedNode(node);
    if (!node.block) setNodeType("block");
    else if (node.block && !node.difficulty) setNodeType("difficulty");
    else setNodeType("block");

    setSelectedBlockId(0);
    setSelectedDifficulty("MEDIO");
    setNQuestions(remaining);
    setModalOpen(true);
  };

  // context menu
  const handleNodeContext = (node: NodeData, mouseX: number, mouseY: number) => {
    setContextAnchor({ mouseX, mouseY, node });
  };
  const closeContext = () => setContextAnchor(null);

  // create child
  const handleSave = async () => {
    if (!selectedNode || !confinementId) return;

    const used = selectedNode.children.reduce((s, c) => s + c.n_questions, 0);
    const remaining = selectedNode.n_questions - used;
    if (remaining <= 0) {
      setErrorMessage("❌ No puedes agregar más hijos: las preguntas del padre ya están distribuidas.");
      return;
    }

    if (nQuestions <= 0) {
      setErrorMessage("Ingresa un número de preguntas mayor que 0");
      return;
    }

    if (nQuestions > remaining) {
      setErrorMessage(`No puedes solicitar más de ${remaining} preguntas (restantes).`);
      return;
    }

    if (nodeType === "block" && selectedBlockId === 0) {
      setErrorMessage("Selecciona un bloque");
      return;
    }

    const chosenDifficulty = nodeType === "difficulty" ? selectedDifficulty : (selectedNode.difficulty ?? null);

    if (nodeType === "block" && siblingHasSameBlockAndDifficulty(selectedBlockId, chosenDifficulty)) {
      setErrorMessage("⚠️ Ya existe un hijo con el mismo bloque y dificultad");
      return;
    }

    const payload: any = {
      confinement_id: confinementId,
      n_questions: nQuestions,
      parent_id: selectedNode.id > 0 ? selectedNode.id : undefined,
    };

    if (nodeType === "difficulty") {
      payload.block_id = selectedNode.block?.id ?? null;
      payload.difficulty = selectedDifficulty;
    } else {
      payload.block_id = selectedBlockId;
      if (selectedNode.difficulty) payload.difficulty = selectedNode.difficulty;
      else payload.difficulty = null;
    }

    try {
      setSaving(true);
      await CreateConfinementBlock(payload);
      const reqs = await ConfinementRequirementApi.getByConfinement(confinementId);
      setTreeData(buildConfinementTree(reqs));
      setModalOpen(false);
      setSuccessOpen(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error al crear: " + (err?.message || String(err)));
      // try to surface specific DB errors if present
    } finally {
      setSaving(false);
    }
  };

  // open edit
  const openEdit = (node: NodeData) => {
    setEditNode(node);
    setEditQuestions(node.n_questions);
    setEditOpen(true);
    closeContext();
  };

  // edit save (only n_questions)
  const handleEditSave = async () => {
    if (!editNode || !editNode.id || !confinementId) return;

    const usedByChildren = editNode.children.reduce((s, c) => s + c.n_questions, 0);
    if (editQuestions < usedByChildren) {
      setErrorMessage(`No puedes reducir a menos de ${usedByChildren} porque los hijos ya ocupan esas preguntas.`);
      return;
    }
    if (editQuestions <= 0) {
      setErrorMessage("El número de preguntas debe ser mayor a 0");
      return;
    }

    try {
      setSaving(true);
      await UpdateConfinementBlock(editNode.id, { n_questions: editQuestions });
      const reqs = await ConfinementRequirementApi.getByConfinement(confinementId);
      setTreeData(buildConfinementTree(reqs));
      setEditOpen(false);
      setSuccessOpen(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error al actualizar: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // delete
  const handleDelete = async (node: NodeData) => {
    if (!node.id) return;
    closeContext();
    const ok = window.confirm("¿Eliminar este nodo? Esta operación no se puede deshacer.");
    if (!ok) return;
    try {
      setSaving(true);
      await DeleteConfinementBlock(node.id);
      const reqs = await ConfinementRequirementApi.getByConfinement(confinementId!);
      setTreeData(buildConfinementTree(reqs));
      setSuccessOpen(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error al eliminar: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !treeData) {
    return (
      <Container sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4">🌳 Crear Requerimientos - Vista de Árbol</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Haz clic en un nodo para agregar hijos. Click derecho para editar / eliminar.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Chip label="Raíz → Bloques nivel 1" size="small" />
            <Chip label="Bloque (sin dif) → Puede crear Dificultad o Bloque" size="small" />
            <Chip label="Bloque (con dif) → Solo crear Bloques (heredan dif.)" size="small" />
            <Chip label="Regla: hijos total ≤ preguntas del padre" size="small" />
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Estructura</Typography>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </Box>

        <Tree data={treeData} onNodeClick={handleNodeClick} onNodeContext={handleNodeContext} />
      </Paper>

      {/* Modal crear */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedNode?.block ? `➕ Agregar Hijo a: ${selectedNode.block.name}` : "➕ Agregar Nodo a Raíz"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {selectedNode && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Nodo Padre</Typography>
                <Typography>
                  {selectedNode.block?.name ?? "Raíz"} {selectedNode.difficulty ? `- ${selectedNode.difficulty}` : ""}
                </Typography>
                <Typography variant="caption">
                  Preguntas padre: {selectedNode.n_questions} | Hijos ocupan: {selectedNode.children.reduce((s, c) => s + c.n_questions, 0)}
                </Typography>
              </Paper>
            )}

            <FormControl component="fieldset">
              <FormLabel component="legend">Tipo de nodo hijo</FormLabel>
              <RadioGroup value={nodeType} onChange={(e) => setNodeType(e.target.value as any)}>
                {(!selectedNode?.difficulty) && (
                  <>
                    <FormControlLabel value="block" control={<Radio />} label="Bloque" />
                    <FormControlLabel value="difficulty" control={<Radio />} label="Dificultad" />
                  </>
                )}
                {selectedNode?.difficulty && <FormControlLabel value="block" control={<Radio />} label="Bloque (hereda dificultad)" />}
              </RadioGroup>
            </FormControl>

            {nodeType === "block" && (
              <FormControl fullWidth>
                <InputLabel>Bloque</InputLabel>
                <Select value={selectedBlockId} label="Bloque" onChange={(e) => setSelectedBlockId(Number(e.target.value))}>
                  <MenuItem value={0}>Seleccionar bloque</MenuItem>
                  {getAvailableBlocks().map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name} ({b.code}) - Nivel {b.level_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {nodeType === "difficulty" && (
              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select value={selectedDifficulty} label="Dificultad" onChange={(e) => setSelectedDifficulty(e.target.value as any)}>
                  <MenuItem value="FACIL">Fácil</MenuItem>
                  <MenuItem value="MEDIO">Medio</MenuItem>
                  <MenuItem value="DIFICIL">Difícil</MenuItem>
                </Select>
                {selectedNode && <Typography variant="caption">Bloque heredado: {selectedNode.block?.name ?? "N/A"}</Typography>}
                {selectedNode && difficultyExists(selectedDifficulty) && <Typography variant="caption" color="error">Esta dificultad ya existe entre los hijos</Typography>}
              </FormControl>
            )}

            <TextField label="Número de preguntas" type="number" inputProps={{ min: 1 }} value={nQuestions} onChange={(e) => setNQuestions(Number(e.target.value) || 0)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {saving ? <CircularProgress size={18} /> : "Agregar hijo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal editar (solo preguntas) */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar preguntas del nodo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body2">{editNode?.block?.name ?? "Raíz"} {editNode?.difficulty ? `- ${editNode.difficulty}` : ""}</Typography>
            <TextField label="Número de preguntas" type="number" inputProps={{ min: 1 }} value={editQuestions} onChange={(e) => setEditQuestions(Number(e.target.value) || 0)} fullWidth />
            {editNode && <Typography variant="caption">Hijos ocupan: {editNode.children.reduce((s, c) => s + c.n_questions, 0)}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} /> : "Guardar"}</Button>
        </DialogActions>
      </Dialog>

      {/* Context menu */}
      <Menu
        open={Boolean(contextAnchor)}
        onClose={closeContext}
        anchorReference="anchorPosition"
        anchorPosition={contextAnchor ? { top: contextAnchor.mouseY, left: contextAnchor.mouseX } : undefined}
      >
        <MuiMenuItem onClick={() => contextAnchor && openEdit(contextAnchor.node)}>Editar preguntas</MuiMenuItem>
        <MuiMenuItem onClick={() => contextAnchor && handleDelete(contextAnchor.node)}>Eliminar</MuiMenuItem>
      </Menu>

      <Snackbar open={successOpen} autoHideDuration={2500} onClose={() => setSuccessOpen(false)}>
        <Alert severity="success">Operación correcta</Alert>
      </Snackbar>

      <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage(null)}>
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Container>
  );
}
