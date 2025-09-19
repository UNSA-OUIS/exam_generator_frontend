import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Login from "./Login";
import Home from "./views/Home";
import About from "./views/About";
import Settings from "./views/Settings";
import Level from "./views/Level";
import Modality from "./views/Modality";
import Block from "./views/Block";
import Matrix from "./views/Matrix";
import Confinement from "./views/Confinement";
import RequirementForm from "./pages/confinements/requirements/Form";
import RequirementsList from "./pages/confinements/requirements/List";
import ConfinementTextsList from "./pages/confinements/texts/List";
import ConfinementTextForm from "./pages/confinements/texts/Form";
import Collaborator from "./pages/collaborators/List";
import MatrixDetailsList from "./pages/matrices/details/List";
import MatrixDetailForm from "./pages/matrices/details/Form";


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
            <Route path="/modality" element={<Modality />} />
            <Route path="/block" element={<Block />} />
            <Route path="/matrices" element={<Matrix />} />
            <Route path="/confinements" element={<Confinement />} />
            <Route
              path="/confinements/:confinementId/requirements"
              element={<RequirementsList />}
            />
            <Route
              path="/confinements/:confinementId/requirements/new"
              element={<RequirementForm />}
            />
          <Route path="/confinements/:id/texts" element={<ConfinementTextsList />} />
          <Route path="/confinements/:id/texts/create" element={<ConfinementTextForm mode="create" />} />
          <Route path="/confinements/:id/texts/edit/:textId" element={<ConfinementTextForm mode="edit" />} />
          <Route path="matrices/:matrixId/details" element={<MatrixDetailsList />} />
    <Route path="matrices/:matrixId/details/new" element={<MatrixDetailForm />} />
          <Route path="/collaborators" element={<Collaborator />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;