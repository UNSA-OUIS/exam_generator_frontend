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
} from "@mui/material";

import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
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

    // ======== ORDENAR COMO ÁRBOL ===========
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

    // ======== LOAD DATA ===========
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

    // ======== DELETE ===========
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

    // ======== EDIT ===========
    const handleEditClick = (confinementRequirement: ConfinementRequirement) => {
        setEditDialog({ open: true, confinementRequirement });
    };

    const handleEditClose = () => {
        setEditDialog({ open: false, confinementRequirement: null });
    };

    const handleEditSuccess = async () => {
        if (confinementId) await load(confinementId);
        handleEditClose();
    };

    // ======== UTILS ===========
    const handleBack = () => navigate("/confinements");

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "Fácil";
            case "medium": return "Normal";
            case "hard": return "Difícil";
            default: return difficulty;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "success";
            case "medium": return "warning";
            case "hard": return "error";
            default: return "default";
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    color="inherit"
                    onClick={handleBack}
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                    <ArrowBackIcon sx={{ mr: 0.5, fontSize: 20 }} />
                    Internamientos
                </Link>

                <Typography color="text.primary">
                    Requerimientos {confinementName ? `– ${confinementName}` : ""}
                </Typography>
            </Breadcrumbs>

            {/* TITULO + BOTONES */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">
                    📋 Requerimientos {confinementName ? `– ${confinementName}` : ""}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("new")}
                    >
                        Agregar
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("tree-view")}
                    >
                        Editar con Árbol
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("cascada")}
                    >
                        Agregar Cascada
                    </Button>
                </Box>
            </Box>

            {/* TABLA */}
            <Paper>
                {loading ? (
                    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Bloque</TableCell>
                                <TableCell>Dificultad</TableCell>
                                <TableCell>N° Preguntas</TableCell>
                                <TableCell>Padre</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>

                                    {/* BLOQUE */}
                                    <TableCell>
                                        {row.block ? (
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    sx={{
                                                        pl: ((row as any).treeLevel || 0) * 3,
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    {(row as any).treeLevel > 0 &&
                                                        <span style={{ marginRight: "8px", color: "#999" }}>
                                                            {"└─ ".repeat((row as any).treeLevel)}
                                                        </span>
                                                    }

                                                    {row.block.name}
                                                </Typography>

                                                {row.block.code && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ pl: ((row as any).treeLevel || 0) * 3 }}
                                                    >
                                                        Código: {row.block.code}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" fontWeight="bold">
                                                Total Requerido
                                            </Typography>
                                        )}
                                    </TableCell>

                                    {/* DIFICULTAD */}
                                    <TableCell>
                                        <Chip
                                            label={getDifficultyLabel(row.difficulty)}
                                            color={getDifficultyColor(row.difficulty) as any}
                                            size="small"
                                        />
                                    </TableCell>

                                    {/* N° PREGUNTAS */}
                                    <TableCell>{row.n_questions}</TableCell>

                                    {/* PADRE */}
                                    <TableCell>
                                        {row.parent_id ? (
                                            <Typography variant="body2">
                                                ID: {row.parent_id}{" "}
                                                {rows.find(r => r.id === row.parent_id)?.block?.name &&
                                                    `(${rows.find(r => r.id === row.parent_id)?.block?.name})`}
                                            </Typography>
                                        ) : (
                                            <Chip label="Raíz" size="small" color="primary" variant="outlined" />
                                        )}
                                    </TableCell>

                                    {/* ACCIONES */}
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEditClick(row)}>
                                            <EditIcon />
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(row.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* DIALOG EDITAR */}
            <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Editar Requerimiento</DialogTitle>

                <DialogContent>
                    {editDialog.confinementRequirement && (
                        <Form
                            initialId={editDialog.confinementRequirement.id?.toString()}
                            initialConfinementId={confinementId}
                            onSuccess={handleEditSuccess}
                        />
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleEditClose}>Cancelar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}                                           
