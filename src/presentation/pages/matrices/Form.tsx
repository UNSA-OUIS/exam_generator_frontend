import { useState, useEffect } from "react";
import { CreateMatrix } from "../../../application/matrix/CreateMatrix";
import { UpdateMatrix } from "../../../application/matrix/UpdateMatrix";
import { GetModalities } from "../../../application/modality/GetModalities";
import type { Modality } from "../../../models/Modality";
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
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

// Refleja el AreaEnum del backend
const AREAS = ["BIOMEDICAS", "SOCIALES", "INGENIERIAS"] as const;

type Props = {
  matrixId?: string;
  initialYear?: string;
  initialTotalAlternatives?: number;
  initialModalityId?: number;
  initialQuestionsPerArea?: number;
  initialUniqueArea?: boolean;
  onSuccess: () => void;
};

export default function Form({
  matrixId,
  initialYear = "",
  initialTotalAlternatives = 0,
  initialModalityId = 0,
  initialQuestionsPerArea = 0,
  initialUniqueArea = false,
  onSuccess,
}: Props) {
  const [year, setYear] = useState<string>(initialYear);
  const [totalAlternatives, setTotalAlternatives] = useState<number>(initialTotalAlternatives);
  const [modalityId, setModalityId] = useState<number | "">(initialModalityId || "");
  const [questionsPerArea, setQuestionsPerArea] = useState<number>(initialQuestionsPerArea);
  const [uniqueArea, setUniqueArea] = useState<boolean>(initialUniqueArea);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModalities = async () => {
      setLoadingData(true);
      try {
        const modalitiesData = await GetModalities();
        setModalities(modalitiesData);
      } catch (err) {
        setError("Error al cargar las modalidades");
      } finally {
        setLoadingData(false);
      }
    };

    fetchModalities();
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

    if (!modalityId || typeof modalityId !== "number") {
      setError("Debe seleccionar una modalidad");
      return;
    }

    if (!questionsPerArea || questionsPerArea < 1) {
      setError("El número de preguntas por área debe ser mayor a 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        year,
        n_alternatives: totalAlternatives,
        modality_id: modalityId,
        questions_per_area: questionsPerArea,
        unique_area: uniqueArea,
      };

      if (matrixId) {
        await UpdateMatrix(matrixId, payload);
      } else {
        await CreateMatrix(payload);
      }

      setYear("");
      setTotalAlternatives(0);
      setModalityId("");
      setQuestionsPerArea(0);
      setUniqueArea(false);
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Error al guardar la matriz. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}>
          
          {/* Año */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
            <FormControl fullWidth size="medium" disabled={loading || loadingData}>
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

          {/* Modalidad */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
            <FormControl fullWidth size="medium" disabled={loading || loadingData}>
              <InputLabel id="modality-select-label">Modalidad</InputLabel>
              <Select
                labelId="modality-select-label"
                value={modalityId}
                onChange={(e) => setModalityId(Number(e.target.value))}
                label="Modalidad"
                required
              >
                <MenuItem value="">Seleccionar Modalidad</MenuItem>
                {modalities.map((modality) => (
                  <MenuItem key={modality.id} value={modality.id}>
                    {modality.name}
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
              disabled={loading || loadingData}
            />
          </Box>

          {/* Preguntas por área */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 23%" } }}>
            <TextField
              label="Preguntas por área"
              type="number"
              value={questionsPerArea || ""}
              onChange={(e) => setQuestionsPerArea(Number(e.target.value))}
              required
              fullWidth
              variant="outlined"
              size="medium"
              inputProps={{ min: 1 }}
              disabled={loading || loadingData}
            />
          </Box>

          {/* Área única */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 100%" },
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={uniqueArea}
                  onChange={(e) => setUniqueArea(e.target.checked)}
                  disabled={loading || loadingData}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    ¿Es área única?
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {uniqueArea
                      ? "Se creará 1 área: ÚNICA"
                      : `Se crearán 3 áreas: ${AREAS.join(", ")}`}
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Botón */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || loadingData}
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
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {loading
                ? "Guardando..."
                : matrixId
                ? "Actualizar matriz"
                : "Crear matriz"}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}