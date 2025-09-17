import { useEffect, useState } from "react";
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
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
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

  // snackbar success / error
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const blocksData = await GetBlocks();
        setBlocks(blocksData);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error al cargar bloques");
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
        if (data.block_id) setSelectedPath([data.block_id]);
      } catch (err) {
        console.error(err);
        setErrorMessage("No se pudo cargar el requerimiento");
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
      } else {
        await CreateConfinementBlock(payload);
      }

      // mostrar success y redirigir
      setSuccessOpen(true);
      setTimeout(() => {
        navigate(-1);
      }, 500);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;

      if (message.includes("23505") || message.includes("llave duplicada")) {
        setErrorMessage("⚠️ Ya existe un bloque con estos datos.");
      } else {
        setErrorMessage("❌ Ocurrió un error al guardar el bloque.");
      }
    }
  };

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
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 6,
          background: "linear-gradient(145deg, #f9f9f9, #ffffff)",
        }}
      >
        <CardHeader
          title={
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", textAlign: "center" }}>
              {id ? "Editar Requerimiento" : "Crear Requerimiento"}
            </Typography>
          }
        />
        <Divider />
        <CardContent>
          {/* selects de bloques en cascada */}
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              label="Nivel 1"
              value={selectedPath[0] ?? ""}
              onChange={(e) => {
                const value = e.target.value ? [Number(e.target.value)] : [];
                setSelectedPath(value);
              }}
              fullWidth
              sx={{ mb: 3 }}
            >
              <MenuItem value="">Selecciona un bloque</MenuItem>
              {getChildren().map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>


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

          {/* total */}
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
            sx={{ mb: 3 }}
            variant="outlined"
          />

          {/* botones */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              size="large"
              sx={{ minWidth: 120, borderRadius: 2 }}
              color="secondary"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              size="large"
              sx={{ minWidth: 120, borderRadius: 2, backgroundColor: "#1976d2" }}
            >
              {loading ? "Guardando..." : id ? "Actualizar" : "Crear"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* snackbar éxito */}
      <Snackbar
        open={successOpen}
        autoHideDuration={500}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {id ? "Actualizado exitosamente" : "Creado exitosamente"}
        </Alert>
      </Snackbar>

      {/* snackbar error */}
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={2000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
