import React, { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ReportPage() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Incidentes', 14, 22);

    doc.setFontSize(12);
    doc.text(`Periodo: ${period === 'monthly' ? 'Mensual' : 'Anual'}`, 14, 30);
    doc.text(`Total: ${stats.total}`, 14, 36);
    doc.text(`Gravedad promedio: ${stats.avgGravity}`, 14, 42);

    let startY = 50;

    doc.autoTable({
        head: [['Fecha', 'Robot', 'Tipo', 'Gravedad', 'Estado', 'Técnicos']],
        body: data.map(i => [
        new Date(i.incident_timestamp).toLocaleDateString(),
        i.robot_id,
        i.type,
        i.gravity,
        i.status,
        (i.technicians || []).join(', ')
        ]),
        startY
    });

    doc.save('reporte_incidentes.pdf');
    };

  useEffect(() => {
    fetch(`/api/report?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        generateStats(data);
      });
  }, [period]);

  const generateStats = (incidents) => {
    const summary = {
      total: incidents.length,
      byType: {},
      avgGravity: 0,
      byStatus: {},
    };

    let gravitySum = 0;
    incidents.forEach(i => {
      summary.byType[i.type] = (summary.byType[i.type] || 0) + 1;
      summary.byStatus[i.status] = (summary.byStatus[i.status] || 0) + 1;
      gravitySum += parseFloat(i.gravity) || 0;
    });

    summary.avgGravity = (incidents.length ? gravitySum / incidents.length : 0).toFixed(2);
    setStats(summary);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Generar Reporte de Incidentes
      </Typography>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="period-label">Periodo</InputLabel>
        <Select
          labelId="period-label"
          value={period}
          label="Periodo"
          onChange={(e) => setPeriod(e.target.value)}
        >
          <MenuItem value="monthly">Mensual</MenuItem>
          <MenuItem value="yearly">Anual</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Estadísticas
      </Typography>
      <ul>
        <li>Total incidentes: {stats.total}</li>
        <li>Gravedad promedio: {stats.avgGravity}</li>
        <li>Tipos de incidente: {Object.entries(stats.byType || {}).map(([type, count]) => `${type}: ${count}`).join(', ')}</li>
        <li>Estados: {Object.entries(stats.byStatus || {}).map(([status, count]) => `${status}: ${count}`).join(', ')}</li>
      </ul>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Incidentes Detallados
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Robot</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Gravedad</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Técnicos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>{new Date(incident.incident_timestamp).toLocaleDateString()}</TableCell>
              <TableCell>{incident.robot_id}</TableCell>
              <TableCell>{incident.type}</TableCell>
              <TableCell>{incident.gravity}</TableCell>
              <TableCell>{incident.status}</TableCell>
              <TableCell>{incident.technicians.join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="contained" color="primary" onClick={exportToPDF} sx={{ mt: 2 }}>
        Exportar a PDF
      </Button>
    </Container>
  );
}

export default ReportPage;