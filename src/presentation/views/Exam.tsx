// pages/exams/Exam.tsx
import { useRef, useState } from "react";
import { Container, Typography, Paper, Box, Button, Alert, CircularProgress } from "@mui/material";
import { AutoAwesome as GenerateIcon } from "@mui/icons-material";
import Form from "../pages/exams/Form";
import type { ListRef } from "../pages/exams/List";
import List from "../pages/exams/List";
import axios from "axios";

export default function Exam() {
  const listRef = useRef<ListRef>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

const handleGenerateMaster = async () => {
  setGenerating(true);
  setGenerateError(null);
  setGenerateSuccess(null);

  try {
    // PRIMERO: Obtener el token CSRF
    console.log('🔵 Obteniendo token CSRF...');
    const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include', // Importante para recibir la cookie
    });

    if (!csrfResponse.ok) {
      throw new Error('No se pudo obtener el token CSRF');
    }

    console.log('✅ Token CSRF obtenido');

    // SEGUNDO: Hacer la petición real
    const testData = {
      exam_id: "0199a5c3-730b-703c-b172-8c7578fbedbd",
      area: "biomedicas"
    };

    console.log('🔵 Enviando POST a:', 'http://localhost:8000/api/masters/generate');
    console.log('📦 Datos:', testData);

    const response = await fetch('http://localhost:8000/api/masters/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include', // Para enviar la cookie CSRF
      body: JSON.stringify(testData)
    });

    console.log('📡 Status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('📨 Respuesta completa:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Error parseando JSON: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Error HTTP ${response.status}`);
    }

    setGenerateSuccess(data.message || `Master generado exitosamente. Count: ${data.count}`);
  } catch (err: any) {
    console.error('💥 Error completo:', err);
    setGenerateError(err.message || 'Error al generar el master');
  } finally {
    setGenerating(false);
  }
};
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header con título y botón */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          Gestión de Exámenes
        </Typography>
        
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={handleGenerateMaster}
          disabled={generating}
          startIcon={
            generating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <GenerateIcon />
            )
          }
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
            boxShadow: 2,
            px: 3,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          {generating ? "Generando..." : "Generar Master"}
        </Button>
      </Box>

      {/* Alertas de éxito/error */}
      {generateError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setGenerateError(null)}
        >
          {generateError}
        </Alert>
      )}
      
      {generateSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setGenerateSuccess(null)}
        >
          {generateSuccess}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Crear Nuevo Examen
          </Typography>
          <Form onSuccess={() => listRef.current?.reload()} />
        </Paper>

        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <List ref={listRef} />
        </Paper>
      </Box>
    </Container>
  );
}