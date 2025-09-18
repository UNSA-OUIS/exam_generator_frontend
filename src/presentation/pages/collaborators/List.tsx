// presentation/pages/collaborators/List.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import type { Collaborator } from "../../../models/Collaborator";
import { GetCollaborators } from "../../../application/collaborator/GetCollaborators";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Visibility as ViewIcon,
} from "@mui/icons-material";

export type ListRef = {
  reload: () => void;
};

const List = forwardRef<ListRef>((_, ref) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetCollaborators();
      setCollaborators(data);
    } catch (err) {
      setError("Error al cargar los colaboradores");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
  };

  const handleCloseDetails = () => {
    setSelectedCollaborator(null);
  };

  useImperativeHandle(ref, () => ({
    reload: fetchCollaborators,
  }));

  useEffect(() => {
    fetchCollaborators();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando colaboradores...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchCollaborators}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Lista de Colaboradores
          </Typography>
          <Chip
            label={`${collaborators.length} colaborador${collaborators.length !== 1 ? "es" : ""}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {collaborators.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No hay colaboradores registrados
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 100 }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}>
                  DNI
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Nombre
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: 150 }}>
                  Creado
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.875rem", width: 100 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collaborators.map((collaborator, index) => (
                <TableRow
                  key={collaborator.id}
                  sx={{
                    "&:hover": { backgroundColor: "action.hover" },
                    backgroundColor: index % 2 === 0 ? "transparent" : "grey.25",
                  }}
                >
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    #{collaborator.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {collaborator.dni}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {collaborator.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {collaborator.email || "No especificado"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {new Date(collaborator.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(collaborator)}
                        sx={{
                          color: "info.main",
                          "&:hover": { backgroundColor: "info.lighter" },
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para ver detalles */}
      {selectedCollaborator && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1300,
          }}
          onClick={handleCloseDetails}
        >
          <Box
            sx={{
              backgroundColor: "white",
              p: 3,
              borderRadius: 2,
              minWidth: 300,
              maxWidth: 500,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" gutterBottom>
              Detalles del Colaborador
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ID:
              </Typography>
              <Typography variant="body1">#{selectedCollaborator.id}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                DNI:
              </Typography>
              <Typography variant="body1">{selectedCollaborator.dni}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nombre:
              </Typography>
              <Typography variant="body1">{selectedCollaborator.name}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Email:
              </Typography>
              <Typography variant="body1">
                {selectedCollaborator.email || "No especificado"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha de creación:
              </Typography>
              <Typography variant="body1">
                {new Date(selectedCollaborator.created_at).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Última actualización:
              </Typography>
              <Typography variant="body1">
                {new Date(selectedCollaborator.updated_at).toLocaleString()}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleCloseDetails}
              fullWidth
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default List;