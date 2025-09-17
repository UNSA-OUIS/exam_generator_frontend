// presentation/pages/collaborators/Collaborator.tsx
import { useRef } from "react";
import { Container, Typography, Paper, Box } from "@mui/material";
import type { ListRef } from "../pages/collaborators/List";
import List from "../pages/collaborators/List";

export default function Collaborator() {
  const listRef = useRef<ListRef>(null);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: "bold",
          color: "primary.main",
          mb: 4,
        }}
      >
        Gestión de Colaboradores
      </Typography>

      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <List ref={listRef} />
      </Paper>
    </Container>
  );
}