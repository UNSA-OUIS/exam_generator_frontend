import { Box } from "@mui/material";
import Sidebar from "../layouts/Sidebar";
import Navbar from "../layouts/Navbar";
import "../styles/main.css";

export default function About() {
  return (
    <div className="bgcolor">
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: "flex" }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <h1>Settings</h1>
        </Box>
      </Box>
    </div>
  );
}
