import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Asegúrate de que la ruta sea correcta
import MainLayout from "./layouts/MainLayout"; // Asegúrate de que la ruta sea correcta
import Login from "./Login";
import Home from "./views/Home";
import About from "./views/About";
import Settings from "./views/Settings";
import { Level } from './views/Level'; // Asegúrate de que la ruta sea correcta 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/exam_generator">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/level" element={<Level />} />   
          </Route>          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
