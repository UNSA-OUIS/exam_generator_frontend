import { styled, useTheme } from "@mui/material/styles";
import type { Theme, CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import SchoolIcon from '@mui/icons-material/School';
import TableChartIcon from '@mui/icons-material/TableChart';
import AssignmentAddIcon from '@mui/icons-material/AssignmentAdd';
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import FormatListNumberedSharpIcon from '@mui/icons-material/FormatListNumberedSharp';
import SpellcheckSharpIcon from '@mui/icons-material/SpellcheckSharp';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import { useState } from "react";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

export default function Sidebar() {
  const theme = useTheme();
  //const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  const open = useAppStore((state) => state.dopen);
  const [openConfig, setOpenConfig] = useState(false);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Box height={30} />
      <Drawer 
        variant="permanent" 
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: '#2E2E2E', 
            color: '#ffffff',
            '& .MuiListItemIcon-root': {
              color: '#ffffff'  // Esto hace que los iconos sean blancos
            }
          }
        }}
      >
        <DrawerHeader>
          <IconButton sx={{ color: '#fff' }}>  {/* Esto hace que el icono del header sea blanco */}
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem
            disablePadding
            sx={{ display: "block" }}
            onClick={() => navigate("/home")}
          >
            <ListItemButton
              sx={[
                {
                  minHeight: 48,
                  px: 2.5,
                },
                open
                  ? {
                      justifyContent: "initial",
                    }
                  : {
                      justifyContent: "center",
                    },
              ]}
            >
              <ListItemIcon
                sx={[
                  {
                    minWidth: 0,
                    justifyContent: "center",
                  },
                  open
                    ? {
                        mr: 3,
                      }
                    : {
                        mr: "auto",
                      },
                ]}
              >
                <HomeIcon />
              </ListItemIcon>
              <ListItemText
                primary="Home"
                sx={[
                  open
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 0,
                      },
                ]}
              />
            </ListItemButton>
          </ListItem>
          {/* Configuration item with submenu */}
          <ListItem
            disablePadding
            sx={{ display: "block" }}
            onClick={() => navigate("/confinements")}
          >
            <ListItemButton
              sx={[
                {
                  minHeight: 48,
                  px: 2.5,
                },
                open
                  ? {
                      justifyContent: "initial",
                    }
                  : {
                      justifyContent: "center",
                    },
              ]}
            >
              <ListItemIcon
                sx={[
                  {
                    minWidth: 0,
                    justifyContent: "center",
                  },
                  open
                    ? {
                        mr: 3,
                      }
                    : {
                        mr: "auto",
                      },
                ]}
              >
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText
                primary="Internamientos"
                sx={[
                  open
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 0,
                      },
                ]}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenConfig(!openConfig)}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configuración" sx={{ opacity: open ? 1 : 0 }} />
              {openConfig ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={openConfig} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem disablePadding>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate("/process")}>
                  <ListItemIcon>
                    <SpellcheckSharpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Modalidades" />
                </ListItemButton>
              </ListItem>
               <ListItem disablePadding>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate("/matrices")}>
                  <ListItemIcon>
                    <TableChartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Matrices" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate("/level")}>
                  <ListItemIcon>
                    <FormatListNumberedSharpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Niveles" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton sx={{ pl: 4 }} onClick={() => navigate("/block")}>
                  <ListItemIcon>
                    <AssignmentAddIcon />
                  </ListItemIcon>
                  <ListItemText primary="Bloques" />
                </ListItemButton>
              </ListItem>
             
              
            </List>
          </Collapse>
          
        </List>
      </Drawer>
    </Box>
  );
}
