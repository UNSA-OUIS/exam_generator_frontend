// presentation/pages/confinements/requirements/List.tsx
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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
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
    }>({ open: false, confinementRequirement: null });

    const load = async (id: string) => {
        setLoading(true);
        try {
            const data = await GetConfinementBlocks(id);
            setRows(data);

            // Obtener el nombre del confinamiento desde el primer requerimiento (si existe)
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
        if (confinementId) {
            load(confinementId);
        }
    }, [confinementId]);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!confirm("¿Está seguro de eliminar este requerimiento?")) return;
        try {
            await DeleteConfinementBlock(id);
            setRows(rows.filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
            alert("Error al eliminar el requerimiento");
        }
    };

    const handleEditClick = (confinementRequirement: ConfinementRequirement) => {
        setEditDialog({ open: true, confinementRequirement });
    };

    const handleEditClose = () => {
        setEditDialog({ open: false, confinementRequirement: null });
    };

    const handleEditSuccess = async () => {
        if (confinementId) {
            await load(confinementId);
        }
        handleEditClose();
    };

    const handleBack = () => {
        navigate("/confinements");
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'Fácil';
            case 'medium': return 'Medio';
            case 'hard': return 'Difícil';
            default: return difficulty;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'success';
            case 'medium': return 'warning';
            case 'hard': return 'error';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs para navegación */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link color="inherit" onClick={handleBack} sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <ArrowBackIcon sx={{ mr: 0.5, fontSize: 20 }} />
                    Internamientos
                </Link>
                <Typography color="text.primary">Requerimientos {confinementName && `- ${confinementName}`}</Typography>
            </Breadcrumbs>

           // En tu List.tsx, agrega este botón en el Box de acciones:
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">📋 Requerimientos {confinementName && `- ${confinementName}`}</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`new`)}>
                        Agregar Requerimiento
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`tree-creator`)}
                        sx={{ ml: 1 }}
                    >
                        Crear con Árbol
                    </Button>
                    <Button variant="contained" onClick={() => navigate(`tree`)}>
                        Ver Árbol
                    </Button>
                </Box>
            </Box>

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
                            {rows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>
                                        {row.block ? (
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {row.parent_id && "↳ "} {/* Indica que es hijo */}
                                                    {row.block.name}
                                                </Typography>
                                                {row.block.code && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Código: {row.block.code}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getDifficultyLabel(row.difficulty)}
                                            color={getDifficultyColor(row.difficulty) as any}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{row.n_questions}</TableCell>
                                    <TableCell>
                                        {row.parent_id ? (
                                            <Typography variant="body2">
                                                ID: {row.parent_id}
                                                {rows.find(r => r.id === row.parent_id)?.block?.name &&
                                                    ` (${rows.find(r => r.id === row.parent_id)?.block?.name})`
                                                }
                                            </Typography>
                                        ) : (
                                            <Chip label="Raíz" size="small" color="primary" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEditClick(row)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* Dialog para editar requerimiento */}
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