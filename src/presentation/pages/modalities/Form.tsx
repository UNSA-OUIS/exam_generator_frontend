import { useState } from "react";
import { CreateModality } from "../../../application/modality/CreateModality";
import { UpdateModality } from "../../../application/modality/UpdateModality";
import { 
  TextField, 
  Button, 
  Box, 
  CircularProgress,
  Alert 
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

type Props = {
  modalityId?: number;
  initialName?: string;
  onSuccess: () => void;
};

export default function Form({
  modalityId,
  initialName = "",
  onSuccess,
}: Props) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("El nombre del Modalidad es requerido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (modalityId) {
        await UpdateModality(modalityId, { name: name.trim() });
      } else {
        await CreateModality({ name: name.trim() });
      }
      
      setName("");
      onSuccess();
    } catch (err) {
      setError("Error al guardar el Modalidad. Inténtalo nuevamente.");
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Nombre del Modalidad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="medium"
            error={!!error && !name.trim()}
  helperText={!name.trim() ? "⚠️ Debes ingresar un nombre para continuar" : ""} // 🔹 mensaje personalizado
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          <Button 
  type="submit" 
  variant="contained" 
  size="large"
  disabled={loading} // 🔹 ya no depende de name
  startIcon={
    loading ? (
      <CircularProgress size={20} color="inherit" />
    ) : modalityId ? (
      <EditIcon />
    ) : (
      <AddIcon />
    )
  }
  sx={{
    minWidth: 140,
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
  {modalityId ? "Actualizar" : "Crear"}
</Button>

        </Box>
      </form>
    </Box>
  );
}