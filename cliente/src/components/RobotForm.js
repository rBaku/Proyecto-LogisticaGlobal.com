// src/components/RobotForm.js
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// El componente recibe una función onSubmit y onCancel
function RobotForm({ onSubmit, onCancel, isLoading, initialData = {} }) {
    const [id, setId] = useState(initialData.id || '');
    const [name, setName] = useState(initialData.name || '');
    const [is_operational, setIsOperational] = useState(initialData.is_operational !== undefined ? initialData.is_operational : true);
    const [formError, setFormError] = useState('');

    const handleInternalFormSubmit = (event) => {
        event.preventDefault();
        setFormError('');
        if (!id.trim() || !name.trim()) {
            setFormError('El ID y el Nombre del Robot son obligatorios.');
            return;
        }
        // Llama a la función onSubmit pasada desde el padre
        onSubmit({ id: id.trim(), name: name.trim(), is_operational });
    };

    return (
        <Box component="form" onSubmit={handleInternalFormSubmit} noValidate autoComplete="off">
            <Stack spacing={2.5} sx={{ pt: 1 }}>

                {formError && (
                    <Typography color="error" variant="body2">{formError}</Typography>
                )}

                <TextField
                    label="ID del Robot"
                    name="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required fullWidth
                    disabled={isLoading || !!initialData.id} // Deshabilitar ID si es edición (no aplica ahora)
                    helperText="Ej: RBT-006"
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="Nombre del Robot"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required fullWidth
                    disabled={isLoading}
                    helperText="Ej: Centurion Zeta (Almacén D)"
                    InputLabelProps={{ shrink: true }}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={is_operational}
                            onChange={(e) => setIsOperational(e.target.checked)}
                            name="is_operational"
                            color="primary"
                            disabled={isLoading}
                        />
                    }
                    label="¿Está Operativo?"
                />
                
                {/* Botones de acción se manejarán en DialogActions del modal padre */}
                {/* Se deja el botón submit aquí para que 'Enter' funcione en el form */}
                 <Button type="submit" sx={{ display: 'none' }}>Submit</Button>
            </Stack>
        </Box>
    );
}

export default RobotForm;