import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import TreeNavbar from "./TreeNavbar";
import "../styles/main.css";

const TreeLayout: React.FC = () => {
    return (
        <div className="bgcolor">
            <TreeNavbar />
            <Box height={70} />
            <Box sx={{ display: "flex" }}>
                <Box component="main" sx={{ flexGrow: 1 }}>
                    <Outlet />
                </Box>
            </Box>
        </div>
    );
};

export default TreeLayout;
