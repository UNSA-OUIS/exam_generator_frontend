import { useState } from "react";
import {
  Grid,
  Paper,
  Avatar,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const paperStyle = { padding: 20, width: 300 };
  const avatarStyle = { backgroundColor: "#1bbd7e" };

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const success = await login(user, pass);
    if (success) {
      navigate("/home");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f5f5f5", // opcional: fondo claro
      }}
    >
      <Paper elevation={10} style={paperStyle}>
        <Grid container direction="column" alignItems="center">
          <Avatar style={avatarStyle}>
            <LockOutlinedIcon />
          </Avatar>
          <h3 style={{ textAlign: "center" }}>
            SISTEMA DE GENERACIÓN DE EXAMENES
          </h3>
        </Grid>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Usuario"
            variant="standard"
            placeholder="Ingrese email"
            fullWidth
            required
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <TextField
            type="password"
            label="Contraseña"
            variant="standard"
            placeholder="Ingrese contraseña"
            fullWidth
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button variant="contained" fullWidth onClick={handleLogin}>
            Validar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login;
