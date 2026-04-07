import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Container,
    Typography,
    Button,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    CircularProgress,
    Box,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    Tooltip,
} from "@mui/material";

import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    AccountTree as TreeIcon,
    FormatListBulleted as ListIcon,
} from "@mui/icons-material";

import { GetConfinementBlocks } from "../../../../application/confinement/GetConfinementRequirements";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementRequirements";
import type { ConfinementRequirement } from "../../../../models/ConfinementRequirement";
import Form from "./Form";

export default function RequirementsList() {
    const navigate = useNavigate();
    const { confinementId } = useParams<{ confinementId: string }>();

    const [rows, setRows] = useState<ConfinementRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [confinementName, setConfinementName] = useState("");

    const [editDialog, setEditDialog] = useState<{
        open: boolean;
        confinementRequirement: ConfinementRequirement | null;
    }>({
        open: false,
        confinementRequirement: null,
    });

    // ── ordenar como árbol ────────────────────────────────────────────────────
    const sortAsTree = (requirements: ConfinementRequirement[]): ConfinementRequirement[] => {
        const result: ConfinementRequirement[] = [];
        const processedIds = new Set<number>();

        const addNodeAndChildren = (parentId: number | null, level: number = 0) => {
            const children = requirements
                .filter(req => req.parent_id === parentId && req.id !== undefined && !processedIds.has(req.id))
                .sort((a, b) => (a.id || 0) - (b.id || 0));

            children.forEach(child => {
                if (child.id !== undefined) {
                    processedIds.add(child.id);
                    (child as any).treeLevel = level;
                    result.push(child);
                    addNodeAndChildren(child.id, level + 1);
                }
            });
        };

        addNodeAndChildren(null);
        return result;
    };

    // ── carga ─────────────────────────────────────────────────────────────────
    const load = async (id: string) => {
        setLoading(true);
        try {
            const data = await GetConfinementBlocks(id);
            const sortedData = sortAsTree(data);
            setRows(sortedData);
            if (data.length > 0 && data[0].confinement) {
                setConfinementName(data[0].confinement.name);
            }
        } catch (err) {
            console.error("Error loading confinement requirements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (confinementId) load(confinementId);
    }, [confinementId]);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!confirm("¿Está seguro de eliminar este requerimiento?")) return;
        try {
            await DeleteConfinementBlock(id);
            if (confinementId) load(confinementId);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar el requerimiento");
        }
    };

    const handleEditClick = (req: ConfinementRequirement) => {
        setEditDialog({ open: true, confinementRequirement: req });
    };

    const handleEditClose = () => {
        setEditDialog({ open: false, confinementRequirement: null });
    };

    const handleEditSuccess = async () => {
        if (confinementId) await load(confinementId);
        handleEditClose();
    };

    // ── utils ─────────────────────────────────────────────────────────────────
    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": case "easy": return "Fácil";
            case "NORMAL": case "medium": return "Normal";
            case "HARD": case "hard": return "Difícil";
            default: return difficulty || "—";
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": case "easy": return "success";
            case "NORMAL": case "medium": return "warning";
            case "HARD": case "hard": return "error";
            default: return "default";
        }
    };

    const totalQuestions = rows
        .filter(r => r.parent_id === null || r.parent_id === undefined)
        .reduce((sum, r) => sum + r.n_questions, 0);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link
                    color="inherit"
                    onClick={() => navigate("/confinements")}
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5 }}
                >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    Internamientos
                </Link>
                <Typography color="text.primary" variant="body2">
                    Requerimientos {confinementName ? `– ${confinementName}` : ""}
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Requerimientos
                    </Typography>
                    {confinementName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {confinementName}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ListIcon />}
                        onClick={() => navigate("new")}
                        sx={{ borderColor: "divider", color: "text.secondary" }}
                    >
                        Agregar
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<TreeIcon />}
                        onClick={() => navigate("tree-view")}
                        sx={{ borderColor: "divider", color: "text.secondary" }}
                    >
                        Vista árbol
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("cascada")}
                        disableElevation
                    >
                        Agregar en cascada
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("lista")}
                        disableElevation
                    >
                        Agregar en lista
                    </Button>
                </Box>
            </Box>

            {/* Stats */}
            {!loading && rows.length > 0 && (
                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Paper variant="outlined" sx={{ px: 2.5, py: 1.5, borderRadius: 2, minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary">Requerimientos</Typography>
                        <Typography variant="h6" fontWeight={700}>{rows.length}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2.5, py: 1.5, borderRadius: 2, minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary">Total preguntas</Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">{totalQuestions}</Typography>
                    </Paper>
                </Box>
            )}

            {/* Tabla */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                {loading ? (
                    <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : rows.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            No hay requerimientos registrados
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => navigate("cascada")}
                            disableElevation
                            sx={{ mt: 1 }}
                        >
                            Agregar en cascada
                        </Button>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 60 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary" }}>Bloque</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 100 }}>Dificultad</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 120, textAlign: "center" }}>N° Preguntas</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 180 }}>Padre</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", width: 90, textAlign: "right" }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.map(row => {
                                const level = (row as any).treeLevel || 0;
                                const isRoot = !row.parent_id;

                                return (
                                    <TableRow
                                        key={row.id}
                                        sx={{
                                            "&:hover": { bgcolor: "grey.50" },
                                            borderLeft: isRoot ? "3px solid" : "3px solid transparent",
                                            borderLeftColor: isRoot ? "primary.main" : "transparent",
                                        }}
                                    >
                                        {/* ID */}
                                        <TableCell>
                                            <Typography variant="caption" color="text.disabled">
                                                #{row.id}
                                            </Typography>
                                        </TableCell>

                                        {/* Bloque */}
                                        <TableCell sx={{ py: 1 }}>
                                            {row.block ? (
                                                <Box sx={{ display: "flex", alignItems: "center", pl: level * 2.5 }}>
                                                    {level > 0 && (
                                                        <Typography component="span" sx={{ color: "#ccc", mr: 0.75, fontSize: "0.85rem" }}>
                                                            └─
                                                        </Typography>
                                                    )}
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={level === 0 ? 600 : 400}
                                                        >
                                                            {row.block.name}
                                                        </Typography>
                                                        {row.block.code && (
                                                            <Typography variant="caption" color="text.disabled">
                                                                {row.block.code}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                    Total requerido
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* Dificultad */}
                                        <TableCell>
                                            {row.difficulty ? (
                                                <Chip
                                                    label={getDifficultyLabel(row.difficulty)}
                                                    color={getDifficultyColor(row.difficulty) as any}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* N° Preguntas */}
                                        <TableCell sx={{ textAlign: "center" }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={isRoot ? 700 : 400}
                                                color={isRoot ? "primary.main" : "text.primary"}
                                            >
                                                {row.n_questions}
                                            </Typography>
                                        </TableCell>

                                        {/* Padre */}
                                        <TableCell>
                                            {isRoot ? (
                                                <Chip label="Raíz" size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    {rows.find(r => r.id === row.parent_id)?.block?.name || `#${row.parent_id}`}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => handleEditClick(row)}>
                                                    <EditIcon sx={{ fontSize: "1rem" }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                                                    <DeleteIcon sx={{ fontSize: "1rem" }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* Dialog editar */}
            <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Editar Requerimiento</DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    {editDialog.confinementRequirement && (
                        <Form
                            initialId={editDialog.confinementRequirement.id?.toString()}
                            initialConfinementId={confinementId}
                            onSuccess={handleEditSuccess}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleEditClose} size="small" color="inherit">Cancelar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}