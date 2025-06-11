import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';

// --- Datos Simulados eliminados ---

const incidentTypes = ['Fallo mecánico', 'Colisión', 'Error de software', 'Batería baja', 'Obstrucción', 'Otro'];
const defaultStatus = 'Creado';

function IncidentForm({ onResult }) {
  const [company_report_id, setCompanyReportId] = useState('');
  const [selectedRobots, setSelectedRobots] = useState([]);
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [cause, setCause] = useState('');
  const [assigned_technician_id, setAssignedTechnicianId] = useState('');

  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRobots, setIsLoadingRobots] = useState(false); // Estado de carga para robots
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false); // Estado de carga para técnicos
  const [availableRobots, setAvailableRobots] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);

  useEffect(() => {
    // Fetch para robots
    setIsLoadingRobots(true);
    fetch('http://localhost:3001/api/robots', {
      credentials: 'include'
    }) // <-- URL actualizada
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar robots: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setAvailableRobots(data.filter(r => r.is_operational)); // Solo robots operativos
      })
      .catch(error => {
        console.error("Error fetching robots:", error);
        setFormError(prevError => `${prevError || ''}\nError al cargar lista de robots: ${error.message}`);
        setAvailableRobots([]); // Limpiar en caso de error
      })
      .finally(() => {
        setIsLoadingRobots(false);
      });

    // Fetch para técnicos
    setIsLoadingTechnicians(true);
    fetch('http://localhost:3001/api/users?role=tecnico', {
      credentials: 'include',
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
        console.error("Error fetching technicians:", error);
        setFormError(prevError => `${prevError || ''}\nError al cargar lista de técnicos: ${error.message}`);
        setAvailableTechnicians([]); // Limpiar en caso de error
      })
      .finally(() => {
        setIsLoadingTechnicians(false);
      });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);

    if (!company_report_id.trim()) {
      setFormError('El ID de Reporte de Empresa es obligatorio.');
      setIsLoading(false);
      return;
    }
    if (selectedRobots.length === 0) {
      setFormError('Debe seleccionar al menos un robot afectado.');
      setIsLoading(false);
      return;
    }
    if (!assigned_technician_id) {
      setFormError('Debe asignar un técnico al incidente.');
      setIsLoading(false);
      return;
    }
    if (!dateTime) { // Validar que la fecha no esté vacía
        setFormError('La Fecha y Hora del Incidente es obligatoria.');
        setIsLoading(false);
        return;
    }


    const createIncidentPromises = selectedRobots.map(robot => {
      const incidentData = {
        company_report_id: company_report_id.trim(),
        robot_id: robot.id,
        incident_timestamp: new Date(dateTime).toISOString(),
        location,
        type,
        cause,
        assigned_technician_id,
        gravity: null, // Gravedad es null al crear
      };
      console.log('Enviando datos para robot:', robot.id, incidentData);

      return fetch('http://localhost:3001/api/incidentes', { // <-- URL actualizada
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
        credentials: 'include',
      }).then(async response => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
          throw new Error(`Robot ${robot.name}: ${errorData.message || `Error ${response.status}`}`);
        }
        return response.json();
      });
    });

    try {
      const results = await Promise.allSettled(createIncidentPromises);
      const successfulCreations = [];
      const failedCreations = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulCreations.push(result.value);
        } else {
          failedCreations.push({ robotName: selectedRobots[index].name, error: result.reason.message });
        }
      });

      if (failedCreations.length > 0) {
        const errorMessages = failedCreations.map(f => `  - ${f.robotName}: ${f.error}`).join('\n');
        const mainErrorMessage = `Algunos incidentes no pudieron registrarse:\n${errorMessages}`;
        setFormError(mainErrorMessage);
        if (onResult) {
          onResult(false, { successfulCreations, failedCreations, message: mainErrorMessage });
        }
      } else {
        if (onResult) {
          onResult(true, successfulCreations);
           // Limpiar formulario tras éxito
           setCompanyReportId('');
           setSelectedRobots([]);
           setDateTime('');
           setLocation('');
           setType('');
           setCause('');
           setAssignedTechnicianId('');
        }
      }
    } catch (err) {
      console.error('Error general al procesar la creación de incidentes:', err);
      const errorMessage = 'Ocurrió un error inesperado al registrar los incidentes.';
      setFormError(errorMessage);
      if (onResult) {
        onResult(false, { message: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
      <Stack spacing={3}>
        {formError && (
            <Typography color="error" variant="body2" sx={{ whiteSpace: 'pre-line' }}>{formError}</Typography>
        )}

        <TextField
          label="ID Reporte Empresa"
          id="company_report_id"
          value={company_report_id}
          onChange={(e) => setCompanyReportId(e.target.value)}
          required fullWidth
          helperText="ID interno para agrupar este evento/reporte."
          disabled={isLoading}
        />

        <Autocomplete
          multiple
          id="robots-autocomplete"
          options={availableRobots}
          loading={isLoadingRobots}
          getOptionLabel={(option) => `${option.name} ${option.is_operational ? '' : '(No Operativo)'}`}
          value={selectedRobots}
          onChange={(event, newValue) => {
            setSelectedRobots(newValue);
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Robots Afectados"
              placeholder="Seleccione robots"
              required
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {isLoadingRobots ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
            ))
          }
          disabled={isLoading || isLoadingRobots}
        />
        <Typography variant="caption" color="textSecondary">
            {selectedRobots.length > 0 ? `Se registrará un incidente individual para cada robot.` : "Seleccione los robots involucrados."}
        </Typography>

        <TextField
          label="Fecha y Hora del Incidente"
          type="datetime-local"
          id="dateTime"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required fullWidth
          InputLabelProps={{ shrink: true }}
          disabled={isLoading}
        />

        <TextField
          label="Ubicación en el Almacén"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required fullWidth
          disabled={isLoading}
        />

        <FormControl fullWidth required disabled={isLoading}>
          <InputLabel id="type-select-label">Tipo de Incidente</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            value={type}
            label="Tipo de Incidente"
            onChange={(e) => setType(e.target.value)}
          >
            {incidentTypes.map((option) => ( <MenuItem key={option} value={option}>{option}</MenuItem> ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required disabled={isLoading || isLoadingTechnicians}>
          <InputLabel id="technician-select-label">Técnico Asignado</InputLabel>
          <Select
            labelId="technician-select-label"
            id="technician-select"
            value={assigned_technician_id}
            label="Técnico Asignado"
            onChange={(e) => setAssignedTechnicianId(e.target.value)}
            endAdornment={isLoadingTechnicians ? <CircularProgress color="inherit" size={20} sx={{mr: 2}}/> : null}
          >
            {availableTechnicians.map((tech) => (
              <MenuItem key={tech.id} value={tech.id}>
                {tech.full_name} {/* API devuelve full_name */}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Causa / Descripción Inicial"
          id="cause"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          required fullWidth multiline rows={3}
          disabled={isLoading}
        />

        <TextField label="Gravedad Inicial" value="Sin asignar (Supervisor asignará numéricamente)" fullWidth disabled InputProps={{ readOnly: true }} />
        <TextField label="Estado Inicial" value={defaultStatus} fullWidth disabled InputProps={{ readOnly: true }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || isLoadingRobots || isLoadingTechnicians}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit"/> : null}
          >
            {isLoading ? 'Registrando...' : 'Registrar Incidente(s)'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default IncidentForm;