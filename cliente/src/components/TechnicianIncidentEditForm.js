// src/components/TechnicianIncidentEditForm.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Opciones de estado que el técnico puede asignar
const incidentStatuses = ['En Investigación', 'Esperando Repuesto', 'Resuelto']; // Podrían ser diferentes a los del supervisor

function TechnicianIncidentEditForm({ initialData, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState('');

    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        const status = initialData?.status || '';
        setFormData({
            id: initialData?.id || '',
            status,
            technician_comment: initialData?.technician_comment || '',
            company_report_id: initialData?.company_report_id || '',
            robot_id: initialData?.robot_id || '',
            incident_timestamp: initialData?.incident_timestamp || '',
            location: initialData?.location || '',
            type: initialData?.type || '',
            cause: initialData?.cause || '',
            gravity: initialData?.gravity,
            assigned_technicians: initialData?.assigned_technicians || '',
        });
        setFormError('');
        setIsReadOnly(status === 'Firmado');
    }, [initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleInternalFormSubmit = (event) => {
        event.preventDefault();
        setFormError('');

        if (isReadOnly) {
            setFormError('Ya no puedes editar este incidente, comunícate con tu supervisor.');
            return;
        }

        if (!formData.status) {
            setFormError('Debe seleccionar un estado para el incidente.');
            return;
        }

        const dataToSubmit = {
            status: formData.status,
            technician_comment: formData.technician_comment || null,
        };

        onSubmit(formData.id, dataToSubmit);
    };
    
    const formatDateTimeForDisplay = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try {
          const date = new Date(dateTimeString);
          if (isNaN(date.getTime())) return 'Fecha inválida';
          return date.toLocaleString('es-CL');
        } catch (error) {
          return 'Fecha inválida';
        }
      };
    
    const displayGravity = (gravityValue) => gravityValue === null || gravityValue === undefined ? 'Sin asignar' : gravityValue;


    return (
        <Box component="form" onSubmit={handleInternalFormSubmit} noValidate autoComplete="off">
            <Stack spacing={2.5} sx={{ pt: 1 }}>
                {formError && (
                    <Typography color="error" variant="body2">{formError}</Typography>
                )}

                {/* Campos informativos (no editables por el técnico) */}
                <TextField label="ID Reporte Empresa" value={formData.company_report_id || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField label="Robot Afectado" value={formData.robot_id || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField
                    label="Fecha/Hora Incidente"
                    value={formatDateTimeForDisplay(formData.incident_timestamp)}
                    fullWidth disabled InputLabelProps={{ shrink: true }}
                />
                <TextField label="Ubicación" value={formData.location || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField label="Tipo" value={formData.type || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField label="Causa Inicial" value={formData.cause || ''} fullWidth multiline disabled InputLabelProps={{ shrink: true }} />
                <TextField label="Gravedad Asignada" value={displayGravity(formData.gravity)} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField label="Técnico Asignado (ID)" value={formData.assigned_technicians || 'N/A'} fullWidth disabled InputLabelProps={{ shrink: true }} />


                {/* Campos Editables por el Técnico */}
                <FormControl fullWidth required disabled={isLoading || isReadOnly}>
                    <InputLabel id="technician-status-edit-label" shrink={!!formData.status}>Actualizar Estado</InputLabel>
                    <Select
                        labelId="technician-status-edit-label"
                        name="status"
                        value={formData.status || ''}
                        label="Actualizar Estado"
                        onChange={handleChange}
                    >
                         {incidentStatuses.map((option) => ( <MenuItem key={option} value={option}>{option}</MenuItem> ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Comentario del Técnico"
                    name="technician_comment"
                    value={formData.technician_comment || ''}
                    onChange={handleChange}
                    fullWidth multiline rows={4}
                    disabled={isLoading || isReadOnly}
                    InputLabelProps={{ shrink: true }}
                    helperText="Añada o actualice sus notas sobre el trabajo realizado o el estado actual."
                />
                {/* Botón de submit oculto para que "Enter" funcione en el formulario */}
                <button type="submit" style={{ display: 'none' }} aria-hidden="true"></button>
            </Stack>
        </Box>
    );
}

export default TechnicianIncidentEditForm;