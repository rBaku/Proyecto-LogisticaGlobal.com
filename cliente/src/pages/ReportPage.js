import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

const estados = [
  { value: 'todos', label: 'Todos' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'en_progreso', label: 'En Progreso' },
];

const tipos = [
  { value: 'tipo1', label: 'Tipo 1' },
  { value: 'tipo2', label: 'Tipo 2' },
  { value: 'tipo3', label: 'Tipo 3' },
];

function ReportPage() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState('todos');
  const [tipo, setTipo] = useState('tipo1');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes manejar el envío para generar el reporte, ej:
    console.log({ fechaInicio, fechaFin, estado, tipo });
    alert('Reporte generado (simulado). Revisa consola.');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Generar Reporte de Incidentes
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
        <TextField
          label="Fecha Inicio"
          type="date"
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />

        <TextField
          label="Fecha Fin"
          type="date"
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />

        <TextField
          select
          label="Estado"
          fullWidth
          margin="normal"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          {estados.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Tipo de Incidente"
          fullWidth
          margin="normal"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {tipos.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
        >
          Generar Reporte
        </Button>
      </Box>
    </Container>
  );
}

export default ReportPage;