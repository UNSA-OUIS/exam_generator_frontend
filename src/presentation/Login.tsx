import { Grid, Paper, Avatar, TextField, Button, Stack, Box } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
  const paperStyle = { padding: 20, width: 300 };
  const avatarStyle = { backgroundColor: '#1bbd7e' };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f5f5f5', // opcional: fondo claro
      }}
    >
      <Paper elevation={10} style={paperStyle}>
        <Grid container direction="column" alignItems="center">
          <Avatar style={avatarStyle}>
            <LockOutlinedIcon />
          </Avatar>
          <h3 style={{ textAlign: 'center' }}>SISTEMA DE GENERACIÓN DE EXAMENES</h3>
        </Grid>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Usuario"
            variant="standard"
            placeholder="Ingrese email"
            fullWidth
            required
          />
          <TextField
            type="password"
            label="Contraseña"
            variant="standard"
            placeholder="Ingrese contraseña"
            fullWidth
            required
          />
          <Button variant="contained" fullWidth>
            Validar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login