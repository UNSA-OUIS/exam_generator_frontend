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
    useTheme,
    useMediaQuery,
} from "@mui/material";
import * as d3 from "d3";

import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementRequirements";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";

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
    difficulty: "EASY" | "NORMAL" | "HARD" | string;
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
    difficulty: "EASY" | "NORMAL" | "HARD" | null;
    children: NodeData[];
    parent_id?: number | null;
    total_questions_required?: number;
}

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

    const calcTotal = (n: NodeData): number => (n.children.length === 0 ? n.n_questions : n.children.reduce((s, c) => s + calcTotal(c), 0));

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

function Tree({ data, onNodeClick, onNodeContext }: { data: NodeData; onNodeClick: (node: NodeData) => void; onNodeContext: (node: NodeData, clientX: number, clientY: number) => void }) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

    // Actualizar dimensiones cuando cambia el tamaño de la ventana
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: Math.max(clientWidth, 400), // Mínimo 400px de ancho
                    height: Math.max(clientHeight, 300), // Mínimo 300px de alto
                });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);

        return () => {
            window.removeEventListener("resize", updateDimensions);
        };
    }, []);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g");

        // Configuración de zoom responsiva
        const zoomBehavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => g.attr("transform", event.transform));

        svg.call(zoomBehavior);

        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.85)")
            .style("color", "#fff")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("pointer-events", "none")
            .style("font-size", isMobile ? "11px" : "12px")
            .style("opacity", 0)
            .style("z-index", "9999")
            .style("max-width", "250px")
            .style("word-wrap", "break-word");

        const root = d3.hierarchy<NodeData>(data);

        // Configuración responsiva de tamaños de nodo
        let nodeRadius, nodeSizeX, nodeSizeY, fontSize, difficultySize;

        if (isMobile) {
            nodeRadius = 14;
            nodeSizeX = 60;
            nodeSizeY = 80;
            fontSize = "10px";
            difficultySize = 8;
        } else if (isTablet) {
            nodeRadius = 20;
            nodeSizeX = 80;
            nodeSizeY = 100;
            fontSize = "11px";
            difficultySize = 10;
        } else {
            nodeRadius = 28;
            nodeSizeX = 100;
            nodeSizeY = 130;
            fontSize = "12px";
            difficultySize = 12;
        }

        // Ajustar según la profundidad del árbol
        const tempLayout = d3.tree<NodeData>().nodeSize([nodeSizeX, nodeSizeY]);
        const tempRoot = tempLayout(root);
        const depth = tempRoot.height;

        if (depth > 6) {
            // Reducir más para árboles muy profundos
            const scale = isMobile ? 0.7 : isTablet ? 0.8 : 0.9;
            nodeRadius *= scale;
            nodeSizeX *= scale;
            nodeSizeY *= scale;
        }

        const layout = d3.tree<NodeData>().nodeSize([nodeSizeX, nodeSizeY]);
        const treeRoot = layout(root);

        // Calcular bounds para el viewBox dinámico
        let x0 = Infinity,
            x1 = -Infinity,
            y0 = Infinity,
            y1 = -Infinity;

        treeRoot.each((d) => {
            if (d.x < x0) x0 = d.x;
            if (d.x > x1) x1 = d.x;
            if (d.y < y0) y0 = d.y;
            if (d.y > y1) y1 = d.y;
        });

        // Agregar márgenes
        const margin = isMobile ? 40 : 60;
        const width = x1 - x0 + margin * 2;
        const height = y1 - y0 + margin * 2;

        // Centrar el árbol
        g.attr("transform", `translate(${margin - x0},${margin - y0})`);

        const linkGen = d3
            .linkVertical<any, any>()
            .x((d: any) => d.x)
            .y((d: any) => d.y);

        // Dibujar enlaces
        g.selectAll("path.link")
            .data(treeRoot.links())
            .join("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#bbb")
            .attr("stroke-width", isMobile ? 1 : 1.2)
            .attr("d", (d: any) => linkGen(d));

        // Dibujar nodos
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
                tooltip
                    .style("opacity", 1)
                    .html(html)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", (event: any) => tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`))
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Círculo del nodo
        node.append("circle")
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
            .attr("stroke-width", isMobile ? 1 : 1.5);

        // Texto del número de preguntas
        node.append("text")
            .attr("dy", nodeRadius / 4)
            .attr("text-anchor", "middle")
            .style("font-size", fontSize)
            .style("font-weight", "700")
            .attr("fill", "#111")
            .text((d: any) => d.data.n_questions);

        // Texto del código
        node.append("text")
            .attr("dy", nodeRadius + (isMobile ? 8 : 12))
            .attr("text-anchor", "middle")
            .style("font-size", isMobile ? "9px" : "11px")
            .style("fill", "#374151")
            .text((d: any) => {
                if (!d.data.block) return "(root)";
                const code = d.data.block.code ?? "";
                // Acortar código si es muy largo en móvil
                return isMobile && code.length > 8 ? code.substring(0, 6) + "..." : code;
            });

        // Indicador de dificultad
        node.filter((d: any) => !!d.data.difficulty)
            .append("g")
            .attr("transform", `translate(${-Math.round(nodeRadius * 0.65)},${-Math.round(nodeRadius * 0.6)})`)
            .call((g: any) => {
                g.append("rect")
                    .attr("x", -Math.round(nodeRadius * 0.35))
                    .attr("y", -Math.round(nodeRadius * 0.45))
                    .attr("width", Math.round(nodeRadius * 0.7))
                    .attr("height", Math.round(nodeRadius * 0.7))
                    .attr("rx", 3)
                    .attr("fill", "#fff")
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.5)
                    .attr("opacity", 0.95);
                g.append("text")
                    .attr("text-anchor", "middle")
                    .attr("x", 0)
                    .attr("y", Math.round(nodeRadius * 0.12))
                    .style("font-size", `${difficultySize}px`)
                    .style("font-weight", "700")
                    .text((d: any) => (d.data.difficulty ? d.data.difficulty.charAt(0) : ""));
            });

        // Ajustar viewBox y aplicar zoom inicial
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        // Zoom inicial responsivo
        const initialScale = isMobile ? 0.8 : isTablet ? 1.2 : 1.5;
        const initialX = width / 2;
        const initialY = height / 3;

        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

        return () => {
            tooltip.remove();
        };
    }, [data, onNodeClick, onNodeContext, dimensions, isMobile, isTablet]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "70vh",
                minHeight: "400px",
                overflow: "auto",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
            }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{
                    minWidth: "400px",
                    minHeight: "300px",
                }}
            />
        </div>
    );
}

