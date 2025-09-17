import { useState, useEffect } from "react";
import { CreateMatrix } from "../../../application/matrix/CreateMatrix";
import { UpdateMatrix } from "../../../application/matrix/UpdateMatrix";
import { GetProcesses } from "../../../application/process/GetProcesses";
import type { Process } from "../../../models/Process";
import { 
  TextField, 
  Button, 
  Box, 
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

type Props = {
  matrixId?: number;
  initialYear?: string;
  initialTotalAlternatives?: number;
  initialProcessId?: number;
  onSuccess: () => void;
};

export default function Form({
  matrixId,
  initialYear = "",
  initialTotalAlternatives = 0,
  initialProcessId = 0,
  onSuccess,
}: Props) {
  const [year, setYear] = useState<string>(initialYear);
  const [totalAlternatives, setTotalAlternatives] = useState<number>(initialTotalAlternatives);
  const [processId, setProcessId] = useState<number | "">(initialProcessId || "");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcesses = async () => {
      setLoadingData(true);
      try {
        const processesData = await GetProcesses();
        setProcesses(processesData);
      } catch (err) {
        setError("Error al cargar los procesos");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProcesses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!year || year.length !== 4) {
      setError("El año debe tener 4 dígitos");
      return;
    }

    if (!totalAlternatives || totalAlternatives < 1) {
      setError("El número de alternativas debe ser mayor a 0");
      return;
    }

    if (!processId || typeof processId !== "number") {
      setError("Debe seleccionar un proceso");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (matrixId) {
        await UpdateMatrix(matrixId, { 
          year,
          total_alternatives: totalAlternatives,
          process_id: processId
        });
      } else {
        await CreateMatrix({ 
          year,
          total_alternatives: totalAlternatives,
          process_id: processId
        });
      }
      
      setYear("");
      setTotalAlternatives(0);
      setProcessId("");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar la matriz. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);

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
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 2,
      alignItems: "flex-end",
    }}
  >
    {/* Año */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
      <FormControl
        fullWidth
        size="medium"
        disabled={loading || loadingData}
        sx={{ minWidth: 150 }}
      >
        <InputLabel id="year-select-label">Año</InputLabel>
        <Select
          labelId="year-select-label"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          label="Año"
          required
        >
          <MenuItem value="">Seleccionar año</MenuItem>
          {yearOptions.map((yearOption) => (
            <MenuItem key={yearOption} value={yearOption.toString()}>
              {yearOption}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    {/* Total de alternativas */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
      <TextField
        label="Total de alternativas"
        type="number"
        value={totalAlternatives || ""}
        onChange={(e) => setTotalAlternatives(Number(e.target.value))}
        required
        fullWidth
        variant="outlined"
        size="medium"
        inputProps={{ min: 1 }}
        error={!!error && (!totalAlternatives || totalAlternatives < 1)}
        helperText={
          error && (!totalAlternatives || totalAlternatives < 1)
            ? "Debe ser mayor a 0"
            : ""
        }
        disabled={loading || loadingData}
      />
    </Box>

    {/* Proceso */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
      <FormControl
        fullWidth
        size="medium"
        disabled={loading || loadingData}
        sx={{ minWidth: 200 }}
      >
        <InputLabel id="process-select-label">Proceso</InputLabel>
        <Select
          labelId="process-select-label"
          value={processId}
          onChange={(e) =>
            setProcessId( Number(e.target.value))
          }
          label="Proceso"
          required
        >
          <MenuItem value="">Seleccionar proceso</MenuItem>
          {processes.map((process) => (
            <MenuItem key={process.id} value={process.id}>
              {process.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    {/* Botón */}
    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={
          loading || loadingData || !year || !totalAlternatives || !processId
        }
        fullWidth
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : matrixId ? (
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
        {matrixId ? "Actualizar" : "Crear matriz"}
      </Button>
    </Box>
  </Box>
</form>

    </Box>
  );
}