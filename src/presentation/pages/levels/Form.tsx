import { useState } from "react";
import { CreateLevel } from "../../../application/level/CreateLevel";
import { UpdateLevel } from "../../../application/level/UpdateLevel";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

type Props = {
  levelId?: number;
  initialStage?: number;
  initialName?: string;
  onSuccess: () => void;
};

export default function Form({
  levelId,
  initialName = "",
  onSuccess,
}: Props) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre del nivel es requerido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (levelId) {
        // Para actualizar, solo enviamos el nombre (el stage se maneja por separado si es necesario)
        await UpdateLevel(levelId, {
          name: name.trim(),
        });
      } else {
        // Para crear, solo enviamos el nombre (el stage se genera automáticamente en el backend)
        await CreateLevel({
          name: name.trim(),
        });
      }

      setName("");
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Error al guardar el nivel. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 2,
      alignItems: "flex-end",
    }}
  >
    {/* Nombre del nivel */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 75%" } }}>
      <TextField
        label="Nombre del nivel"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
        variant="outlined"
        size="medium"
        error={!!error && !name.trim()}
        helperText={error && !name.trim() ? "Este campo es requerido" : ""}
        disabled={loading}
        placeholder="Ingresa el nombre del nivel"
      />
    </Box>

    {/* Botón */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
      <Button
        type="submit"
        variant="contained"
        size="large"
          fullWidth
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : levelId ? (
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
        {levelId ? "Actualizar" : "Crear"}
      </Button>
    </Box>
  </Box>
</form>

    </Box>
  );
}