export default function TreeCreator() {
    const navigate = useNavigate();
    const { confinementId } = useParams<{ confinementId: string }>();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [treeData, setTreeData] = useState<NodeData | null>(null);

    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [nodeType, setNodeType] = useState<"block" | "difficulty">("block");
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedDifficulty, setSelectedDifficulty] = useState<"EASY" | "NORMAL" | "HARD">("NORMAL");
    const [nQuestions, setNQuestions] = useState<number>(0);

    const [editNode, setEditNode] = useState<NodeData | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editQuestions, setEditQuestions] = useState<number>(0);

    const [contextAnchor, setContextAnchor] = useState<{ mouseX: number; mouseY: number; node: NodeData } | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [blks, reqs] = await Promise.all([GetBlocks(), confinementId ? ConfinementRequirementApi.getByConfinement(confinementId) : Promise.resolve([])]);
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

    const getAvailableBlocks = (): Block[] => {
        if (!selectedNode) return blocks.filter((b) => b.level_id === 1 && b.parent_block_id === null);
        if (!selectedNode.block) return blocks.filter((b) => b.level_id === 1 && b.parent_block_id === null);

        if (selectedNode.difficulty) {
            return blocks.filter((b) => b.parent_block_id === selectedNode.block!.id && b.level_id === selectedNode.block!.level_id + 1);
        }
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
        setSelectedDifficulty("NORMAL");
        setNQuestions(remaining);
        setModalOpen(true);
    };

    const handleNodeContext = (node: NodeData, mouseX: number, mouseY: number) => {
        setContextAnchor({ mouseX, mouseY, node });
    };
    const closeContext = () => setContextAnchor(null);

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

        const chosenDifficulty = nodeType === "difficulty" ? selectedDifficulty : selectedNode.difficulty ?? null;

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
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (node: NodeData) => {
        setEditNode(node);
        setEditQuestions(node.n_questions);
        setEditOpen(true);
        closeContext();
    };

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
        <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 1 : 2 }}>
            <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                    <Typography variant={isMobile ? "h5" : "h4"}>🌳 Crear Requerimientos - Vista de Árbol</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Haz clic en un nodo para agregar hijos. Click derecho para editar / eliminar.
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            mt: 1,
                            flexWrap: "wrap",
                        }}>
                        <Chip label="Raíz → Bloques nivel 1" size={isMobile ? "small" : "medium"} />
                        <Chip label="Bloque → Dificultad o Bloque" size={isMobile ? "small" : "medium"} />
                        <Chip label="Hijos ≤ preguntas padre" size={isMobile ? "small" : "medium"} />
                    </Box>
                </CardContent>
            </Card>

            <Paper sx={{ p: isMobile ? 1 : 2, mb: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 1 : 0,
                    }}>
                    <Typography variant={isMobile ? "h6" : "h5"}>Estructura del Árbol</Typography>
                    <Button variant="outlined" onClick={() => navigate(-1)} size={isMobile ? "small" : "medium"}>
                        Volver
                    </Button>
                </Box>

                <Tree data={treeData} onNodeClick={handleNodeClick} onNodeContext={handleNodeContext} />
            </Paper>

            {/* Modal crear */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
                                {!selectedNode?.difficulty && (
                                    <>
                                        <FormControlLabel value="block" control={<Radio />} label="Bloque" />
                                        <FormControlLabel value="difficulty" control={<Radio />} label="Dificultad" />
                                    </>
                                )}
                                {selectedNode?.difficulty && <FormControlLabel value="block" control={<Radio />} label="Bloque (hereda dificultad)" />}
                            </RadioGroup>
                        </FormControl>

                        {nodeType === "block" && (
                            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
                            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                                <InputLabel>Dificultad</InputLabel>
                                <Select value={selectedDifficulty} label="Dificultad" onChange={(e) => setSelectedDifficulty(e.target.value as any)}>
                                    <MenuItem value="EASY">Fácil</MenuItem>
                                    <MenuItem value="NORMAL">Medio</MenuItem>
                                    <MenuItem value="HARD">Difícil</MenuItem>
                                </Select>
                                {selectedNode && <Typography variant="caption">Bloque heredado: {selectedNode.block?.name ?? "N/A"}</Typography>}
                                {selectedNode && difficultyExists(selectedDifficulty) && (
                                    <Typography variant="caption" color="error">
                                        Esta dificultad ya existe entre los hijos
                                    </Typography>
                                )}
                            </FormControl>
                        )}

                        <TextField
                            label="Número de preguntas"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={nQuestions}
                            onChange={(e) => setNQuestions(Number(e.target.value) || 0)}
                            fullWidth
                            size={isMobile ? "small" : "medium"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">
                        {saving ? <CircularProgress size={18} /> : "Agregar hijo"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
                <DialogTitle>Editar preguntas del nodo</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <Typography variant="body2">
                            {editNode?.block?.name ?? "Raíz"} {editNode?.difficulty ? `- ${editNode.difficulty}` : ""}
                        </Typography>
                        <TextField
                            label="Número de preguntas"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={editQuestions}
                            onChange={(e) => setEditQuestions(Number(e.target.value) || 0)}
                            fullWidth
                            size={isMobile ? "small" : "medium"}
                        />
                        {editNode && <Typography variant="caption">Hijos ocupan: {editNode.children.reduce((s, c) => s + c.n_questions, 0)}</Typography>}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
                    <Button onClick={handleEditSave} variant="contained" disabled={saving}>
                        {saving ? <CircularProgress size={18} /> : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu
                open={Boolean(contextAnchor)}
                onClose={closeContext}
                anchorReference="anchorPosition"
                anchorPosition={contextAnchor ? { top: contextAnchor.mouseY, left: contextAnchor.mouseX } : undefined}>
                <MuiMenuItem onClick={() => contextAnchor && openEdit(contextAnchor.node)}>Editar preguntas</MuiMenuItem>
                <MuiMenuItem onClick={() => contextAnchor && handleDelete(contextAnchor.node)}>Eliminar</MuiMenuItem>
            </Menu>

            <Snackbar open={successOpen} autoHideDuration={2500} onClose={() => setSuccessOpen(false)} anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}>
                <Alert severity="success">Operación correcta</Alert>
            </Snackbar>

            <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage(null)} anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}>
                <Alert severity="error">{errorMessage}</Alert>
            </Snackbar>
        </Container>
    );
}
