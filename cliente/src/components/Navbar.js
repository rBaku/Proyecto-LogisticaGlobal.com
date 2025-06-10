// src/components/Navbar.js
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Usar alias para evitar conflicto
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider'; // Sigue siendo útil para el Drawer
import CssBaseline from '@mui/material/CssBaseline';

const drawerWidth = 240;

// Elementos de navegación (como los tenías)
const navItems = [
  { text: 'Inicio', path: '/' },
  { text: 'Registrar Incidente', path: '/crear-incidente' },
  { text: 'Ver Incidentes', path: '/incidentes' },
  { text: 'Estado Robots', path: '/robots-estado' },
  { text: 'Vista Técnico', path: '/tecnico/incidentes' },
  { text: 'Login', path: '/login' },
];

function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = async () => {
  try {
    await fetch('http://localhost:3001/api/login/logout', {
      method: 'POST',
      credentials: 'include', // Necesario para enviar la cookie
    });

    navigate('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  // Contenido del Drawer (menú lateral para móviles)
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        LogísticaGlobal
      </Typography>
      <Divider /> {/* El Divider aquí es para el menú lateral y está bien */}
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{ textAlign: 'center' }}
            >
              {/* ListItemText por defecto no usa mayúsculas */}
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* 1. Navbar fijo al scrollear */}
      {/* AppBar ahora usa position="sticky" */}
      {/* Se añade un zIndex para asegurar que esté por encima del Drawer si se superponen */}
      <AppBar component="nav" position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }} // Oculto en pantallas 'sm' y mayores
          >
            <MenuIcon />
          </IconButton>

          {/* Título (visible en pantallas grandes) */}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', sm: 'block' },
              whiteSpace: 'nowrap', // Evita que el título se divida en múltiples líneas y empuje el contenido
              overflow: 'hidden',   // Oculta el texto que no quepa
              textOverflow: 'ellipsis' // Añade puntos suspensivos si el texto es muy largo
            }}
          >
            Incidencias LogisticaGlobal.com
          </Typography>

          {/* Links de Navegación (solo visibles en pantallas grandes) */}
          {/* Se cambia display a 'flex' para sm y se añade alignItems para alinear verticalmente los botones y separadores */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            {navItems.map((item, index) => (
              // Usamos React.Fragment para agrupar el botón y su separador condicional
              <React.Fragment key={item.text}>
                <Button
                  component={RouterLink}
                  to={item.path}
                  // 2. Asegurar que no haya transformación a mayúsculas
                  sx={{ 
                    color: '#fff', 
                    textTransform: 'none', // Clave para evitar mayúsculas
                    whiteSpace: 'nowrap', // Evita que el texto del botón se divida
                  }}
                >
                  {item.text}
                </Button>
                {/* 3. Separador vertical sutil entre botones */}
                {/* Solo se añade si NO es el último item del array */}
                {index < navItems.length - 1 && (
                  <Box
                    component="span" // Se renderiza como <span>
                    sx={{
                      display: 'inline-block', 
                      width: '1px',            
                      height: '16px',          
                      backgroundColor: 'rgba(255, 255, 255, 0.3)', 
                      mx: 1,                   
                      // verticalAlign: 'middle', // No es tan necesario si el contenedor padre (Box de navItems) usa alignItems: 'center'
                    }}
                  />
                )}
              </React.Fragment>
            ))}
            <Button
              onClick={handleLogout}
              sx={{
                color: '#fff',
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Cerrar sesión
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer (Menú Lateral) */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor performance en móviles.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' }, // Visible en 'xs', oculto desde 'sm'
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
}

export default Navbar;
