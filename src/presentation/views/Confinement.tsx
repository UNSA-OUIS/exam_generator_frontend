import { useRef } from "react";
import { Container, Typography, Paper, Box } from "@mui/material";
import Form from "../pages/confinements/Form";
import type { ListRef } from "../pages/confinements/List";
import List from "../pages/confinements/List";

export default function Confinement() {
  const listRef = useRef<ListRef>(null);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 4
        }}
      >
        Gestión de internamientos
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Crear Nuevo internamiento
          </Typography>
          <Form onSuccess={() => listRef.current?.reload()} />
        </Paper>

        <Paper 
          elevation={2} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <List ref={listRef} />
        </Paper>
      </Box>
    </Container>
  );
}