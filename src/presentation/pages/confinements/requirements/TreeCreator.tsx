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
  Snackbar,
  Alert,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Menu,
} from "@mui/material";
import { Cancel as CancelIcon } from "@mui/icons-material";
import * as d3 from "d3";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementRequirements";

import { GetBlocks } from "../../../../application/block/GetBlocks";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";
import type { Block } from "../../../../models/Block";
import type { ConfinementRequirement } from "../../../../models/ConfinementRequirement";

interface TreeNode {
  id: string;
  block: Block | null;
  difficulty: string;
  n_questions: number;
  children: TreeNode[];
  isNew?: boolean;
  parentId?: string;
  confinementRequirementId?: number;
}

interface NodeFormData {
  block_id: number;
  difficulty: string;
  n_questions: number;
}

export default function TreeCreator() {
  const navigate = useNavigate();
  const { confinementId } = useParams<{ confinementId: string }>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [existingRequirements, setExistingRequirements] = useState<
    ConfinementRequirement[]
  >([]);
  const [treeData, setTreeData] = useState<TreeNode>({
    id: "root",
    block: null,
    difficulty: "MEDIO",
    n_questions: 0,
    children: [],
  });
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    block_id: 0,
    difficulty: "MEDIO",
    n_questions: 0,
  });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<
    | {
      mouseX: number;
      mouseY: number;
      node: TreeNode | null;
    }
    | null
  >(null);

  // Load blocks and existing requirements
  useEffect(() => {
    const loadData = async () => {
      try {
        const [blocksData, requirementsData] = await Promise.all([
          GetBlocks(),
          confinementId
            ? ConfinementRequirementApi.getByConfinement(confinementId)
            : Promise.resolve([]),
        ]);

        setBlocks(blocksData);
        setExistingRequirements(requirementsData);

        if (requirementsData.length > 0) {
          const rootNode = buildTreeFromRequirements(
            requirementsData,
            blocksData
          );
          setTreeData(rootNode);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Error al cargar datos");
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confinementId]);

  const buildTreeFromRequirements = (
    requirements: ConfinementRequirement[],
    allBlocks: Block[]
  ): TreeNode => {
    const root: TreeNode = {
      id: "root",
      block: null,
      difficulty: "MEDIO",
      n_questions: 0,
      children: [],
    };

    const rootRequirements = requirements.filter((req) => !req.parent_id);

    const buildNode = (requirement: ConfinementRequirement): TreeNode => {
      const block = allBlocks.find((b) => b.id === requirement.block_id);
      const childrenRequirements = requirements.filter(
        (req) => req.parent_id === requirement.id
      );

      return {
        id: requirement.id?.toString() || `req-${Date.now()}`,
        block: block || null,
        difficulty: requirement.difficulty || "MEDIO",
        n_questions: requirement.n_questions || 0,
        children: childrenRequirements.map(buildNode),
        confinementRequirementId: requirement.id,
      };
    };

    root.children = rootRequirements.map(buildNode);
    return root;
  };

  // DRAW TREE with D3 - simplified enter/update/exit to avoid TS generics pain
  useEffect(() => {
    if (!svgRef.current || initialLoading) return;

    // basic svg and container
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    // hierarchy and layout
    const root = d3.hierarchy<TreeNode>(treeData, (d) => d.children);
    const treeLayout = d3.tree<TreeNode>().nodeSize([140, 160]);
    const treeRoot = treeLayout(root);

    const linkGenerator = d3
      .linkVertical()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    // LINKS
    const linkData = treeRoot.links();
    const linksSel: any = g.selectAll("path.link").data(linkData, (d: any) => d.target.data.id);

    // enter
    const linksEnter = linksSel
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      // start collapsed at parent point to animate
      .attr("d", (d: any) => {
        const s = { x: d.source.x, y: d.source.y };
        return linkGenerator({ source: s, target: s } as any);
      });

    // merge + transition to final
    linksEnter
      .merge(linksSel as any)
      .transition()
      .duration(350)
      .attr("d", (d: any) => linkGenerator(d as any) as any);

    // exit
    linksSel
      .exit()
      .transition()
      .duration(250)
      .attr("d", (d: any) => {
        const s = { x: d.source.x, y: d.source.y };
        return linkGenerator({ source: s, target: s } as any);
      })
      .remove();

    // NODES
    const nodesData = treeRoot.descendants();
    const nodesSel: any = g.selectAll("g.node").data(nodesData, (d: any) => d.data.id);

    const nodesEnter = nodesSel
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .style("opacity", 0);

    // circle
    nodesEnter
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d: any) => {
        if (d.data.isNew) return "#fef3c7";
        if (d.data.confinementRequirementId) return "#dbeafe";
        return "#e5e7eb";
      })
      .attr("stroke", (d: any) => {
        if (d.data.isNew) return "#d97706";
        if (d.data.confinementRequirementId) return "#3b82f6";
        return "#9ca3af";
      })
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // text lines (block name)
    nodesEnter.each(function (this: SVGGElement, d: any) {
      const nodeGroup = d3.select(this);
      if (d.data.id === "root") return;
      const blockName = d.data.block?.name || "Requerimientos";
      const words = blockName.split(" ");
      const maxCharsPerLine = 12;
      if (words.length > 1 && blockName.length > maxCharsPerLine) {
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(" ");
        const line2 = words.slice(mid).join(" ");
        nodeGroup
          .append("text")
          .attr("dy", -42)
          .attr("text-anchor", "middle")
          .style("font-size", "9px")
          .style("font-weight", "600")
          .attr("fill", "#1f2937")
          .text(line1);
        nodeGroup
          .append("text")
          .attr("dy", -32)
          .attr("text-anchor", "middle")
          .style("font-size", "9px")
          .style("font-weight", "600")
          .attr("fill", "#1f2937")
          .text(line2);
      } else {
        nodeGroup
          .append("text")
          .attr("dy", -35)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("font-weight", "600")
          .attr("fill", "#1f2937")
          .text(blockName);
      }
    });

    // n_questions text
    nodesEnter
      .append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .attr("fill", "#1f2937")
      .text((d: any) => d.data.n_questions || 0);

    // difficulty
    nodesEnter
      .append("text")
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .text((d: any) => {
        switch (d.data.difficulty) {
          case "FACIL":
            return "Fácil";
          case "MEDIO":
            return "Medio";
          case "DIFICIL":
            return "Difícil";
          default:
            return d.data.difficulty || "";
        }
      });

    // id text
    nodesEnter
      .append("text")
      .attr("dy", 40)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .style("fill", "#9ca3af")
      .text((d: any) =>
        d.data.confinementRequirementId ? `ID: ${d.data.confinementRequirementId}` : ""
      );

    // add-child button (simple circle + text)
    nodesEnter
      .filter((d: any) => d.data.id !== "root" && !d.data.isNew)
      .append("g")
      .attr("class", "add-child-btn")
      .attr("transform", `translate(45,-15)`)
      .style("cursor", "pointer")
      .on("click", function (event: any, d: any) {
        event.stopPropagation();
        handleAddChild(d.data);
      })
      .call((gSel: any) => {
        gSel.append("circle").attr("r", 10).attr("fill", "#10b981").attr("stroke", "#047857").attr("stroke-width", 1);
        gSel.append("text").attr("y", 4).attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").attr("fill", "white").text("+");
      });

    // merge + transition to final positions
    nodesEnter
      .merge(nodesSel as any)
      .transition()
      .duration(350)
      .style("opacity", 1)
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    // circle radius transition
    g.selectAll("g.node")
      .select("circle")
      .transition()
      .duration(350)
      .attr("r", (d: any) => (d.data.id === "root" ? 0 : 30));

    // add pointer events for click & contextmenu
    g.selectAll("g.node")
      .on("click", function (event: any, d: any) {
        event.stopPropagation();
        handleNodeClick(d.data);
      })
      .on("contextmenu", function (event: any, d: any) {
        event.preventDefault();
        event.stopPropagation();
        handleRightClick(event, d.data);
      });

    // exit nodes
    nodesSel
      .exit()
      .transition()
      .duration(250)
      .style("opacity", 0)
      .remove();

    // compute bounds and set viewBox so whole tree fits (no zoom/scroll)
    const bounds = treeRoot.descendants().reduce(
      (acc: any, d: any) => {
        return {
          minX: Math.min(acc.minX, d.x),
          maxX: Math.max(acc.maxX, d.x),
          minY: Math.min(acc.minY, d.y),
          maxY: Math.max(acc.maxY, d.y),
        };
      },
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    const treeWidth = (bounds.maxX - bounds.minX) || 800;
    const treeHeight = (bounds.maxY - bounds.minY) || 600;
    const padding = 60;

    svg.attr(
      "viewBox",
      `${bounds.minX - padding} ${bounds.minY - padding} ${treeWidth + padding * 2} ${treeHeight + padding * 2}`
    );
  }, [treeData, initialLoading]);

  const handleNodeClick = (node: TreeNode) => {
    if (node.id !== "root") {
      setSelectedNode(node);
      setNodeForm({
        block_id: node.block?.id || 0,
        difficulty: node.difficulty || "MEDIO",
        n_questions: node.n_questions,
      });
      setNodeDialogOpen(true);
    }
  };

  const handleRightClick = (event: any, node: TreeNode) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      node,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleAddChild = (parent: TreeNode) => {
    const newChild: TreeNode = {
      id: `new-${Date.now()}`,
      block: null,
      difficulty: "MEDIO",
      n_questions: 0,
      children: [],
      isNew: true,
      parentId: parent.id,
    };

    const addChildToNode = (node: TreeNode): TreeNode => {
      if (node.id === parent.id) {
        return {
          ...node,
          children: [...node.children, newChild],
        };
      }
      return {
        ...node,
        children: node.children.map(addChildToNode),
      };
    };

    setTreeData((prev) => addChildToNode(prev));
    closeContextMenu();
  };

  const handleDeleteNode = async (node: TreeNode) => {
    try {
      if (!node.confinementRequirementId) {
        setErrorMessage("Este nodo no está guardado todavía en el servidor");
        return;
      }

      if (!confinementId) {
        setErrorMessage("No hay confinamiento asociado");
        return;
      }

      // 1. Eliminar en el backend
      await DeleteConfinementBlock(node.confinementRequirementId);

      // 2. Eliminar del árbol (react local state)
      const deleteNodeRecursively = (current: TreeNode): TreeNode | null => {
        if (current === node) {
          return null;
        }
        return {
          ...current,
          children: current.children
            .map(deleteNodeRecursively)
            .filter(Boolean) as TreeNode[],
        };
      };

      setTreeData((prev) => deleteNodeRecursively(prev) || prev);

      // 3. Cerrar el menú contextual
      setContextMenu(null);

      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error al eliminar el nodo");
    }
  };


  const handleSaveNode = async () => {
    if (!selectedNode || !confinementId) return;

    setSaving(true);
    try {
      if (selectedNode.confinementRequirementId) {
        // TODO: call API to update existing node
        console.log("Actualizar nodo existente (backend):", selectedNode.confinementRequirementId);
      } else {
        const payload = {
          confinement_id: confinementId,
          block_id: nodeForm.block_id,
          difficulty: nodeForm.difficulty,
          n_questions: nodeForm.n_questions,
          parent_id: selectedNode.parentId
            ? parseInt(selectedNode.parentId.replace("new-", ""))
            : undefined,
        };

        // If CreateConfinementBlock returns something useful, you can integrate it here
        await CreateConfinementBlock(payload);
      }

      // update local tree
      const updateNodeInTree = (node: TreeNode): TreeNode => {
        if (node.id === selectedNode.id) {
          const block = blocks.find((b) => b.id === nodeForm.block_id);
          return {
            ...node,
            block: block || null,
            difficulty: nodeForm.difficulty,
            n_questions: nodeForm.n_questions,
            isNew: false,
          };
        }
        return {
          ...node,
          children: node.children.map(updateNodeInTree),
        };
      };

      setTreeData((prev) => updateNodeInTree(prev));
      setNodeDialogOpen(false);
      setSelectedNode(null);
      setSuccessOpen(true);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || String(error);
      if (
        String(message).includes("23505") ||
        String(message).includes("llave duplicada") ||
        String(message).includes("unique_confinement_block_difficulty")
      ) {
        setErrorMessage("⚠️ Ya existe un requerimiento con este bloque y dificultad.");
      } else {
        setErrorMessage(`❌ Error al guardar: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const getAvailableBlocks = (selectedNodeLocal: TreeNode | null): Block[] => {
    if (!selectedNodeLocal) {
      return blocks.filter((b) => !b.parent_block_id);
    }

    const findParentNode = (node: TreeNode, targetId: string): TreeNode | null => {
      if (node.id === targetId) return node;
      for (const child of node.children) {
        const found = findParentNode(child, targetId);
        if (found) return found;
      }
      return null;
    };

    const parentNode = findParentNode(treeData, selectedNodeLocal.parentId || "");

    if (parentNode && parentNode.block) {
      return blocks.filter((b) => b.parent_block_id === parentNode.block?.id);
    } else {
      return blocks.filter((b) => !b.parent_block_id);
    }
  };

  if (initialLoading) {
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
          <Typography variant="h4" gutterBottom>
            🌳 Crear Requerimientos - Vista de Árbol
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Haz clic derecho sobre un nodo para ver opciones:{" "}
            <Chip label="Editar" size="small" /> <Chip label="Eliminar" size="small" />{" "}
            <Chip label="Crear hijo" size="small" />. También puedes usar el botón{" "}
            <Chip label="+" size="small" color="success" /> en cada nodo.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Requerimientos existentes: {existingRequirements.length} | Bloques disponibles: {blocks.length}
          </Typography>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Estructura de Requerimientos</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate(-1)}>
              Volver
            </Button>
          </Box>
        </Box>

        <svg
          ref={svgRef}
          width="100%"
          height="600"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            background: "#f8fafc",
          }}
        />
      </Paper>

      {/* Context menu */}
      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem
          onClick={() => {
            if (contextMenu?.node) handleNodeClick(contextMenu.node);
            closeContextMenu();
          }}
        >
          Editar nodo
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (contextMenu?.node) handleAddChild(contextMenu.node);
            closeContextMenu();
          }}
        >
          Crear nodo hijo
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (contextMenu?.node) handleDeleteNode(contextMenu.node);
            // closeContextMenu is invoked in delete flow
          }}
          sx={{ color: "error.main" }}
        >
          Eliminar nodo
        </MenuItem>
      </Menu>

      {/* Node dialog */}
      <Dialog open={nodeDialogOpen} onClose={() => setNodeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedNode?.confinementRequirementId ? "✏️ Editar Nodo" : "⚙️ Configurar Nodo"}{" "}
          {selectedNode?.parentId && " (Hijo)"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Bloque</InputLabel>
              <Select
                value={nodeForm.block_id}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, block_id: Number(e.target.value) }))}
                label="Bloque"
                disabled={!!selectedNode?.confinementRequirementId}
              >
                <MenuItem value={0}>Seleccionar bloque</MenuItem>
                {getAvailableBlocks(selectedNode).map((block) => (
                  <MenuItem key={block.id} value={block.id}>
                    {block.name} {block.code && `(${block.code})`}
                  </MenuItem>
                ))}
              </Select>
              {selectedNode?.parentId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Mostrando solo bloques hijos del bloque padre seleccionado
                </Typography>
              )}
              {selectedNode?.confinementRequirementId && (
                <Typography variant="caption" color="info.main" sx={{ mt: 1 }}>
                  El bloque no puede ser modificado en requerimientos existentes
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Dificultad</InputLabel>
              <Select
                value={nodeForm.difficulty}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, difficulty: String(e.target.value) }))}
                label="Dificultad"
              >
                <MenuItem value="">Seleccionar dificultad</MenuItem>
                <MenuItem value="FACIL">Fácil</MenuItem>
                <MenuItem value="MEDIO">Medio</MenuItem>
                <MenuItem value="DIFICIL">Difícil</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Número de Preguntas"
              value={nodeForm.n_questions}
              onChange={(e) => setNodeForm((prev) => ({ ...prev, n_questions: parseInt(e.target.value) || 0 }))}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveNode} variant="contained" disabled={!nodeForm.block_id || saving}>
            {saving ? <CircularProgress size={20} /> : selectedNode?.confinementRequirementId ? "Actualizar" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={successOpen} autoHideDuration={3000} onClose={() => setSuccessOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="success" sx={{ width: "100%" }}>
          ✅ Acción realizada con éxito
        </Alert>
      </Snackbar>

      <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
