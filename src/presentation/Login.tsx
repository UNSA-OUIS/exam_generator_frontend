import React, { useState, useEffect } from "react";
import bgimage from "../../public/img_bg.jpeg";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Fade,
  Alert,
  Grow,
  CircularProgress,
  Checkbox,
  FormControlLabel,
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
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ user?: string; pass?: string }>({});

  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe");
    if (remembered === "true") {
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const errors: { user?: string; pass?: string } = {};
    if (!user.trim()) {
      errors.user = "El usuario es requerido";
    }
    if (!pass) {
      errors.pass = "La contraseña es requerida";
    } else if (pass.length < 6) {
      errors.pass = "La contraseña debe tener al menos 6 caracteres";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setSubmitted(true);
    try {
      const success = await login(user.trim(), pass);
      if (success) {
        localStorage.setItem("rememberMe", rememberMe.toString());
        navigate("/home");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () =>
    setShowPassword((prev) => !prev);

  const clearError = () => {
    setSubmitted(false);
  };

  return (
    <Fade in timeout={1000}>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: `url(${bgimage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <CssBaseline />
        <Grow in timeout={800}>
          <Card sx={{ maxWidth: 400, width: "100%", px:2, py:3, boxShadow: 20, borderRadius: 3 }}>
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
                      <Alert severity="error" sx={{ mb: 1 }} onClose={clearError}>
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
                    error={Boolean(fieldErrors.user)}
                    helperText={fieldErrors.user}
                    autoFocus
                    disabled={loading}
                    inputProps={{ "aria-label": "usuario" }}
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
                    error={Boolean(fieldErrors.pass)}
                    helperText={fieldErrors.pass}
                    disabled={loading}
                    inputProps={{ "aria-label": "contraseña" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowPassword}
                            edge="end"
                            disabled={loading}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    disabled={loading}
                    sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Validar"}
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
