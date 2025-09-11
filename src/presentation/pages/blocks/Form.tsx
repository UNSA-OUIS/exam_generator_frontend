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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography
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
  const [levelId, setLevelId] = useState<number | "">(initialLevelId || "");
  const [name, setName] = useState(initialName);
  const [parentBlockId, setParentBlockId] = useState<number | "">("");
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
          GetBlocks()
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

  const selectedLevel = typeof levelId === "number" ? levels.find(level => level.id === levelId) : null;
  const previousLevel = selectedLevel 
    ? levels.find(level => level.stage === selectedLevel.stage - 1)
    : null;

  const parentBlocks = previousLevel 
    ? blocks.filter(block => block.level_id === previousLevel.id && block.id !== blockId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!levelId || typeof levelId !== "number") {
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
        await UpdateBlock(blockId, { name: name.trim() });
      } else {
        await CreateBlock({ 
          level_id: levelId,
          name: name.trim(),
          parent_block_id: typeof parentBlockId === "number" ? parentBlockId : null
        });
      }
      
      setLevelId("");
      setName("");
      setParentBlockId("");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar el bloque. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Contenedor principal de inputs */}
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          
          {/* Select de Nivel */}
          <FormControl 
            fullWidth 
            size="medium" 
            disabled={loading || loadingData || !!blockId} 
            sx={{ minWidth: 200, flex: "1 1 30%" }}
          >
            <InputLabel id="level-select-label">Nivel</InputLabel>
            <Select
              labelId="level-select-label"
              value={levelId}
              onChange={(e) => {
                setLevelId( Number(e.target.value));
                setParentBlockId("");
              }}
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

          {/* Select de Bloque Padre */}
          <FormControl 
            fullWidth 
            size="medium" 
            disabled={loading || loadingData || !levelId || typeof levelId !== "number"} 
            sx={{ minWidth: 200, flex: "1 1 30%" }}
          >
            <InputLabel id="parent-block-select-label">
              {previousLevel ? `Bloque padre (Nivel ${previousLevel.stage})` : 'Bloque padre'}
            </InputLabel>
            <Select
              labelId="parent-block-select-label"
              value={parentBlockId}
              onChange={(e) => setParentBlockId( Number(e.target.value))}
              label={previousLevel ? `Bloque padre (Nivel ${previousLevel.stage})` : 'Bloque padre'}
            >
              <MenuItem value="">Sin bloque padre</MenuItem>
              {parentBlocks.length > 0 ? (
                parentBlocks.map((block) => (
                  <MenuItem key={block.id} value={block.id}>
                    {block.name} ({block.code})
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  {previousLevel 
                    ? `No hay bloques en el nivel ${previousLevel.stage}`
                    : 'Selecciona un nivel primero'}
                </MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Input de Nombre */}
          <TextField
            label="Nombre del bloque"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="medium"
            error={!!error && !name.trim()}
            helperText={error && !name.trim() ? "Este campo es requerido" : ""}
            disabled={loading || loadingData}
            placeholder="Ingresa el nombre del bloque"
            sx={{ flex: "1 1 30%" }}
          />
        </Box>

        {/* Botón */}
        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          disabled={loading || loadingData || !name.trim() || !levelId || typeof levelId !== "number"}
          fullWidth
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
            textTransform: 'none',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          {blockId ? "Actualizar" : "Crear bloque"}
        </Button>
      </form>
    </Box>
  );
}
