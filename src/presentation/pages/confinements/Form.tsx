
import { useState, useEffect } from "react";
import { CreateConfinement } from "../../../application/confinement/CreateConfinement";
import { UpdateConfinement } from "../../../application/confinement/UpdateConfinement";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Close as CloseIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  confinementId?: string;
  initialName?: string;
  initialTotal?: number;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
};

export default function Form({
  open,
  onClose,
  onSuccess,
  confinementId,
  initialName = "",
  initialTotal = 0,
  initialStartDate = null,
  initialEndDate = null,
}: Props) {
  const [name, setName] = useState(initialName);
  const [total, setTotal] = useState<number>(initialTotal);
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; total?: string; startDate?: string; endDate?: string }>({});

  // Reset form when modal opens/closes or when editing different confinement
  useEffect(() => {
    if (open) {
      setName(initialName);
      setTotal(initialTotal);
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
      setError(null);
      setFieldErrors({});
    }
  }, [open, confinementId, initialName, initialTotal, initialStartDate, initialEndDate]);

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
      const confinementData = {
        name: name.trim(),
        total: total,
        start_date: startDate!.toISOString(),
        end_date: endDate!.toISOString(),
      };

      console.log('Enviando datos:', confinementData);

      if (confinementId) {
        await UpdateConfinement(confinementId, confinementData);
      } else {
        await CreateConfinement(confinementData);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(err.response?.data?.error || "Error al guardar el internamiento. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isEdit = Boolean(confinementId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isEdit ? "Editar internamiento" : "Crear nuevo internamiento"}
          </Typography>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Nombre */}
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <Box sx={{ flex: 3, paddingTop: 1 }}>
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
                <Box sx={{ flex: 1, paddingTop: 1 }}>
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
              </Box>
              {/* Fechas */}
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <Box sx={{ flex: 1 }}>
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

                <Box sx={{ flex: 1 }}>
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
              </Box>
            </Box>
          </form>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}
            startIcon={<CloseIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : isEdit ? (
                <EditIcon />
              ) : (
                <AddIcon />
              )
            }
            sx={{
              fontWeight: 600,
              textTransform: "none",
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}