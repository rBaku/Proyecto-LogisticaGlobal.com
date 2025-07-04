import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

// Opciones de estado que el técnico puede asignar
const incidentStatuses = ['En Investigación', 'Esperando Repuesto', 'Resuelto'];
const robotFinalStatuses = ['Operativo', 'Fuera de servicio', 'En reparación', 'No cambiar'];

function TechnicianIncidentEditForm({ initialData, onSubmit, isLoading, onClose }) {
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const status = initialData?.status || '';
    setFormData({
      id: initialData?.id || '',
      status,
      technician_comment: initialData?.technician_comment || '',
      fall_back_type: initialData?.fall_back_type || 'No cambiar',
    });
    setFormError('');
    setIsReadOnly(status === 'Firmado' || status === 'Resuelto');
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    setFormError('');

    if (isReadOnly) {
      setFormError('Ya no puedes editar este incidente, comunícate con tu supervisor.');
      return;
    }

    if (!formData.status) {
      setFormError('Debe seleccionar un estado para el incidente.');
      return;
    }

    if (formData.status === 'Resuelto') {
      setShowModal(true);
    } else {
      submitData();
    }
  };

  const submitData = () => {
    const dataToSubmit = {
      status: formData.status,
      technician_comment: formData.technician_comment || null,
      fall_back_type: formData.fall_back_type || 'No cambiar',
    };
    onSubmit(formData.id, dataToSubmit);
  };

  return (
    <>
      <Box noValidate autoComplete="off">
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          )}

          {/* Estado del incidente */}
          <FormControl fullWidth required disabled={isLoading || isReadOnly}>
            <InputLabel id="incident-status-label" shrink={!!formData.status}>
              Estado del Incidente
            </InputLabel>
            <Select
              labelId="incident-status-label"
              name="status"
              value={formData.status || ''}
              label="Estado del Incidente"
              onChange={handleChange}
            >
              {incidentStatuses.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Comentario del técnico */}
          <TextField
            label="Comentario del Técnico"
            name="technician_comment"
            value={formData.technician_comment || ''}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            disabled={isLoading || isReadOnly}
            InputLabelProps={{ shrink: true }}
            helperText="Describe el trabajo realizado o el estado del incidente."
          />

          {/* Estado final del robot */}
          <FormControl fullWidth required disabled={isLoading || isReadOnly}>
            <InputLabel id="robot-state-label" shrink={!!formData.fall_back_type}>
              Estado Final del Robot
            </InputLabel>
            <Select
              labelId="robot-state-label"
              name="fall_back_type"
              value={formData.fall_back_type || 'No cambiar'}
              label="Estado Final del Robot"
              onChange={handleChange}
            >
              {robotFinalStatuses.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Modal de confirmación */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>
          ¿Desea marcar este incidente como resuelto? Ya no podrá volver a editarlo.
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="inherit">
            Cancelar3
          </Button>
          <Button onClick={() => { setShowModal(false); submitData(); }} color="primary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Botones de acciones */}
       <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || isReadOnly} variant="contained">
          Guardar Cambios
        </Button>
      </Box> 
    </>
  );
}

export default TechnicianIncidentEditForm;