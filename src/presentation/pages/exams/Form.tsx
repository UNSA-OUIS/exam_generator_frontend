// pages/exams/Form.tsx
import { useState, useEffect } from "react";
import { CreateExam } from "../../../application/exam/CreateExam";
import { UpdateExam } from "../../../application/exam/UpdateExam";
import { getMatrices } from "../../../infrastructure/api/MatrixApi"; // Importar la API real
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";

import type { Matrix } from "../../../models/Matrix";

type Props = {
  examId?: number;
  initialMatrixId?: number;
  initialDescription?: string;
  initialTotalVariations?: number;
  onSuccess: () => void;
};

export default function Form({
  examId,
  initialDescription = "",
  initialMatrixId = 0,
  initialTotalVariations = 1,
  onSuccess,
}: Props) {
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [matrixId, setMatrixId] = useState<number>(initialMatrixId);
  const [description, setDescription] = useState(initialDescription);
  const [totalVariations, setTotalVariations] = useState<number>(initialTotalVariations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMatrices, setLoadingMatrices] = useState(true);

  // Cargar matrices desde la API
  useEffect(() => {
    const fetchMatrices = async () => {
      try {
        setLoadingMatrices(true);
        const matricesData = await getMatrices();
        setMatrices(matricesData);
      } catch (err) {
        setError("Error al cargar las matrices");
      } finally {
        setLoadingMatrices(false);
      }
    };

    fetchMatrices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matrixId) {
      setError("La matriz es requerida");
      return;
    }

    if (!description.trim()) {
      setError("La descripción del examen es requerida");
      return;
    }

    if (!totalVariations || totalVariations < 1) {
      setError("El número de variaciones debe ser mayor a 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (examId) {
        await UpdateExam(examId, {
          matrix_id: matrixId,
          description: description.trim(),
          total_variations: totalVariations,
        });
      } else {
        await CreateExam({
          matrix_id: matrixId,
          description: description.trim(),
          total_variations: totalVariations,
        });
      }

      // Solo limpiar el formulario si es creación, no edición
      if (!examId) {
        setMatrixId(0);
        setDescription("");
        setTotalVariations(1);
      }

      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        "Error al guardar el examen. Inténtalo nuevamente."
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
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: "flex-start" }}>
          {/* Selección de Matriz */}
          <TextField
            select
            label="Matriz"
            value={matrixId}
            onChange={(e) => setMatrixId(Number(e.target.value))}
            required
            variant="outlined"
            size="medium"
            error={!!error && !matrixId}
            helperText={error && !matrixId ? "Este campo es requerido" : ""}
            disabled={loading || loadingMatrices}
            sx={{ flex: 1 }}
          >
            <MenuItem value={0}>
              {loadingMatrices ? "Cargando matrices..." : "Selecciona una matriz"}
            </MenuItem>
            {matrices.map((matrix) => (
              <MenuItem key={matrix.id} value={matrix.id}>
                {matrix.modality?.name} - {matrix.year}
              </MenuItem>
            ))}
          </TextField>

          {/* Descripción del examen */}
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            variant="outlined"
            size="medium"
            error={!!error && !description.trim()}
            helperText={error && !description.trim() ? "Este campo es requerido" : ""}
            disabled={loading}
            placeholder="Ingresa la descripción"
            sx={{ flex: 2 }}
          />

          {/* Número de variaciones */}
          <TextField
            type="number"
            label="N° Temas"
            value={totalVariations}
            onChange={(e) => setTotalVariations(Number(e.target.value))}
            required
            variant="outlined"
            size="medium"
            inputProps={{ min: 1, max: 100 }}
            error={!!error && (!totalVariations || totalVariations < 1)}
            helperText={error && (!totalVariations || totalVariations < 1) ? "Debe ser mayor a 0" : ""}
            disabled={loading}
            sx={{ flex: 0.7 }}
          />

          {/* Botón */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loadingMatrices}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : examId ? (
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
              whiteSpace: "nowrap",
              "&:hover": { boxShadow: 4 },
            }}
          >
            {loadingMatrices ? "Cargando..." : examId ? "Actualizar" : "Crear"}
          </Button>
        </Box>
      </form>

    </Box>
  );
}