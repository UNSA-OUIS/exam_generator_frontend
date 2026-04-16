import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, IconButton,
  Divider, CircularProgress, Alert, Chip, Tooltip, Table,
  TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
  Save as SaveIcon,
  CheckCircleOutline as CheckIcon,
} from "@mui/icons-material";
import { ExamTextApi } from "../../../../infrastructure/api/ExamTextApi";
import { CreateExamText } from "../../../../application/exam/CreateExamText";
import { UpdateExamText } from "../../../../application/exam/UpdateExamText";
//import { DeleteExamText } from "../../../../application/exam/DeleteExamText";
import type { ExamText } from "../../../../models/ExamText";
import type { Block } from "../../../../models/Block";
import { DeleteExamText } from "../../../../application/exam/DeleteExamText";

interface ExamTextModalProps {
  open: boolean;
  onClose: () => void;
  examId: string;
  area: string;
  block: Block;
  maxQuestions: number;
}

interface TextRow {
  id?: number;
  nTexts: number;
  questionsPerText: number;
  isNew: boolean;
  isDirty: boolean;
  saving: boolean;
  saved: boolean;    // feedback visual momentáneo
  error?: string;
}

const emptyRow = (): TextRow => ({
  nTexts: 1,
  questionsPerText: 1,
  isNew: true,
  isDirty: true,
  saving: false,
  saved: false,
});

