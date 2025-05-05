// src/components/IncidentForm.js
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack'; // Para espaciar elementos fácilmente
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress'; // Indicador de carga

// Los tipos de incidente no cambian
const incidentTypes = [
    // Quitamos la opción vacía, el Select de MUI maneja el placeholder
    'Fallo mecánico',
    'Colisión',
    'Error de software',
    'Batería baja',
    'Obstrucción',
    'Otro',
];

// Valores por defecto definidos por el sistema
const defaultGravity = 'Sin asignar';
const defaultStatus = 'Creado';


// Recibe onResult en lugar de onSuccess
function IncidentForm({ onResult }) {
  const [robot_id, setRobotId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState(''); // Tipo de incidente
  const [cause, setCause] = useState('');
  const [formError, setFormError] = useState(null); // Error específico del formulario
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null); // Limpia errores previos

    // La validación básica de MUI (required) ayuda, pero puedes añadir más aquí si es necesario

    const incidentData = {
      robot_id,
      incident_timestamp: new Date(dateTime).toISOString(),
      location,
      type,
      cause,
      gravity: defaultGravity,
      status: defaultStatus,
    };

    console.log('Enviando datos al backend (simulado):', incidentData);

    // --- Simulación de llamada al Backend ---
    try {
      const response = await fetch('http://localhost:3001/api/incidentes', { // ajusta la URL si es necesario
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    
      const newIncident = await response.json();
    
      if (onResult) {
        onResult(true, newIncident);
      }
    } catch (err) {
      console.error('Error al crear incidente:', err);
      const errorMessage = err.message || 'Ocurrió un error al registrar el incidente.';
      setFormError(errorMessage); // Muestra error en el formulario
      // Llama a onResult indicando fallo y pasando el mensaje de error
      if (onResult) {
        onResult(false, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
    // --- Fin de la llamada al Backend ---
  };

  return (
    // Usamos Box como formulario y Stack para organizar los campos
    <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
      <Stack spacing={3}> {/* Espaciado entre elementos del Stack */}

        {/* Muestra el error del formulario */}
        {formError && (
            <Typography color="error" variant="body2">{formError}</Typography>
        )}

        <TextField
          label="Identificador del Robot Afectado"
          id="robot_id"
          value={robot_id}
          onChange={(e) => setRobotId(e.target.value)}
          required // Validación básica de MUI/HTML5
          fullWidth // Ocupa todo el ancho
          helperText="Registrar un incidente por cada robot afectado."
          disabled={isLoading}
        />

        <TextField
          label="Fecha y Hora del Incidente"
          type="datetime-local"
          id="dateTime"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
          fullWidth
          InputLabelProps={{
            shrink: true, // Importante para que el label no tape el input datetime-local
          }}
          disabled={isLoading}
        />

        <TextField
          label="Ubicación en el Almacén (Sector/Pasillo)"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          fullWidth
          disabled={isLoading}
        />

        {/* Select para el tipo de incidente */}
        <FormControl fullWidth required disabled={isLoading}>
          <InputLabel id="type-select-label">Tipo de Incidente</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            value={type}
            label="Tipo de Incidente" // El label debe coincidir con InputLabel
            onChange={(e) => setType(e.target.value)}
          >
            {/* No necesitas un MenuItem vacío, Select lo maneja */}
            {incidentTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Causa / Descripción Inicial"
          id="cause"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          required
          fullWidth
          multiline // Para que sea un textarea
          rows={4}    // Altura inicial
          disabled={isLoading}
        />

        {/* Campos informativos deshabilitados */}
         <TextField
            label="Gravedad"
            id="gravity"
            value={defaultGravity}
            fullWidth
            disabled // Deshabilitado visualmente
            InputProps={{
                readOnly: true, // También previene edición si no estuviera disabled
            }}
         />
         <TextField
            label="Estado Inicial"
            id="status"
            value={defaultStatus}
            fullWidth
            disabled
            InputProps={{
                readOnly: true,
            }}
         />

        {/* Botón de envío con indicador de carga */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit"/> : null}
            >
                {isLoading ? 'Registrando...' : 'Registrar Incidente'}
            </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default IncidentForm;