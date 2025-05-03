// src/components/EditIncidentForm.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// Podrías centralizar estas listas si las usas en varios sitios
const incidentTypes = ['Fallo mecánico', 'Colisión', 'Error de software', 'Batería baja', 'Obstrucción', 'Otro'];
const incidentStatuses = ['Creado', 'En Investigación', 'Esperando Repuesto', 'Resuelto', 'Cerrado'];
const incidentGravities = ['Sin asignar', 'Baja', 'Media', 'Alta', 'Crítica'];

// El componente recibe los datos iniciales, una función onSubmit y onCancel
function EditIncidentForm({ initialData, onSubmit, onCancel, isLoading }) {
    // Estado interno para los datos del formulario
    const [formData, setFormData] = useState(initialData || {});
    const [formError, setFormError] = useState('');

    // Actualizar estado interno si cambian los datos iniciales (ej: se selecciona otro incidente)
    useEffect(() => {
        setFormData(initialData || {});
        setFormError(''); // Limpiar error al cambiar de incidente
    }, [initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleInternalSubmit = (event) => {
        event.preventDefault();
        setFormError(''); // Limpiar errores previos
        // Validación básica (podría ser más compleja)
        if (!formData.location || !formData.type || !formData.cause || !formData.status || !formData.gravity) {
            setFormError('Por favor, complete todos los campos editables.');
            return;
        }
        // Llama a la función onSubmit pasada desde el padre
        onSubmit(formData);
    };

    return (
        // Usamos Box como form para evitar anidamiento <form> si Dialog ya lo es
        <Box component="form" onSubmit={handleInternalSubmit} noValidate autoComplete="off">
            <Stack spacing={2} sx={{ pt: 1 }}> {/* Añade padding top para separar del título */}

                {formError && (
                    <Typography color="error" variant="body2">{formError}</Typography>
                )}

                {/* Campos no editables (informativos) */}
                 <TextField label="ID Incidente" name="id" value={formData.id || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                 <TextField label="Robot Afectado" name="robotId" value={formData.robotId || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                 <TextField label="Fecha/Hora Creación" name="incidentTimestamp" value={formData.incidentTimestamp ? new Date(formData.incidentTimestamp).toLocaleString('es-CL') : ''} fullWidth disabled InputLabelProps={{ shrink: true }} />

                {/* Campos Editables */}
                <TextField
                    label="Ubicación en el Almacén"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    required fullWidth
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                />

                 <FormControl fullWidth required disabled={isLoading}>
                    <InputLabel id="type-edit-label" shrink={!!formData.type}>Tipo de Incidente</InputLabel>
                    <Select
                        labelId="type-edit-label"
                        name="type"
                        value={formData.type || ''}
                        label="Tipo de Incidente"
                        onChange={handleChange}
                    >
                        {incidentTypes.map((option) => ( <MenuItem key={option} value={option}>{option}</MenuItem> ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Causa / Descripción"
                    name="cause"
                    value={formData.cause || ''}
                    onChange={handleChange}
                    required fullWidth multiline rows={3}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth required disabled={isLoading}>
                    <InputLabel id="status-edit-label" shrink={!!formData.status}>Estado</InputLabel>
                    <Select
                        labelId="status-edit-label"
                        name="status"
                        value={formData.status || ''}
                        label="Estado"
                        onChange={handleChange}
                    >
                         {incidentStatuses.map((option) => ( <MenuItem key={option} value={option}>{option}</MenuItem> ))}
                    </Select>
                </FormControl>

                 <FormControl fullWidth required disabled={isLoading}>
                    <InputLabel id="gravity-edit-label" shrink={!!formData.gravity}>Gravedad</InputLabel>
                    <Select
                        labelId="gravity-edit-label"
                        name="gravity"
                        value={formData.gravity || ''}
                        label="Gravedad"
                        onChange={handleChange}
                    >
                        {incidentGravities.map((option) => ( <MenuItem key={option} value={option}>{option}</MenuItem> ))}
                    </Select>
                </FormControl>

                {/* Botones de acción (se manejarán en DialogActions) */}
                {/* Se deja el botón submit aquí para que 'Enter' funcione en el form */}
                 <Button type="submit" sx={{ display: 'none' }}>Submit</Button>
            </Stack>
        </Box>
    );
}

export default EditIncidentForm;