import { Box } from "@mui/material";
import Sidebar from "../layouts/Sidebar";
import Navbar from "../layouts/Navbar";
import "../styles/main.css";
import List from "../pages/settings/List";

export default function About() {
  return (
    <div className="bgcolor">
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: "flex" }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <List />
        </Box>
      </Box>
    </div>
  );
}
