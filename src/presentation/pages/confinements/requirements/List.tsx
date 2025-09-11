// D:\...\presentation\pages\confinements\requirements\List.tsx
import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { GetConfinementBlocks } from "../../../../application/confinement/GetConfinementBlocks";
import { DeleteConfinementBlock } from "../../../../application/confinement/DeleteConfinementBlock";
import type { ConfinementBlock } from "../../../../models/ConfinementBlock";

export default function RequirementsList() {
  const navigate = useNavigate();
  const { confinementId } = useParams<{ confinementId: string }>(); // 👈 capturamos el ID desde la URL
  const [rows, setRows] = useState<ConfinementBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (id: string) => {
    setLoading(true);
    try {
      console.log("📌 confinementId recibido:", id); // 👈 comprueba en consola
      const data = await GetConfinementBlocks(id); // 👈 pasamos el ID al servicio
      setRows(data);
    } catch (err) {
      console.error(err);
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
    if (!confirm("¿Eliminar este requerimiento?")) return;
    try {
      await DeleteConfinementBlock(id);
      setRows(rows.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">📋 Requerimientos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("new")}
        >
          Agregar Requerimiento
        </Button>
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
                <TableCell>Internamiento</TableCell>
                <TableCell>Bloque</TableCell>
                <TableCell>Preguntas</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    {row.confinement.name}
                  </TableCell>
                  <TableCell>{row.block.name}</TableCell>
                  <TableCell>{row.questions_to_do}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(String(row.id))}
                    >
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
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay requerimientos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}
