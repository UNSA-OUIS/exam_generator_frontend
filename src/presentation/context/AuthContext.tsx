import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import axios from '../../infrastructure/lib/axiosClient';

type AuthContextProps = {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
};

//const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  error: null,
  login: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulación de API (harcodeado)
    /* if (username === "admin" && password === "1234") {
      setIsAuthenticated(true);
      setError(null);
      return true;
    } else {
      setIsAuthenticated(false);
      setError("Ud. no tiene permitido acceder");
      return false;
    } */
   
    try {
      // 1. Obtener CSRF Cookie
      await axios.get('/sanctum/csrf-cookie');

      // 2. Hacer login
      await axios.post('/login', {
        email: username, // Usa "username" si tu backend lo espera así
        password,
      });

      setIsAuthenticated(true);
      setError(null);

      return true;
    } catch (err: any) {
      console.error('Error al iniciar sesión', err);
      setIsAuthenticated(false);
      if (err.response?.status === 422) {
        setError('Campos inválidos');
      } else if (err.response?.status === 401) {
        setError('Credenciales incorrectas');
      } else {
        setError('Error al conectar con el servidor');
      }
      return false;
    }
  };

  /* const logout = () => {
    setIsAuthenticated(false);
  }; */
  const logout = async (): Promise<void> => {
    try {
      await axios.post('/logout');
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

/* export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}; */
