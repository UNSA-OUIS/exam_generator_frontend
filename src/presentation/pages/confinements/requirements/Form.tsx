import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  CircularProgress,
} from "@mui/material";
import { CreateConfinementBlock } from "../../../../application/confinement/CreateConfinementBlock";
import { UpdateConfinementBlock } from "../../../../application/confinement/UpdateConfinementBlock";
import { ConfinementBlockApi } from "../../../../infrastructure/api/ConfinementBlockApi";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { ConfinementBlock } from "../../../../models/ConfinementBlock";
import type { Block } from "../../../../models/Block";

export default function RequirementForm() {
  const navigate = useNavigate();
  const { id, confinementId } = useParams<{ id?: string; confinementId: string }>();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(id));

  const [form, setForm] = useState<Partial<ConfinementBlock>>({
    confinement_id: confinementId ? confinementId : undefined,
    block_id: undefined,
    questions_to_do: 0,
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const blocksData = await GetBlocks();
        setBlocks(blocksData);
      } catch (err) {
        console.error(err);
        alert("Error al cargar bloques");
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return setInitialLoading(false);
    (async () => {
      setInitialLoading(true);
      try {
        const data = await ConfinementBlockApi.get(Number(id));
        setForm({
          confinement_id: data.confinement_id,
          block_id: data.block_id,
          questions_to_do: data.questions_to_do,
        });
        // en edición, inicializamos el path con el block_id
        if (data.block_id) setSelectedPath([data.block_id]);
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el requerimiento");
        navigate(-1);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const block_id = selectedPath[selectedPath.length - 1];
      if (!block_id) throw new Error("Debe seleccionar un bloque");

      const payload = {
        ...form,
        confinement_id: confinementId ?? undefined,
        block_id,
      };

      if (id) {
        await UpdateConfinementBlock(Number(id), payload);
        alert("Actualizado");
      } else {
        await CreateConfinementBlock(payload);
        alert("Creado");
      }
      navigate(-1);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar: obtiene hijos de un bloque
  const getChildren = (parentId?: number) =>
    blocks.filter((b) => (parentId ? b.parent_block_id === parentId : !b.parent_block_id));

  if (initialLoading)
    return (
      <Container sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: "center", fontWeight: "bold" }}>
        {id ? "Editar Requerimiento" : "Crear Requerimiento"}
      </Typography>

      <Box sx={{ mb: 4 }}>
        {/* Primer nivel fijo */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Nivel 1</InputLabel>
          <Select
            value={selectedPath[0] ?? ""}
            onChange={(e) => {
              const value = e.target.value ? [Number(e.target.value)] : [];
              setSelectedPath(value);
            }}
          >
            <MenuItem value="">Selecciona un bloque</MenuItem>
            {getChildren().map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selects dinámicos en cascada - ahora se renderizan DESPUÉS del primer nivel */}
        {selectedPath.map((blockId, idx) => {
          const children = getChildren(blockId);
          if (!children.length) return null;
          return (
            <FormControl fullWidth sx={{ mb: 3 }} key={`level-${idx + 2}`}>
              <InputLabel>{`Nivel ${idx + 2}`}</InputLabel>
              <Select
                value={selectedPath[idx + 1] ?? ""}
                onChange={(e) => {
                  const newPath = selectedPath.slice(0, idx + 1);
                  if (e.target.value) newPath.push(Number(e.target.value));
                  setSelectedPath(newPath);
                }}
              >
                <MenuItem value="">Selecciona un bloque</MenuItem>
                {children.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        })}
      </Box>

      {/* Total */}
      <TextField
        fullWidth
        type="number"
        label="Total (valor numérico)"
        value={form.questions_to_do ?? 0}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            questions_to_do: parseInt(e.target.value || "0"),
          }))
        }
        sx={{ mb: 4 }}
        variant="outlined"
      />

      <Box sx={{ 
        display: "flex", 
        gap: 2, 
        justifyContent: "center",
        mt: 4 
      }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          size="large"
          sx={{ minWidth: 120 }}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading}
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading ? "Guardando..." : id ? "Actualizar" : "Crear"}
        </Button>
      </Box>
    </Container>
  );
}