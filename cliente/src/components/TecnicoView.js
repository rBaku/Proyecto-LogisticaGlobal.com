import React, { useEffect, useState } from 'react';

function TecnicoView() {
  const [incidentes, setIncidentes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIncidentes();
  }, []);

  const fetchIncidentes = () => {
    fetch('http://localhost:3001/api/incidentes')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener incidentes');
        return res.json();
      })
      .then(data => {
        // Filtra incidentes donde Carlos Ruiz está asignado
        const asignados = data.filter(inc =>
          inc.tecnicos && inc.tecnicos.includes("Carlos Ruiz")
        );
        setIncidentes(asignados);
      })
      .catch(err => setError(err.message));
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`http://localhost:3001/api/incidentes/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) throw new Error('Error al cambiar el estado');

      fetchIncidentes();
    } catch (err) {
      console.error(err);
      setError('No se pudo cambiar el estado del incidente');
    }
  };

  return (
    <div>
      <h2>Vista del Técnico - Carlos Ruiz</h2>

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
          {incidentes.map((inc) => (
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
                <button onClick={() => cambiarEstado(inc.id, 'EN PROCESO')}>En Proceso</button>
                <button onClick={() => cambiarEstado(inc.id, 'TERMINADO')} style={{ marginLeft: '5px' }}>
                  Terminado
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TecnicoView;