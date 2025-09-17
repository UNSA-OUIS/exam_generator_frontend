import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  TextField,
  Typography,
  Link as MuiLink,
  IconButton,
  InputAdornment,
  Fade,
  Alert,
  Grow,
} from "@mui/material";
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[4],
  },
  "&:active": {
    transform: "scale(0.98)",
    boxShadow: theme.shadows[1],
  },
}));

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const success = await login(user, pass);
    if (success) navigate("/home");
  };

  const handleClickShowPassword = () =>
    setShowPassword((prev) => !prev);

  return (
    <Fade in timeout={1000}>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: "url('img_bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <CssBaseline />
        <Grow in timeout={800}>
          <Card sx={{ maxWidth: 400, width: "100%", p: 2, boxShadow: 6 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                  <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h6" align="center">
                  SISTEMA DE GENERACIÓN DE EXÁMENES
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  noValidate
                  sx={{ mt: 2, width: "100%" }}
                >
                  {submitted && error && (
                    <Fade in>
                      <Alert severity="error" sx={{ mb: 1 }}>
                        {error}
                      </Alert>
                    </Fade>
                  )}
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="user"
                    label="Usuario"
                    name="user"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    autoFocus
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <AnimatedButton
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    Validar
                  </AnimatedButton>
                 
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grow>
      </Box>
    </Fade>
  );
}
