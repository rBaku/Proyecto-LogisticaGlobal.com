import React, { useEffect, useState } from 'react';

function SupervisorView() {
  const [incidentes, setIncidentes] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    fecha: '',
    ubicacion: '',
    tipo: '',
    causa: '',
    gravedad: '',
    estado: 'CREADO',
    robots: '',
    tecnicos: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIncidentes();
  }, []);

  const [filters, setFilters] = useState({
    fecha: '',
    ubicacion: '',
    tipo: '',
    causa: '',
    gravedad: '',
    estado: '',
    robots: '',
    tecnicos: '',
  });

  const fetchIncidentes = () => {
    fetch('http://localhost:3001/api/incidentes')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener incidentes');
        return res.json();
      })
      .then(data => setIncidentes(data))
      .catch(err => setError(err.message));
  };

  const handleAddIncident = () => {
    setFormVisible(true);
    setFormData({
      id: null,
      fecha: '',
      ubicacion: '',
      tipo: '',
      causa: '',
      gravedad: '',
      estado: 'CREADO',
      robots: '',
      tecnicos: ''
    });
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este incidente?")) return;
  
    try {
      const response = await fetch(`http://localhost:3001/api/incidentes/${id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Error al eliminar');
      } else {
        setIncidentes(incidentes.filter((inc) => inc.id !== id));
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };
  const handleEditIncident = (incidente) => {
    setFormData({
        id: incidente.id,
        fecha: incidente.fecha?.split('T')[0], // solo la parte de la fecha
        ubicacion: incidente.ubicacion,
        tipo: incidente.tipo,
        causa: incidente.causa,
        gravedad: incidente.gravedad,
        estado: incidente.estado,
        robots: incidente.robots.join(', '),
        tecnicos: incidente.tecnicos.join(', ')
      });
      setFormVisible(true);
      setError(null);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      fecha: formData.fecha,
      ubicacion: formData.ubicacion,
      tipo: formData.tipo,
      causa: formData.causa,
      gravedad: parseInt(formData.gravedad),
      estado: formData.estado,
      robots: formData.robots.split(',').map(r => r.trim()),
      tecnicos: formData.tecnicos.split(',').map(t => t.trim())
    };
  
    try {
      const res = await fetch(
        formData.id
          ? `http://localhost:3001/api/incidentes/${formData.id}`
          : 'http://localhost:3001/api/incidentes',
        {
          method: formData.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar incidente');
      }
  
      setFormVisible(false);
      setError(null);
      fetchIncidentes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignIncident = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/incidentes/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'FIRMADO' }),
      });
  
      if (!res.ok) throw new Error('No se pudo firmar');
  
      fetchIncidentes();
    } catch (err) {
      console.error(err);
      setError('Error al firmar el incidente');
    }
  };

  const filteredIncidentes = incidentes.filter((incidente) => {
    return (
      (!filters.fecha || incidente.fecha.startsWith(filters.fecha)) &&
      (!filters.ubicacion || incidente.ubicacion.toLowerCase().includes(filters.ubicacion.toLowerCase())) &&
      (!filters.tipo || incidente.tipo.toLowerCase().includes(filters.tipo.toLowerCase())) &&
      (!filters.causa || incidente.causa.toLowerCase().includes(filters.causa.toLowerCase())) &&
      (!filters.gravedad || incidente.gravedad.toString() === filters.gravedad) &&
      (!filters.estado || incidente.estado.toLowerCase().includes(filters.estado.toLowerCase())) &&
      (!filters.robots || (incidente.robots || []).some(r => r.toLowerCase().includes(filters.robots.toLowerCase()))) &&
      (!filters.tecnicos || (incidente.tecnicos || []).some(t => t.toLowerCase().includes(filters.tecnicos.toLowerCase())))
    );
  });

  return (
    <div>
      <h2>Vista del Supervisor</h2>
  
      <button onClick={handleAddIncident} style={{ marginBottom: '10px' }}>
        Añadir Incidente
      </button>
  
      <h3>Filtros</h3>
      <input placeholder="Fecha" type="date" onChange={e => setFilters({ ...filters, fecha: e.target.value })} />
      <input placeholder="Ubicación" onChange={e => setFilters({ ...filters, ubicacion: e.target.value })} />
      <input placeholder="Tipo" onChange={e => setFilters({ ...filters, tipo: e.target.value })} />
      <input placeholder="Causa" onChange={e => setFilters({ ...filters, causa: e.target.value })} />
      <input placeholder="Gravedad" type="number" onChange={e => setFilters({ ...filters, gravedad: e.target.value })} />
      <input placeholder="Estado" onChange={e => setFilters({ ...filters, estado: e.target.value })} />
      <input placeholder="Robot" onChange={e => setFilters({ ...filters, robots: e.target.value })} />
      <input placeholder="Técnico" onChange={e => setFilters({ ...filters, tecnicos: e.target.value })} />
  
      {formVisible && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>{formData.id ? 'Editar Incidente' : 'Nuevo Incidente'}</h3>
          <label>Fecha: <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required /></label><br />
          <label>Ubicación: <input name="ubicacion" value={formData.ubicacion} onChange={handleChange} required /></label><br />
          <label>Tipo: <input name="tipo" value={formData.tipo} onChange={handleChange} required /></label><br />
          <label>Causa: <input name="causa" value={formData.causa} onChange={handleChange} required /></label><br />
          <label>Gravedad (1-10): <input type="number" name="gravedad" min="1" max="10" value={formData.gravedad} onChange={handleChange} required /></label><br />
          <label>Estado: 
            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option value="CREADO">CREADO</option>
              <option value="EN PROCESO">EN PROCESO</option>
              <option value="RESUELTO">RESUELTO</option>
              <option value="FIRMADO">FIRMADO</option>
            </select>
          </label><br />
          <label>Robots (separados por coma): <input name="robots" value={formData.robots} onChange={handleChange} /></label><br />
          <label>Técnicos (separados por coma): <input name="tecnicos" value={formData.tecnicos} onChange={handleChange} /></label><br />
          <button type="submit">Guardar</button>
          <button type="button" onClick={() => setFormVisible(false)} style={{ marginLeft: '10px' }}>Cancelar</button>
        </form>
      )}
  
      {error && <p style={{ color: 'red' }}>{error}</p>}
  
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Ubicación</th>
            <th>Tipo</th>
            <th>Causa</th>
            <th>Gravedad</th>
            <th>Estado</th>
            <th>Robots</th>
            <th>Técnicos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredIncidentes.map((inc) => (
            <tr key={inc.id}>
              <td>{inc.id}</td>
              <td>{new Date(inc.fecha).toLocaleDateString()}</td>
              <td>{inc.ubicacion}</td>
              <td>{inc.tipo}</td>
              <td>{inc.causa}</td>
              <td>{inc.gravedad}</td>
              <td>{inc.estado}</td>
              <td>{(inc.robots || []).join(', ')}</td>
              <td>{(inc.tecnicos || []).join(', ')}</td>
              <td>
                <button onClick={() => handleEditIncident(inc)}>Editar</button>
                <button onClick={() => handleDeleteIncident(inc.id)} style={{ marginLeft: '5px' }}>Eliminar</button>
                <button onClick={() => handleSignIncident(inc.id)} style={{ marginLeft: '5px' }}>Firmar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SupervisorView;