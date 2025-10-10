import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { Assignment, Group, Settings } from "@mui/icons-material";
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Banco de Preguntas",
      description: "Administra las preguntas clasificadas por bloques y niveles.",
      icon: <WarehouseIcon fontSize="large" color="primary" />,
      action: () => navigate("/bank"),
    },
    {
      title: "Matrices de Examen",
      description: "Define las estructuras de tus exámenes según modalidad y año.",
      icon: <Assignment fontSize="large" color="success" />,
      action: () => navigate("/matrices"),
    },
    {
      title: "Colaboradores",
      description: "Gestiona a los docentes o usuarios encargados de elaborar preguntas.",
      icon: <Group fontSize="large" color="secondary" />,
      action: () => navigate("/collaborators"),
    },
    {
      title: "Modalidades",
      description: "Administra niveles, modalidades y parámetros generales del sistema.",
      icon: <Settings fontSize="large" color="warning" />,
      action: () => navigate("/modality"),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        p: 2,
      }}
    >
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Bienvenido al Generador de Exámenes
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Crea, organiza y gestiona exámenes de forma eficiente y profesional.
      </Typography>

      <Stack
        direction="row"
        spacing={3}
        flexWrap="wrap"
        justifyContent="center"
      >
        {sections.map((section, index) => (
          <Card
            key={index}
            sx={{
              width: 230,
              borderRadius: 3,
              boxShadow: 3,
              transition: "0.3s",
              "&:hover": {
                boxShadow: 6,
                transform: "translateY(-5px)",
              },
            }}
          >
            <CardContent>
              <Box sx={{ mb: 2 }}>{section.icon}</Box>
              <Typography variant="h6" fontWeight="bold">
                {section.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minHeight: 50, mb: 2 }}
              >
                {section.description}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={section.action}
                fullWidth
              >
                Ingresar
              </Button>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
