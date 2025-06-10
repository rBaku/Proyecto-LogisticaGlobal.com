// src/pages/AdminUsersPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Snackbar, Alert, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
      const res = await fetch(`http://localhost:3001/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar usuario');
      showSnackbar(`Usuario "${username}" eliminado correctamente.`, 'warning');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showSnackbar(err.message || 'No se pudo eliminar el usuario.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Panel de Administración - Usuarios</Typography>
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell align="center">
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
                    <TableCell colSpan={5} align="center">No hay usuarios registrados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AdminUsersPage;