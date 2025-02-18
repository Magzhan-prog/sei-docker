import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link
} from 'react-router-dom';
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
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GetItems from './TestGetItems';
import UserIdChanger from './UserIdChanger';
import UserIdDisplay from './UserIdDisplay';
import Dashboard from './TestDashboard';

const App = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => {
    setDrawerOpen(open);
  };

  const menuItems = [
    {
      text: 'Конфигуратор дашбордов',
      icon: <DashboardIcon />,
      link: '/'
    },
    {
      text: 'Дашборды',
      icon: <ListAltIcon />,
      link: '/getitems'
    },
    {
      text: 'Выбор пользователя',
      icon: <PersonAddIcon />,
      link: '/changeid'
    },
    {
      text: 'ID пользователя',
      icon: <AccountCircleIcon />,
      link: '/displayid'
    }
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
              <ListItemButton key={index} component={Link} to={item.link}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Container maxWidth={false} disableGutters sx={{pl:2, pr:2}}>
        <Box sx={{ my: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/getitems" element={<GetItems />} />
            <Route path="/changeid" element={<UserIdChanger />} />
            <Route path="/displayid" element={<UserIdDisplay />} />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
};

export default App;
