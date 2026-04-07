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
import RequirementCascade from "./pages/confinements/requirements/FormNew";
import RequirementList from "./pages/confinements/requirements/RequirementCascade";
import RequirementsList from "./pages/confinements/requirements/List";
import ConfinementTextsList from "./pages/confinements/texts/List";
import ConfinementTextForm from "./pages/confinements/texts/Form";
import Collaborator from "./pages/collaborators/List";
import MatrixDetailsList from "./pages/matrices/details/List";
import MatrixDetailForm from "./pages/matrices/details/Form";
import Exam from "./views/Exam";
import Bank from "./views/Bank";
import QuestionImport from "./views/QuestionImport";
import TreePage from "./pages/confinements/requirements/TreePage";
import TreeCreator from "./pages/confinements/requirements/TreeCreator";
import ExamRequirementsList from "./pages/exams/requirements/List";
import ExamRequirementForm from "./pages/exams/requirements/Form";
import TreeLayout from "./layouts/TreeLayout";
import TreeView from "./pages/confinements/requirements/TreeView";
import Sorter from "./pages/exams/Sorter";

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
                        <Route path="/confinements/:confinementId/requirements" element={<RequirementsList />} />
                        <Route path="/confinements/:confinementId/requirements/tree" element={<TreePage />} />
                        <Route path="/confinements/:confinementId/requirements/tree-creator" element={<TreeCreator />} /> {/* Nueva ruta */}
                        <Route path="/confinements/:confinementId/requirements/new" element={<RequirementForm />} />
                        <Route path="/confinements/:confinementId/requirements/cascada" element={<RequirementCascade />} />
                        <Route path="/confinements/:confinementId/requirements/lista" element={<RequirementList />} />
                        <Route path="/confinements/:confinementId/requirements/edit/:id" element={<RequirementForm />} />
                        <Route path="/confinements/:id/texts" element={<ConfinementTextsList />} />
                        <Route path="/confinements/:id/texts/create" element={<ConfinementTextForm mode="create" />} />
                        <Route path="/confinements/:id/texts/edit/:textId" element={<ConfinementTextForm mode="edit" />} />
                        <Route path="matrices/:matrixId/details" element={<MatrixDetailsList />} />
                        <Route path="matrices/:matrixId/details/new" element={<MatrixDetailForm />} />
                        <Route path="/exams/:examId/requirements" element={<ExamRequirementsList />} />
                        <Route path="/exams/:examId/requirements/new" element={<ExamRequirementForm />} />
                        <Route path="/collaborators" element={<Collaborator />} />
                        <Route path="/exams" element={<Exam />} />
                        <Route path="/bank" element={<Bank />} />
                        <Route path="/question-import" element={<QuestionImport />} />
                        <Route path="/exams/sorter/:examId" element={<Sorter />} />

                    </Route>
                    <Route element={<TreeLayout />}>
                        <Route path="/confinements/:confinementId/requirements/tree-view" element={<TreeView />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
