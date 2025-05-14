// (Puedes poner esto en un archivo como src/data/mockIncidents.js y exportarlo)
// O definirlo dentro de IncidentListPage.js por ahora

export const mockIncidentsData = [
    {
      id: 'INC-001',
      robotId: 'R2D2-A',
      incidentTimestamp: '2025-05-01T10:30:00',
      location: 'Sector A, Pasillo 3',
      type: 'Colisión',
      cause: 'Sensor de proximidad falló',
      gravity: 'Media',
      status: 'En Investigación',
    },
    {
      id: 'INC-002',
      robotId: 'BB8-B',
      incidentTimestamp: '2025-05-02T14:00:00',
      location: 'Zona de Carga 1',
      type: 'Error de software',
      cause: 'Actualización de firmware fallida',
      gravity: 'Alta',
      status: 'Creado',
    },
    {
      id: 'INC-003',
      robotId: 'C3PO-A',
      incidentTimestamp: '2025-05-02T18:45:00',
      location: 'Sector C, Pasillo 1',
      type: 'Fallo mecánico',
      cause: 'Engranaje atascado en brazo',
      gravity: 'Alta',
      status: 'Resuelto',
    },
     {
      id: 'INC-004',
      robotId: 'R2D2-A', // Robot repetido
      incidentTimestamp: '2025-05-03T09:15:00',
      location: 'Sector B, Pasillo 5',
      type: 'Batería baja',
      cause: 'No regresó a estación de carga',
      gravity: 'Baja',
      status: 'Resuelto',
    },
     {
      id: 'INC-005',
      robotId: 'WALL-E-C',
      incidentTimestamp: '2025-05-03T11:00:00',
      location: 'Zona de Descarga 2',
      type: 'Obstrucción',
      cause: 'Caja bloqueando el camino',
      gravity: 'Media',
      status: 'En Investigación',
    },
     {
      id: 'INC-006',
      robotId: 'BB8-B', // Robot repetido
      incidentTimestamp: '2025-05-03T15:00:00',
      location: 'Zona de Carga 1', // Lugar repetido
      type: 'Colisión', // Tipo repetido
      cause: 'Colisión leve con estantería',
      gravity: 'Baja',
      status: 'Creado',
    },
  ];