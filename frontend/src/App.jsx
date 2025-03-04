import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GetItems from "./TestGetItems";
import UserIdChanger from "./components/UserIdChanger";
import UserIdDisplay from "./components/UserIdDisplay";
import Dashboard from "./TestDashboard";
import FolderPage from "./FolderPage";
import EditPage from "./EditPage";
import { BACKEND_API } from "./constants/constants";

const App = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserFolders = async () => {
      try {
        const response = await fetch(BACKEND_API + "get-user-folders", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Ошибка при получении данных");
        }
        const result = await response.json();
        setFolders(result);
      } catch (error) {
        console.error("Ошибка получения данных:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserFolders();
  }, []);

  const toggleDrawer = (open) => {
    setDrawerOpen(open);
  };

  const menuItems = [
    {
      text: "Конфигуратор дашбордов",
      icon: <DashboardIcon />,
      link: "/",
    },
    {
      text: "Дашборды",
      icon: <ListAltIcon />,
      link: "/getitems",
    },
    {
      text: "Выбор пользователя",
      icon: <PersonAddIcon />,
      link: "/changeid",
    },
    {
      text: "ID пользователя",
      icon: <AccountCircleIcon />,
      link: "/displayid",
    },
  ];

  return (
    <Router>
      <CssBaseline />
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Социально-экономические показатели
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => toggleDrawer(false)}
          onKeyDown={() => toggleDrawer(false)}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Меню</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <ListItemButton component={Link} to={item.link}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
                {/* Если это пункт «Дашборды», добавляем вложенные ссылки из папок */}
                {item.text === "Дашборды" && folders.length > 0 && (
                  <List component="div" disablePadding>
                    {folders.map((folder) => (
                      <ListItemButton
                        key={folder.id}
                        component={Link}
                        to={`/getitems/${folder.id}`}
                        sx={{ pl: 4 }}
                      >
                        <ListItemText primary={folder.name} />
                      </ListItemButton>
                    ))}
                  </List>
                )}
                {item.text === "Дашборды" && (
                  <ListItemButton
                    key={0}
                    component={Link}
                    to={`/getitems/edit-folder`}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary="Редактор папок" />
                  </ListItemButton>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      <Container maxWidth={false} disableGutters sx={{ pl: 2, pr: 2 }}>
        <Box sx={{ my: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard folders={folders} />} />
            <Route path="/getitems" element={<GetItems />} />
            <Route
              path="/getitems/:folderId"
              element={<FolderPage folders={folders} loading={loading} />}
            />
            <Route
              path="/getitems/edit-folder"
              element={<EditPage folders={folders} setFolders={setFolders} />}
            />
            <Route path="/changeid" element={<UserIdChanger />} />
            <Route path="/displayid" element={<UserIdDisplay />} />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
};

export default App;
