import { useState } from "react";
import { CreateProcess } from "../../../application/process/CreateProcess";
import { UpdateProcess } from "../../../application/process/UpdateProcess";
import { 
  TextField, 
  Button, 
  Box, 
  CircularProgress,
  Alert 
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

type Props = {
  processId?: number;
  initialName?: string;
  onSuccess: () => void;
};

export default function Form({
  processId,
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
      if (processId) {
        await UpdateProcess(processId, { name: name.trim() });
      } else {
        await CreateProcess({ name: name.trim() });
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
            helperText={error && !name.trim() ? "Este campo es requerido" : ""}
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
            disabled={loading || !name.trim()}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : processId ? (
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
            {processId ? "Actualizar" : "Crear"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}