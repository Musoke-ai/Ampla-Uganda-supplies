import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { selectRawMaterials } from '../../../features/api/rawmaterialsSlice';
import { selectRawMaterialsIntake } from '../../../features/api/rawmaterialsIntakeSlice';
import { Card, Spinner } from 'react-bootstrap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const RawMaterialWidget = () => {
  const materials = useSelector(selectRawMaterials);
  const usageLogs = useSelector(selectRawMaterialsIntake);

  const totalStockValue = materials.reduce(
    (sum, m) => sum + m.unitPrice * m.Quantity,
    0
  );

  // Usage quantity per material
  const usageByMaterial = {};
  usageLogs.forEach(log => {
    const mat = materials.find(m => m.materialId === log.materialId);
    if (mat) {
      usageByMaterial[mat.name] =
        (usageByMaterial[mat.name] || 0) + log.quantity;
    }
  });

  // Pie chart: Material Usage
  const pieChartData = {
    labels: Object.keys(usageByMaterial),
    datasets: [
      {
        data: Object.values(usageByMaterial),
        backgroundColor: ['#60a5fa', '#f87171', '#34d399', '#facc15', '#c084fc'],
      },
    ],
  };

  // Horizontal stacked bar chart: Remaining vs Used
  const barChartLabels = materials.map(m => m.name);
  const usedData = materials.map(
    m => usageByMaterial[m.name] || 0
  );
  const remainingData = materials.map(
    m => m.Quantity
  );

  const stackedBarData = {
    labels: barChartLabels,
    datasets: [
      {
        label: 'Used',
        data: usedData,
        backgroundColor: '#f87171',
      },
      {
        label: 'Remaining',
        data: remainingData,
        backgroundColor: '#34d399',
      },
    ],
  };

  const lowStock = materials.filter(m => m.Quantity < 5);

  return (
    <div style={{width:'570px'}}>
  <Card className="bg-white shadow rounded-2xl p-4 mt-3" style={{width:'570px'}}>
      <Card.Title className="text-center mb-4">Raw Material Usage</Card.Title>
<Bar
          data={stackedBarData}
          options={{
            indexAxis: 'y',
            responsive: true,
            plugins: {
              legend: { position: 'top' },
            },
            scales: {
              x: {
                stacked: true,
              },
              y: {
                stacked: true,
              },
            },
          }}
        />
    </Card>
    </div>
  );
};

export default RawMaterialWidget;
