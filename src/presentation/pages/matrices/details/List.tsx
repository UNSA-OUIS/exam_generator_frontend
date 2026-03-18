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
import { GetMatrixRequirements } from "../../../../application/matrix/GetMatrixRequirements";
import { DeleteMatrixRequirement } from "../../../../application/matrix/DeleteMatrixRequirement";
import type { MatrixRequirement } from "../../../../models/MatrixRequirement";
import MatrixRequirementForm from "./Form";

export default function MatrixRequirementsList() {
    const navigate = useNavigate();
    const { matrixId } = useParams<{ matrixId: string }>();
    const [rows, setRows] = useState<MatrixRequirement[]>([]);
    const [filteredRows, setFilteredRows] = useState<MatrixRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [matrixName, setMatrixName] = useState("");
    const [selectedArea, setSelectedArea] = useState<string>("all");
    const [editDialog, setEditDialog] = useState<{
        open: boolean;
        matrixRequirement: MatrixRequirement | null;
    }>({ open: false, matrixRequirement: null });

    const load = async (id: string, area?: string) => {
        setLoading(true);
        try {
            const data = await GetMatrixRequirements(id, area);
            
            // Ordenar por parent_id para mostrar padres primero, luego hijos
            const sortedData = data.sort((a, b) => {
                // Si ambos son raíz o ambos tienen padre, mantener orden original
                if ((a.parent_id === null && b.parent_id === null) || 
                    (a.parent_id !== null && b.parent_id !== null)) {
                    return (a.id || 0) - (b.id || 0);
                }
                // Los que no tienen padre (raíz) van primero
                if (a.parent_id === null) return -1;
                if (b.parent_id === null) return 1;
                return 0;
            });
            
            setRows(sortedData);
            setFilteredRows(sortedData);

            // Obtener el nombre de la matriz desde el primer requerimiento (si existe)
            if (data.length > 0 && data[0].matrix) {
                setMatrixName(data[0].matrix.year || "Matriz");
            }
        } catch (err) {
            console.error("Error loading matrix requirements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (matrixId) {
            load(matrixId);
        }
    }, [matrixId]);

    // Filtrar por área
    useEffect(() => {
        if (selectedArea === "all") {
            setFilteredRows(rows);
        } else {
            setFilteredRows(rows.filter(row => row.area === selectedArea));
        }
    }, [selectedArea, rows]);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!confirm("¿Está seguro de eliminar este requerimiento?")) return;
        try {
            await DeleteMatrixRequirement(id);
            setRows(rows.filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
            alert("Error al eliminar el requerimiento");
        }
    };

    const handleEditClick = (matrixRequirement: MatrixRequirement) => {
        setEditDialog({ open: true, matrixRequirement });
    };

    const handleEditClose = () => {
        setEditDialog({ open: false, matrixRequirement: null });
    };

    const handleEditSuccess = async () => {
        if (matrixId) {
            await load(matrixId);
        }
        handleEditClose();
    };

    const handleBack = () => {
        navigate("/matrices");
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
                    Matrices
                </Link>
                <Typography color="text.primary">Requerimientos {matrixName && `- ${matrixName}`}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">📋 Requerimientos {matrixName && `- ${matrixName}`}</Typography>
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
                    </Button>
*/}
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
                    {editDialog.matrixRequirement && (
                        <MatrixRequirementForm
                            initialId={editDialog.matrixRequirement.id?.toString()}
                            initialMatrixId={matrixId}
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