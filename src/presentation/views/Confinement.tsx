
import { useRef, useState } from "react";
import { Container, Typography, Paper, Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import Form from "../pages/confinements/Form";
import type { ListRef } from "../pages/confinements/List";
import List from "../pages/confinements/List";

export default function Confinement() {
  const listRef = useRef<ListRef>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleOpenForm = () => {
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
  };

  const handleSuccess = () => {
    listRef.current?.reload();
    handleCloseForm();
  };

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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Gestión de internamientos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crea y gestiona todos los internamientos del sistema
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
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
            Agregar nuevo internamiento
          </Button>
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

      {/* Modal del formulario */}
      <Form
        open={formOpen}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
      />
    </Container>
  );
}
