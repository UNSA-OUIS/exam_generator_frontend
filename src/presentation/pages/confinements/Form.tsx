import { useState } from "react";
import { CreateConfinement } from "../../../application/confinement/CreateConfinement";
import { UpdateConfinement } from "../../../application/confinement/UpdateConfinement";
import { 
  TextField, 
  Button, 
  Box, 
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

type Props = {
  confinementId?: string;
  initialName?: string;
  initialTotal?: number;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  onSuccess: () => void;
};

export default function Form({
  confinementId,
  initialName = "",
  initialTotal = 0,
  initialStartDate = null,
  initialEndDate = null,
  onSuccess,
}: Props) {
  const [name, setName] = useState(initialName);
  const [total, setTotal] = useState<number>(initialTotal);
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; total?: string; startDate?: string; endDate?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string; total?: string; startDate?: string; endDate?: string } = {};

    if (!name.trim()) {
      errors.name = "El nombre del internamiento es requerido";
    }

    if (!total || total < 1) {
      errors.total = "El total debe ser mayor a 0";
    }

    if (!startDate) {
      errors.startDate = "La fecha de inicio es requerida";
    }

    if (!endDate) {
      errors.endDate = "La fecha de fin es requerida";
    }

    if (startDate && endDate && endDate <= startDate) {
      errors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Usar los nombres de campo que espera el backend (started_at y ended_at)
     const confinementData = {
  name: name.trim(),
  total: total,
  start_date: startDate!.toISOString(),  // Usar start_date
  end_date: endDate!.toISOString(),      // Usar end_date
};

      console.log('Enviando datos:', confinementData);

      if (confinementId) {
        await UpdateConfinement(confinementId, confinementData);
      } else {
        await CreateConfinement(confinementData);
      }
      
      setName("");
      setTotal(0);
      setStartDate(null);
      setEndDate(null);
      onSuccess();
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(err.response?.data?.error || "Error al guardar el internamiento. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
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
  <Box 
    sx={{ 
      display: "flex", 
      flexWrap: "wrap", 
      gap: 2, 
      alignItems: "flex-end" 
    }}
  >
    {/* Nombre */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 33%" } }}>
      <TextField
        label="Nombre del internamiento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
        variant="outlined"
        size="medium"
        error={!!fieldErrors.name}
        helperText={fieldErrors.name || ""}
        disabled={loading}
        placeholder="Ingresa el nombre del internamiento"
      />
    </Box>

    {/* Total */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 15%" } }}>
      <TextField
        label="Total"
        type="number"
        value={total || ""}
        onChange={(e) => setTotal(Number(e.target.value))}
        required
        fullWidth
        variant="outlined"
        size="medium"
        inputProps={{ min: 1 }}
        error={!!fieldErrors.total}
        helperText={fieldErrors.total || ""}
        disabled={loading}
      />
    </Box>

    {/* Fecha inicio */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 15%" } }}>
      <DatePicker
        label="Fecha de inicio"
        value={startDate}
        onChange={(newValue) => setStartDate(newValue)}
        slotProps={{
          textField: {
            required: true,
            fullWidth: true,
            error: !!fieldErrors.startDate,
            helperText: fieldErrors.startDate || "",
            disabled: loading,
          },
        }}
      />
    </Box>

    {/* Fecha fin */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 15%" } }}>
      <DatePicker
        label="Fecha de fin"
        value={endDate}
        onChange={(newValue) => setEndDate(newValue)}
        minDate={startDate || undefined}
        slotProps={{
          textField: {
            required: true,
            fullWidth: true,
            error: !!fieldErrors.endDate,
            helperText: fieldErrors.endDate || "",
            disabled: loading,
          },
        }}
      />
    </Box>

    {/* Botón */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 15%" } }}>
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        fullWidth
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : confinementId ? (
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
        {confinementId ? "Actualizar" : "Crear"}
      </Button>
    </Box>
  </Box>
</form>

      </Box>
    </LocalizationProvider>
  );
}