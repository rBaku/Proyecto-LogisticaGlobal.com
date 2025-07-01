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
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Chart } from 'chart.js/auto';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const currentYear = new Date().getFullYear();
const availableYears = [currentYear, currentYear - 1, currentYear - 2];

function ReportPage() {
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    avgGravity: 0,
    avgResolutionTimeHours: 0,
    byType: {},
    byStatus: {}
  });

  useEffect(() => {
    const url = new URL('http://localhost:3001/api/report');
    url.searchParams.append('period', period);
    url.searchParams.append('year', year);
    if (period === 'monthly') {
      url.searchParams.append('month', month);
    }

    fetch(url.toString(), { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setData(data.incidents || []);
        setStats(data.summary || {});
      })
      .catch(err => {
        console.error('Error al obtener datos del backend:', err);
      });
  }, [period, year, month]);

  useEffect(() => {
    if (!stats.byType || !stats.byStatus) return;

    const renderChart = (id, data, title) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;

      if (Chart.getChart(id)) {
        Chart.getChart(id).destroy();
      }

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: title,
            data: Object.values(data),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: title }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    };

    renderChart('chartByType', stats.byType, 'Incidentes por Tipo');
    renderChart('chartByStatus', stats.byStatus, 'Incidentes por Estado');
  }, [stats]);

  const exportToPDF = async () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Incidentes', 14, 22);

    doc.setFontSize(12);
    doc.text(`Periodo: ${period === 'monthly' ? `Mensual (${months[month - 1]} ${year})` : `Anual (${year})`}`, 14, 30);
    doc.text(`Total: ${stats.total}`, 14, 36);
    doc.text(`Gravedad promedio: ${stats.avgGravity}`, 14, 42);
    doc.text(`Tiempo promedio de resolución: ${stats.avgResolutionTimeHours} hrs`, 14, 48);

    let yOffset = 55;

    const chartIds = ['chartByType', 'chartByStatus'];

    // Esperar brevemente para asegurar que los gráficos estén renderizados
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms

    for (const id of chartIds) {
      const canvas = document.getElementById(id);
      if (canvas) {
        try {
          const imgData = await html2canvas(canvas).then(c => c.toDataURL('image/png'));
          doc.addImage(imgData, 'PNG', 14, yOffset, 180, 80);
          yOffset += 90;
        } catch (error) {
          console.error(`Error al capturar el canvas "${id}"`, error);
        }
      }
    }

    autoTable(doc, {
      head: [['Fecha', 'Robot', 'Tipo', 'Gravedad', 'Estado', 'Técnicos']],
      body: data.map(i => [
        new Date(i.incident_timestamp).toLocaleDateString(),
        i.robot_id,
        i.type,
        i.gravity,
        i.status,
        (i.technicians || []).join(', ')
      ]),
      startY: yOffset,
    });

    doc.save('reporte_incidentes.pdf');
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

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="year-label">Año</InputLabel>
        <Select
          labelId="year-label"
          value={year}
          label="Año"
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {availableYears.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {period === 'monthly' && (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="month-label">Mes</InputLabel>
          <Select
            labelId="month-label"
            value={month}
            label="Mes"
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {months.map((name, index) => (
              <MenuItem key={index + 1} value={index + 1}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Typography variant="h6" sx={{ mt: 3 }}>
        Estadísticas
      </Typography>
      <ul>
        <li>Total incidentes: {stats.total ?? '-'}</li>
        <li>Gravedad promedio: {stats.avgGravity ?? '-'}</li>
        <li>Tiempo promedio de resolución: {stats.avgResolutionTimeHours ?? '-'} horas</li>
        <li>Tipos de incidente: {stats.byType ? Object.entries(stats.byType).map(([type, count]) => `${type}: ${count}`).join(', ') : '-'}</li>
        <li>Estados: {stats.byStatus ? Object.entries(stats.byStatus).map(([status, count]) => `${status}: ${count}`).join(', ') : '-'}</li>
      </ul>

      <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}>
        <canvas id="chartByType" width="400" height="200"></canvas>
        <canvas id="chartByStatus" width="400" height="200"></canvas>
      </div>

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
              <TableCell>{(incident.technicians || []).join(', ')}</TableCell>
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