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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, FilterList as FilterIcon } from "@mui/icons-material";
import { GetExamRequirements } from "../../../../application/exam/GetExamRequirements";
import { DeleteExamRequirement } from "../../../../application/exam/DeleteExamRequirement";
import type { ExamRequirement } from "../../../../models/ExamRequirement";
import ExamRequirementForm from "./Form";

export default function ExamRequirementsList() {
    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const [rows, setRows] = useState<ExamRequirement[]>([]);
    const [filteredRows, setFilteredRows] = useState<ExamRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [examName, setExamName] = useState("");
    const [selectedArea, setSelectedArea] = useState<string>("all");
    const [editDialog, setEditDialog] = useState<{
        open: boolean;
        examRequirement: ExamRequirement | null;
    }>({ open: false, examRequirement: null });

    const load = async (id: string, area?: string) => {
        setLoading(true);
        try {
            const data = await GetExamRequirements(id, area);
            
            // Ordenar por parent_id para mostrar padres primero, luego hijos
            const sortedData = data.sort((a, b) => {
                if ((a.parent_id === null && b.parent_id === null) || 
                    (a.parent_id !== null && b.parent_id !== null)) {
                    return (a.id || 0) - (b.id || 0);
                }
                if (a.parent_id === null) return -1;
                if (b.parent_id === null) return 1;
                return 0;
            });
            
            setRows(sortedData);
            setFilteredRows(sortedData);

            // Obtener el nombre del examen desde el primer requerimiento (si existe)
            if (data.length > 0 && data[0].exam) {
                setExamName(data[0].exam.description || "Examen");
            }
        } catch (err) {
            console.error("Error loading exam requirements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (examId) {
            load(examId);
        }
    }, [examId]);

    // Filtrar por área manteniendo el orden
    useEffect(() => {
        if (selectedArea === "all") {
            setFilteredRows(rows);
        } else {
            const filtered = rows.filter(row => row.area === selectedArea);
            const sorted = filtered.sort((a, b) => {
                if ((a.parent_id === null && b.parent_id === null) || 
                    (a.parent_id !== null && b.parent_id !== null)) {
                    return (a.id || 0) - (b.id || 0);
                }
                if (a.parent_id === null) return -1;
                if (b.parent_id === null) return 1;
                return 0;
            });
            setFilteredRows(sorted);
        }
    }, [selectedArea, rows]);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!confirm("¿Está seguro de eliminar este requerimiento?")) return;
        try {
            await DeleteExamRequirement(id);
            setRows(rows.filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
            alert("Error al eliminar el requerimiento");
        }
    };

    const handleEditClick = (examRequirement: ExamRequirement) => {
        setEditDialog({ open: true, examRequirement });
    };

    const handleEditClose = () => {
        setEditDialog({ open: false, examRequirement: null });
    };

    const handleEditSuccess = async () => {
        if (examId) {
            await load(examId);
        }
        handleEditClose();
    };

    const handleBack = () => {
        navigate("/exams");
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return 'Fácil';
            case 'NORMAL': return 'NORMAL';
            case 'HARD': return 'Difícil';
            default: return difficulty;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return 'success';
            case 'NORMAL': return 'warning';
            case 'HARD': return 'error';
            default: return 'default';
        }
    };

    const getAreaColor = (area: string) => {
        switch (area) {
            case 'BIOMEDICAS': return 'secondary';
            case 'SOCIALES': return 'info';
            case 'INGENIERIAS': return 'primary';
            case 'UNICA': return 'default';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs para navegación */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link color="inherit" onClick={handleBack} sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <ArrowBackIcon sx={{ mr: 0.5, fontSize: 20 }} />
                    Exámenes
                </Link>
                <Typography color="text.primary">Requerimientos {examName && `- ${examName}`}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">📋 Requerimientos {examName && `- ${examName}`}</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`new`)}>
                        Agregar Requerimiento
                    </Button>
                    {/*
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
                    </Button>*/}
                </Box>
            </Box>

            {/* Filtro por área */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FilterIcon />
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filtrar por Área</InputLabel>
                    <Select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        label="Filtrar por Área"
                    >
                        <MenuItem value="all">Todas las áreas</MenuItem>
                        <MenuItem value="UNICA">Única</MenuItem>
                        <MenuItem value="BIOMEDICAS">Biomédicas</MenuItem>
                        <MenuItem value="SOCIALES">Sociales</MenuItem>
                        <MenuItem value="INGENIERIAS">Ingenierías</MenuItem>
                    </Select>
                </FormControl>
                <Chip 
                    label={`${filteredRows.length} requerimiento${filteredRows.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                />
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
                                <TableCell>Área</TableCell>
                                <TableCell>Bloque</TableCell>
                                <TableCell>Dificultad</TableCell>
                                <TableCell>N° Preguntas</TableCell>
                                <TableCell>Padre</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.area}
                                            color={getAreaColor(row.area) as any}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.block ? (
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {row.parent_id && "↳ "}
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
                    {editDialog.examRequirement && (
                        <ExamRequirementForm
                            
                            initialExamId={examId}
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