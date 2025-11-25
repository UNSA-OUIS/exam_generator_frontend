import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
    Typography,
    Button,
    Box,
    Container,
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
    Menu,
    MenuItem as MuiMenuItem,
    useTheme,
    useMediaQuery,
} from "@mui/material";

import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementRequirements";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementRequirements";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementRequirements";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import { ConfinementRequirementApi } from "../../../../infrastructure/api/ConfinementRequirementApi";
import buildConfinementTree from "./buildConfinementTree";
import type { Block } from "./types";
import type { NodeData } from "./d3-tree/types";
import D3Tree from "./d3-tree/D3Tree";

export default function TreeView() {
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

    console.log("TreeView render", { treeData, modalOpen, selectedNode });

    useEffect(() => {
        if (!confinementId) return;
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

    const handleNodeClick = useCallback((node: NodeData) => {
        console.log("handleNodeClick called");

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
    }, []);

    const handleNodeContext = (node: NodeData, event: MouseEvent) => {
        setContextAnchor({
            mouseX: event.pageX,
            mouseY: event.pageY,
            node,
        });
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

    return (
        <div>
            <Card>
                <CardContent sx={{ p: 1 }}>
                    <Typography variant={"h5"}>🌳 Requerimientos Internamiento</Typography>
                </CardContent>
            </Card>

            <Paper sx={{ p: isMobile ? 1 : 2, mb: 2 }}>
                {loading && (
                    <Container sx={{ display: "flex", justifyContent: "center" }}>
                        <CircularProgress />
                    </Container>
                )}

                {treeData && <D3Tree data={treeData} onNodeClick={handleNodeClick} onNodeContext={handleNodeContext} />}
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
                anchorPosition={contextAnchor ? { top: contextAnchor.mouseY, left: contextAnchor.mouseX } : undefined}
                disableAutoFocus
                disableEnforceFocus
                disableRestoreFocus
                disableScrollLock
                disablePortal
                transitionDuration={0}>
                <MuiMenuItem onClick={() => contextAnchor && openEdit(contextAnchor.node)}>Editar</MuiMenuItem>
                <MuiMenuItem onClick={() => contextAnchor && handleDelete(contextAnchor.node)}>Eliminar</MuiMenuItem>
            </Menu>

            <Snackbar open={successOpen} autoHideDuration={2500} onClose={() => setSuccessOpen(false)} anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}>
                <Alert severity="success">Operación correcta</Alert>
            </Snackbar>

            <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage(null)} anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}>
                <Alert severity="error">{errorMessage}</Alert>
            </Snackbar>
        </div>
    );
}