export default function ExamTextModal({
  open, onClose, examId, area, block, maxQuestions,
}: ExamTextModalProps) {
  const [rows, setRows] = useState<TextRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const loadedForBlockRef = useRef<number | null>(null);

  // ── Carga al abrir o cambiar de bloque ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    // Limpiar inmediatamente para no mostrar datos del bloque anterior
    setRows([]);
    setGlobalError(null);
    loadedForBlockRef.current = null;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const existing = await ExamTextApi.getByExamAndBlock(examId, block.id, area);
        if (cancelled) return;
        loadedForBlockRef.current = block.id;
        setRows(
          existing.map((et) => ({
            id: et.id,
            nTexts: et.n_texts,
            questionsPerText: et.questions_per_text,
            isNew: false,
            isDirty: false,
            saving: false,
            saved: false,
          })),
        );
      } catch {
        if (cancelled) return;
        setGlobalError("Error al cargar textos existentes");
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      // NO llamamos setRows([]) aquí — eso causaba que la carga nueva fuera pisada
    };
  }, [open, examId, block.id, area]);

  // ── Derivados ───────────────────────────────────────────────────────────────
  const usedQuestions = rows.reduce((s, r) => s + r.nTexts * r.questionsPerText, 0);
  const remaining = maxQuestions - usedQuestions;
  const pendingCount = rows.filter((r) => r.isDirty || r.isNew).length;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const updateRow = useCallback((idx: number, patch: Partial<TextRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }, []);

  const addRow = () => {
    if (remaining <= 0) return;
    setRows((prev) => [...prev, emptyRow()]);
  };

  // ── Guardar una fila individual ──────────────────────────────────────────────
  const saveRow = async (idx: number) => {
    const row = rows[idx];
    if (!row.isDirty && !row.isNew) return;
    if (!row.nTexts || !row.questionsPerText) {
      updateRow(idx, { error: "Completa los campos antes de guardar." });
      return;
    }

    updateRow(idx, { saving: true, error: undefined });

    const payload: Partial<ExamText> = {
      exam_id: examId,
      area,
      block_id: block.id,
      n_texts: row.nTexts,
      questions_per_text: row.questionsPerText,
    };

    try {
      if (row.id) {
        // Actualizar fila existente
        await UpdateExamText(row.id, payload);
        updateRow(idx, { saving: false, isNew: false, isDirty: false, saved: true });
      } else {
        // Crear nueva fila — evitamos duplicar si ya existe un registro con el mismo
        // questions_per_text para este bloque/area/exam (unique constraint del backend)
        const created = await CreateExamText(payload);
        updateRow(idx, { saving: false, isNew: false, isDirty: false, saved: true, id: created.id });
      }
      // Quitar el checkmark después de 1.5s
      setTimeout(() => updateRow(idx, { saved: false }), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message;
      updateRow(idx, { saving: false, error: msg });
    }
  };

  // ── Guardar todas las filas pendientes ───────────────────────────────────────
  const saveAll = async () => {
    const pending = rows
      .map((r, i) => ({ row: r, idx: i }))
      .filter(({ row }) => (row.isDirty || row.isNew) && row.nTexts && row.questionsPerText);

    for (const { idx } of pending) {
      await saveRow(idx);
    }
  };

  // ── Eliminar fila ────────────────────────────────────────────────────────────
  const deleteRow = async (idx: number) => {
    const row = rows[idx];
    // Fila nueva sin guardar: solo quitar del estado
    if (row.isNew) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    updateRow(idx, { saving: true });
    try {
      if (row.id) await DeleteExamText(row.id);
      setRows((prev) => prev.filter((_, i) => i !== idx));
    } catch (err: any) {
      updateRow(idx, { saving: false, error: err.response?.data?.error ?? "Error al eliminar" });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const isSavingAny = rows.some((r) => r.saving);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}>
      {/* ── Título ── */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 1.5, bgcolor: "primary.50",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, mt: 0.25,
          }}>
            <ArticleIcon sx={{ fontSize: "1.1rem", color: "primary.main" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
              Textos del bloque
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {block.code && (
                <Box component="span" sx={{ fontFamily: "monospace", mr: 0.75 }}>{block.code}</Box>
              )}
              {block.name} · {area}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            {/* Contador usado/máximo */}
            <Box sx={{
              px: 1.5, py: 0.5, borderRadius: 1,
              bgcolor: remaining < 0 ? "error.50" : remaining === 0 ? "warning.50" : "success.50",
              border: "1px solid",
              borderColor: remaining < 0 ? "error.200" : remaining === 0 ? "warning.200" : "success.200",
            }}>
              <Typography variant="caption" fontWeight={600}
                color={remaining < 0 ? "error.main" : remaining === 0 ? "warning.main" : "success.main"}>
                {usedQuestions} / {maxQuestions} preguntas
              </Typography>
            </Box>
            <Tooltip title="El total (textos × preguntas por texto) no puede exceder el requerimiento del bloque.">
              <InfoIcon sx={{ fontSize: "1rem", color: "text.disabled" }} />
            </Tooltip>
            <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
              <CloseIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      {/* ── Contenido ── */}
      <DialogContent sx={{ p: 0 }}>
        {globalError && <Alert severity="error" sx={{ m: 2, mb: 0 }}>{globalError}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5, px: 3 }}>
            <ArticleIcon sx={{ fontSize: "2.5rem", color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No hay textos configurados para este bloque en el área {area}.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Agrega una fila para definir cuántos textos y preguntas por texto se requieren.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", pl: 3 }}>
                  N° Textos
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}>
                  Preguntas / Texto
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}>
                  Subtotal
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}>
                  Estado
                </TableCell>
                <TableCell sx={{ width: 120, fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => {
                const subtotal = row.nTexts * row.questionsPerText;
                return (
                  <TableRow key={idx} sx={{
                    bgcolor: row.error
                      ? "error.50"
                      : row.saved ? "success.50"
                      : row.isNew ? "rgba(25,118,210,0.03)"
                      : "background.paper",
                    transition: "background .2s",
                    "&:hover": { bgcolor: row.error ? "error.50" : "grey.50" },
                  }}>
                    {/* N° Textos */}
                    <TableCell sx={{ py: 1, pl: 3 }}>
                      <TextField type="number" size="small"
                        value={row.nTexts || ""}
                        onChange={(e) => updateRow(idx, {
                          nTexts: Math.max(1, parseInt(e.target.value || "1", 10)),
                          isDirty: true, error: undefined, saved: false,
                        })}
                        inputProps={{ min: 1, style: { width: 64, textAlign: "center", padding: "4px 8px", fontSize: "0.85rem" } }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                        disabled={row.saving || isSavingAny}
                      />
                    </TableCell>

                    {/* Preguntas / Texto */}
                    <TableCell sx={{ py: 1 }}>
                      <TextField type="number" size="small"
                        value={row.questionsPerText || ""}
                        onChange={(e) => updateRow(idx, {
                          questionsPerText: Math.max(1, parseInt(e.target.value || "1", 10)),
                          isDirty: true, error: undefined, saved: false,
                        })}
                        inputProps={{ min: 1, style: { width: 64, textAlign: "center", padding: "4px 8px", fontSize: "0.85rem" } }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                        disabled={row.saving || isSavingAny}
                      />
                    </TableCell>

                    {/* Subtotal */}
                    <TableCell sx={{ py: 1, textAlign: "center" }}>
                      <Typography variant="body2"
                        fontWeight={subtotal > 0 ? 600 : 400}
                        color={subtotal > 0 ? "text.primary" : "text.disabled"}>
                        {subtotal > 0 ? subtotal : "—"}
                      </Typography>
                    </TableCell>

                    {/* Estado */}
                    <TableCell sx={{ py: 1, textAlign: "center" }}>
                      {row.error ? (
                        <Tooltip title={row.error}>
                          <Chip size="small" label="Error" color="error" sx={{ fontSize: "0.65rem" }} />
                        </Tooltip>
                      ) : row.saving ? (
                        <CircularProgress size={14} />
                      ) : row.saved ? (
                        <Chip size="small" label="Guardado ✓" color="success" sx={{ fontSize: "0.65rem" }} />
                      ) : row.isNew ? (
                        <Chip size="small" label="Sin guardar" color="warning" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                      ) : row.isDirty ? (
                        <Chip size="small" label="Modificado" color="info" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                      ) : (
                        <Chip size="small" label="Guardado" color="success" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                      )}
                    </TableCell>

                    {/* Acciones: guardar fila + eliminar */}
                    <TableCell sx={{ py: 1, textAlign: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        {/* Botón guardar individual — solo visible si hay cambios */}
                        {(row.isDirty || row.isNew) && !row.saving && (
                          <Tooltip title="Guardar esta fila">
                            <IconButton size="small" color="primary"
                              onClick={() => saveRow(idx)}
                              disabled={isSavingAny}
                              sx={{ p: 0.5, border: "1px solid", borderColor: "primary.200", borderRadius: 1 }}>
                              <SaveIcon sx={{ fontSize: "0.95rem" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.saved && !row.isDirty && (
                          <CheckIcon sx={{ fontSize: "1rem", color: "success.main" }} />
                        )}
                        <Tooltip title="Eliminar fila">
                          <span>
                            <IconButton size="small" color="error"
                              onClick={() => deleteRow(idx)}
                              disabled={row.saving || isSavingAny}
                              sx={{ p: 0.5 }}>
                              <DeleteIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <Divider />

      {/* ── Acciones ── */}
      <DialogActions sx={{ px: 3, py: 1.5, justifyContent: "space-between" }}>
        {/* Agregar fila */}
        <Button size="small" startIcon={<AddIcon />} onClick={addRow} variant="outlined"
          disabled={loading || isSavingAny || remaining <= 0}
          sx={{ textTransform: "none", fontSize: "0.8rem" }}>
          Agregar texto
        </Button>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {remaining < 0 && (
            <Typography variant="caption" color="error" fontWeight={600}>
              Excede el límite en {Math.abs(remaining)} preguntas
            </Typography>
          )}

          {/* Guardar todas las filas pendientes */}
          {pendingCount > 0 && (
            <Button variant="contained" size="small" color="warning"
              startIcon={isSavingAny
                ? <CircularProgress size={14} color="inherit" />
                : <SaveIcon />}
              onClick={saveAll}
              disabled={isSavingAny || remaining < 0}
              disableElevation
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem" }}>
              {isSavingAny ? "Guardando..." : `Guardar pendientes (${pendingCount})`}
            </Button>
          )}

          <Button variant="contained" size="small" onClick={onClose}
            disableElevation sx={{ textTransform: "none", fontWeight: 600, minWidth: 80 }}>
            Cerrar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}