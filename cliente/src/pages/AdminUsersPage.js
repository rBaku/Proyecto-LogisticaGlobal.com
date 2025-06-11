// src/pages/AdminUsersPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Snackbar, Alert, CircularProgress, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user', full_name: '' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Error al obtener usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showSnackbar(err.message || 'Error al cargar usuarios', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteUser = async (userId, username) => {
    const confirm = window.confirm(`¿Eliminar al usuario "${username}"?`);
    if (!confirm) return;
    try {
      const res = await fetch(`http://localhost:3001/api/users/${userId}`, { 
        method: 'DELETE',
        credentials: 'include', 
    });
      if (!res.ok) throw new Error('Error al eliminar usuario');
      showSnackbar(`Usuario "${username}" eliminado correctamente.`, 'warning');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showSnackbar(err.message || 'No se pudo eliminar el usuario.', 'error');
    }
  };

  const handleOpenDialog = (user = null) => {
    setEditingUser(user);
    setForm(user ? { ...user, password: '' } : { username: '', email: '', password: '', role: 'user', full_name: '' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `http://localhost:3001/api/users/${editingUser.id}` : 'http://localhost:3001/api/users';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Error al guardar el usuario');
      showSnackbar(editingUser ? 'Usuario actualizado.' : 'Usuario creado.');
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error(err);
      showSnackbar(err.message || 'Error al guardar el usuario', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Panel de Administración - Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Usuario
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre completo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length ? (
                  users.map(user => (
                    <TableRow hover key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar Usuario">
                          <IconButton color="primary" onClick={() => handleOpenDialog(user)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Usuario">
                          <IconButton color="error" onClick={() => handleDeleteUser(user.id, user.username)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No hay usuarios registrados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Username" name="username" value={form.username} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Nombre completo" name="full_name" value={form.full_name} onChange={handleChange}/>
          <TextField fullWidth margin="dense" label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Rol" name="role" value={form.role} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AdminUsersPage;