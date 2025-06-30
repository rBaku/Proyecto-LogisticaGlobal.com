import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// El componente recibe una función onSubmit y onCancel
function RobotForm({ onSubmit, onCancel, isLoading, initialData = {} }) {
  const [id, setId] = useState(initialData.id || '');
  const [name, setName] = useState(initialData.name || '');
  const [state, setState] = useState(initialData.state || 'Operativo');
  const [formError, setFormError] = useState('');

  const handleInternalFormSubmit = (event) => {
    console.log("Formulario enviado", event)
    event.preventDefault();
    setFormError('');
    if (!id.trim() || !name.trim()) {
      setFormError('El ID y el Nombre del Robot son obligatorios.');
      return;
    }
    // Llama a la función onSubmit pasada desde el padre
    onSubmit({ id: id.trim(), name: name.trim(), state });
  };

  return (
    <Box component="form" onSubmit={handleInternalFormSubmit} noValidate autoComplete="off">
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {formError && (
          <Typography color="error" variant="body2">
            {formError}
          </Typography>
        )}

        <TextField
          label="ID del Robot"
          name="id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          fullWidth
          disabled={isLoading || !!initialData.id} // Deshabilitar ID si es edición
          helperText="Ej: RBT-006"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Nombre del Robot"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          disabled={isLoading}
          helperText="Ej: Centurion Zeta (Almacén D)"
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth disabled={isLoading}>
          <InputLabel id="robot-state-label">Estado Operativo</InputLabel>
          <Select
            labelId="robot-state-label"
            name="state"
            value={state}
            label="Estado Operativo"
            onChange={(e) => setState(e.target.value)}
          >
            <MenuItem value="Operativo">Operativo</MenuItem>
            <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
            <MenuItem value="En reparación">En reparación</MenuItem>
          </Select>
        </FormControl>

        {/* Botones de acción se manejarán en DialogActions del modal padre */}
        <Button type="submit" sx={{ display: 'none' }}>
          Submit
        </Button>
      </Stack>
    </Box>
  );
}

export default RobotForm;