// src/components/EditIncidentForm.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const incidentTypes = ['Fallo mecánico', 'Colisión', 'Error de software', 'Batería baja', 'Obstrucción', 'Otro'];
const incidentStatuses = ['Creado', 'En Investigación', 'Esperando Repuesto', 'Resuelto', 'Cerrado'];
const gravityOptions = [
    { value: null, label: 'Sin asignar' },
    ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))
];

function EditIncidentForm({ initialData, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState('');
    const [availableTechnicians, setAvailableTechnicians] = useState([]);
    const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);

    useEffect(() => {
        setIsLoadingTechnicians(true);
        fetch('http://localhost:3001/api/users?role=tecnico',{
            credentials: 'include'
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Error al cargar técnicos: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setAvailableTechnicians(data);
            })
            .catch(error => {
                console.error("Error fetching technicians for edit form:", error);
                setFormError(prevError => `${prevError || ''}\nError al cargar lista de técnicos: ${error.message}`.trim());
                setAvailableTechnicians([]);
            })
            .finally(() => {
                setIsLoadingTechnicians(false);
            });
    }, []);

    useEffect(() => {
        setFormData({
            ...initialData,
            gravity: initialData?.gravity === "Sin asignar" || initialData?.gravity === undefined ? null : initialData.gravity,
            assigned_technicians: (initialData.assigned_technicians || []).map(t => t.id),
            });
        setFormError('');
    }, [initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData(prevData => ({
            ...prevData,
            [name]: name === 'gravity' && value === "" ? null :
                    name === 'assigned_technicians' ? value : // ← CAMBIO
                    value
        }));
        };
    const handleInternalFormSubmit = (event) => {
        event.preventDefault();
        setFormError('');
        if (!formData.location || !formData.type || !formData.cause || !formData.status) {
            setFormError('Por favor, complete todos los campos editables requeridos (Ubicación, Tipo, Causa, Estado).');
            return;
        }
        onSubmit(formData);
    };

    const gravitySelectValue = (formData.gravity === null || formData.gravity === undefined) ? "" : formData.gravity;

    return (
        <Box component="form" onSubmit={handleInternalFormSubmit} noValidate autoComplete="off">
            <Stack spacing={2.5} sx={{ pt: 1 }}>
                {formError && (
                    <Typography color="error" variant="body2" sx={{ whiteSpace: 'pre-line' }}>{formError}</Typography>
                )}

                <TextField label="ID Incidente (BD)" name="id" value={formData.id || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField label="ID Reporte Empresa" name="company_report_id" value={formData.company_report_id || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField label="Robot Afectado" name="robot_id" value={formData.robot_id || ''} fullWidth disabled InputLabelProps={{ shrink: true }} />
                <TextField
                    label="Fecha/Hora Creación"
                    name="incident_timestamp"
                    value={formData.incident_timestamp ? new Date(formData.incident_timestamp).toLocaleString('es-CL') : ''}
                    fullWidth disabled InputLabelProps={{ shrink: true }}
                />

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
                    <Select labelId="type-edit-label" name="type" value={formData.type || ''} label="Tipo de Incidente" onChange={handleChange}>
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
                
                <FormControl fullWidth required disabled={isLoading || isLoadingTechnicians}>
                    <InputLabel id="technicians-edit-label" shrink={formData.assigned_technicians?.length > 0}>
                        Técnicos Asignados
                    </InputLabel>
                    <Select
                        labelId="technicians-edit-label"
                        name="assigned_technicians" // ← CAMBIO
                        multiple // ← CAMBIO
                        value={formData.assigned_technicians || []} // ← CAMBIO
                        label="Técnicos Asignados"
                        onChange={handleChange}
                        renderValue={(selected) =>
                        selected.map(id => {
                            const tech = availableTechnicians.find(t => t.id === id);
                            return tech ? tech.full_name : id;
                        }).join(', ')
                        }
                    >
                        {isLoadingTechnicians && <MenuItem disabled><CircularProgress size={20} sx={{ml:1, mr:1}}/>Cargando técnicos...</MenuItem>}
                        {!isLoadingTechnicians && availableTechnicians.length === 0 && <MenuItem disabled>No hay técnicos disponibles</MenuItem>}
                        {availableTechnicians.map((tech) => (
                        <MenuItem key={tech.id} value={tech.id}>
                            {tech.full_name}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>

                <FormControl fullWidth required disabled={isLoading}>
                    <InputLabel id="status-edit-label" shrink={!!formData.status}>Estado</InputLabel>
                    <Select labelId="status-edit-label" name="status" value={formData.status || ''} label="Estado" onChange={handleChange}>
                         {incidentStatuses.map((option) => ( <MenuItem key={option} value={option}>{option}</MenuItem> ))}
                    </Select>
                </FormControl>

                 <FormControl fullWidth disabled={isLoading}>
                    <InputLabel id="gravity-edit-label" shrink={formData.gravity != null}>Gravedad (1-10)</InputLabel>
                    <Select
                        labelId="gravity-edit-label"
                        name="gravity"
                        value={gravitySelectValue}
                        label="Gravedad (1-10)"
                        onChange={handleChange}
                        displayEmpty
                    >
                        {gravityOptions.map((option) => (
                            <MenuItem key={option.label} value={option.value === null ? "" : option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Comentario del Técnico"
                    name="technician_comment"
                    value={formData.technician_comment || ''}
                    onChange={handleChange}
                    fullWidth multiline rows={3}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                    helperText="Notas o detalles adicionales del técnico."
                />
                <button type="submit" style={{ display: 'none' }} aria-hidden="true"></button>
            </Stack>
        </Box>
    );
}

export default EditIncidentForm;