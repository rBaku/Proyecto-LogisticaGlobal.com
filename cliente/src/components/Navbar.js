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
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline'; // Ayuda con estilos base y consistencia

// Ancho del Drawer (menú lateral) cuando está abierto
const drawerWidth = 240;

// Elementos de navegación (puedes añadir más)
const navItems = [
  { text: 'Inicio', path: '/' },
  { text: 'Registrar Incidente', path: '/crear-incidente' },
  { text: 'Ver Incidentes', path: '/incidentes' },
  // Agrega aquí futuros enlaces:
  // { text: 'Ver Incidentes', path: '/incidentes' },
  // { text: 'Reportes', path: '/reportes' },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  //const navigate = useNavigate(); // Para navegar programáticamente si es necesario

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  // Contenido del Drawer (menú lateral para móviles)
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        LogísticaGlobal
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {/* Usamos RouterLink para la navegación */}
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{ textAlign: 'center' }}
            >
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline /> {/* Normaliza estilos y habilita dark mode si se configura */}
      <AppBar component="nav" position="static"> {/* O position="fixed" si la quieres fija arriba */}
        <Toolbar>
          {/* Botón de Menú Hamburguesa (solo visible en móviles) */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }} // Oculto en pantallas 'sm' y mayores
          >
            <MenuIcon />
          </IconButton>

          {/* Título (visible en pantallas grandes, centrado o a la izquierda) */}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} // Oculto en 'xs', visible desde 'sm'
          >
            LogísticaGlobal Incidencias
          </Typography>

          {/* Links de Navegación (solo visibles en pantallas grandes) */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}> {/* Oculto en 'xs', visible desde 'sm' */}
            {navItems.map((item) => (
              <Button
                key={item.text}
                component={RouterLink} // Usar RouterLink de react-router-dom
                to={item.path}         // La ruta destino
                sx={{ color: '#fff' }} // Estilo del botón
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer (Menú Lateral) */}
      <Box component="nav">
        <Drawer
          variant="temporary" // Se muestra temporalmente
          open={mobileOpen}
          onClose={handleDrawerToggle} // Se cierra al hacer clic fuera o en un item
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