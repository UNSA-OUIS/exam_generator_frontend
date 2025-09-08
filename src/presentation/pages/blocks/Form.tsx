import { useState, useEffect } from "react";
import { CreateBlock } from "../../../application/block/CreateBlock";
import { UpdateBlock } from "../../../application/block/UpdateBlock";
import { GetLevels } from "../../../application/level/GetLevels";
import { GetBlocks } from "../../../application/block/GetBlocks";
import type { Level } from "../../../models/Level";
import type { Block } from "../../../models/Block";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

type Props = {
  blockId?: number;
  initialLevelId?: number;
  initialName?: string;
  initialParentBlockId?: number | null;
  onSuccess: () => void;
};

export default function Form({
  blockId,
  initialLevelId = 0,
  initialName = "",
  initialParentBlockId = null,
  onSuccess,
}: Props) {
  const [levelId, setLevelId] = useState<number>(initialLevelId);
  const [name, setName] = useState(initialName);
  const [parentBlockId, setParentBlockId] = useState<number | null>(
    initialParentBlockId
  );
  const [levels, setLevels] = useState<Level[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [levelsData, blocksData] = await Promise.all([
          GetLevels(),
          GetBlocks(),
        ]);
        setLevels(levelsData);
        setBlocks(blocksData);
      } catch (err) {
        setError("Error al cargar los datos");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!levelId) {
      setError("Debe seleccionar un nivel");
      return;
    }

    if (!name.trim()) {
      setError("El nombre del bloque es requerido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (blockId) {
        await UpdateBlock(blockId, {
          name: name.trim(),
        });
      } else {
        await CreateBlock({
          level_id: levelId,
          name: name.trim(),
          parent_block_id: parentBlockId,
        });
      }

      setLevelId(0);
      setName("");
      setParentBlockId(null);
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Error al guardar el bloque. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredBlocks = blocks.filter(
    (block) => block.level_id === levelId && block.id !== blockId
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={blockId ? 12 : 4}>
            <FormControl
              fullWidth
              size="medium"
              disabled={loading || loadingData || !!blockId}
            >
              <InputLabel id="level-select-label">Nivel</InputLabel>
              <Select
                labelId="level-select-label"
                value={levelId || ""}
                onChange={(e) => setLevelId(Number(e.target.value))}
                label="Nivel"
                required
              >
                <MenuItem value="">Seleccionar nivel</MenuItem>
                {levels.map((level) => (
                  <MenuItem key={level.id} value={level.id}>
                    {level.name} (Stage {level.stage})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {!blockId && (
            <Grid item xs={12} sm={4}>
              <FormControl
                fullWidth
                size="medium"
                disabled={loading || loadingData || !levelId}
              >
                <InputLabel id="parent-block-select-label">
                  Bloque padre (opcional)
                </InputLabel>
                <Select
                  labelId="parent-block-select-label"
                  value={parentBlockId || ""}
                  onChange={(e) =>
                    setParentBlockId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  label="Bloque padre (opcional)"
                >
                  <MenuItem value="">Sin bloque padre</MenuItem>
                  {filteredBlocks.map((block) => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name} ({block.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={blockId ? 8 : 4}>
            <TextField
              label="Nombre del bloque"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="medium"
              error={!!error && !name.trim()}
              helperText={
                error && !name.trim() ? "Este campo es requerido" : ""
              }
              disabled={loading || loadingData}
              placeholder="Ingresa el nombre del bloque"
            />
          </Grid>

          <Grid item xs={12} sm={blockId ? 4 : 12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || loadingData || !name.trim() || !levelId}
              fullWidth={!blockId}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : blockId ? (
                  <EditIcon />
                ) : (
                  <AddIcon />
                )
              }
              sx={{
                height: 56,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              {blockId ? "Actualizar" : "Crear bloque"}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
