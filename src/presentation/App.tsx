import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./views/Home";
import About from "./views/About";
import Settings from "./views/Settings";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
