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
} from "@mui/material";
import { Add as AddIcon, Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import * as d3 from "d3";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { Block } from "../../../../models/Block";
import type { ConfinementRequirement } from "../../../../models/ConfinementBlock";

interface TreeNode {
  id: string;
  block: Block | null;
  difficulty: string;
  n_questions: number;
  children: TreeNode[];
  isNew?: boolean;
  parentId?: string;
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
  const [treeData, setTreeData] = useState<TreeNode>({
    id: "root",
    block: null,
    difficulty: "medium",
    n_questions: 0,
    children: [],
  });
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    block_id: 0,
    difficulty: "medium",
    n_questions: 0,
  });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar bloques disponibles
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const blocksData = await GetBlocks();
        setBlocks(blocksData);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error al cargar bloques");
      }
    };
    loadBlocks();
  }, []);

  // Dibujar árbol con D3
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    const zoomGroup = svg.append("g");

    // Configurar zoom
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => zoomGroup.attr("transform", event.transform));

    svg.call(zoomBehavior);

    // Preparar jerarquía
    const root = d3.hierarchy<TreeNode>(treeData);
    const treeLayout = d3.tree<TreeNode>().nodeSize([80, 120]);
    const treeRoot = treeLayout(root);

    // Generador de enlaces
    const linkGenerator = d3
      .linkVertical<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
      .x((d) => d.x)
      .y((d) => d.y);

    // Dibujar enlaces
    zoomGroup
      .selectAll("path.link")
      .data(treeRoot.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("d", (d) => linkGenerator(d)!);

    // Dibujar nodos
    const node = zoomGroup
      .selectAll("g.node")
      .data(treeRoot.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .on("click", (_, d) => handleNodeClick(d.data));

    // Círculos de nodos
    node.append("circle")
      .attr("r", 25)
      .attr("fill", (d) => (d.data.isNew ? "#fef3c7" : "#dbeafe"))
      .attr("stroke", (d) => (d.data.isNew ? "#d97706" : "#3b82f6"))
      .attr("stroke-width", 2);

    // Texto del bloque
    node.append("text")
      .attr("dy", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .attr("fill", "#1f2937")
      .text((d) => d.data.block?.name || "Nuevo nodo");

    // Número de preguntas
    node.append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .attr("fill", "#1f2937")
      .text((d) => d.data.n_questions);

    // Dificultad
    node.filter((d) => d.data.difficulty)
      .append("text")
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .text((d) => d.data.difficulty);

    // Botón agregar hijo (solo para nodos existentes)
    node.filter((d) => !d.data.isNew)
      .append("circle")
      .attr("cx", 35)
      .attr("cy", -10)
      .attr("r", 8)
      .attr("fill", "#10b981")
      .attr("stroke", "#047857")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        handleAddChild(d.data);
      })
      .append("title")
      .text("Agregar hijo");

    // Icono + en botón agregar
    node.filter((d) => !d.data.isNew)
      .append("text")
      .attr("x", 35)
      .attr("y", -7)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .attr("fill", "white")
      .text("+");

    // Centrar vista
    const scale = 1.2;
    const translateX = width / 2 - treeRoot.x * scale;
    const translateY = height / 2 - treeRoot.y * scale;

    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));

  }, [treeData]);

  const handleNodeClick = (node: TreeNode) => {
    if (node.isNew) {
      setSelectedNode(node);
      setNodeForm({
        block_id: node.block?.id || 0,
        difficulty: node.difficulty,
        n_questions: node.n_questions,
      });
      setNodeDialogOpen(true);
    }
  };

  const handleAddChild = (parent: TreeNode) => {
    const newChild: TreeNode = {
      id: `new-${Date.now()}`,
      block: null,
      difficulty: "medium",
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

    setTreeData(addChildToNode(treeData));
  };

  const handleSaveNode = () => {
    if (!selectedNode) return;

    const updateNodeInTree = (node: TreeNode): TreeNode => {
      if (node.id === selectedNode.id) {
        const block = blocks.find(b => b.id === nodeForm.block_id);
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

    setTreeData(updateNodeInTree(treeData));
    setNodeDialogOpen(false);
    setSelectedNode(null);
  };

  const handleSaveAll = async () => {
    if (!confinementId) {
      setErrorMessage("ID de confinamiento no encontrado");
      return;
    }

    setLoading(true);
    try {
      // Función recursiva para guardar todos los nodos
      const saveNodeRecursive = async (node: TreeNode, parentId: number | null = null): Promise<void> => {
        if (node.id === "root") {
          // Guardar hijos del root
          for (const child of node.children) {
            await saveNodeRecursive(child, null);
          }
          return;
        }

        // Guardar nodo actual
        const payload = {
          confinement_id: confinementId,
          block_id: node.block?.id,
          difficulty: node.difficulty,
          n_questions: node.n_questions,
          parent_id: parentId,
        };

        await CreateConfinementBlock(payload);

        // Guardar hijos recursivamente
        for (const child of node.children) {
          await saveNodeRecursive(child, parseInt(node.id.replace('new-', '')) || undefined);
        }
      };

      await saveNodeRecursive(treeData);
      setSuccessOpen(true);
      setTimeout(() => navigate(-1), 1000);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      setErrorMessage(`Error al guardar: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const getChildren = (parentId?: number) =>
    blocks.filter((b) => (parentId ? b.parent_id === parentId : !b.parent_id));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🌳 Crear Requerimientos - Vista de Árbol
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Haz clic en el botón <Chip label="+" size="small" color="success" /> para agregar nodos hijos.
            Haz clic en los nodos <Chip label="Nuevo nodo" size="small" color="warning" /> para configurarlos.
          </Typography>
          
          <Box sx={{ display: "flex", gap: 2, flexWrap: 'wrap' }}>
            <Chip label="🟡 Nodo por configurar" variant="outlined" />
            <Chip label="🔵 Nodo configurado" variant="outlined" />
            <Chip label="➕ Agregar hijo" color="success" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">
            Estructura de Requerimientos
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Todo"}
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
            background: "#f8fafc"
          }}
        />
      </Paper>

      {/* Diálogo para configurar nodo */}
      <Dialog open={nodeDialogOpen} onClose={() => setNodeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Nodo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Bloque</InputLabel>
              <Select
                value={nodeForm.block_id}
                onChange={(e) => setNodeForm(prev => ({ ...prev, block_id: Number(e.target.value) }))}
                label="Bloque"
              >
                <MenuItem value={0}>Seleccionar bloque</MenuItem>
                {getChildren().map((block) => (
                  <MenuItem key={block.id} value={block.id}>
                    {block.name} {block.code && `(${block.code})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Dificultad</InputLabel>
              <Select
                value={nodeForm.difficulty}
                onChange={(e) => setNodeForm(prev => ({ ...prev, difficulty: e.target.value }))}
                label="Dificultad"
              >
                <MenuItem value="easy">Fácil</MenuItem>
                <MenuItem value="medium">Medio</MenuItem>
                <MenuItem value="hard">Difícil</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Número de Preguntas"
              value={nodeForm.n_questions}
              onChange={(e) => setNodeForm(prev => ({ ...prev, n_questions: parseInt(e.target.value) || 0 }))}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveNode} 
            variant="contained"
            disabled={!nodeForm.block_id}
          >
            Guardar Nodo
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Requerimientos guardados exitosamente
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}