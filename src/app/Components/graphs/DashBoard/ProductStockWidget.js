import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { selectSales } from '../../../features/api/salesSlice';
import { selectStock } from '../../../features/stock/stockSlice';
import { useSelector } from 'react-redux';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ProductStockWidget = () => {
  const [data, setData] = useState(null);
    const inventory = useSelector(selectStock);
    const sales = useSelector(selectSales);
  useEffect(() => {
    // Simulated data - Replace with fetch from your backend


    // const inventory = [
    //   { itemId: 108, itemName: 'Cake Board', itemQuantity: 29 },
    //   { itemId: 109, itemName: 'Board 2"', itemQuantity: 11 },
    // ];

    // const sales = [
    //   { saleItemId: 108, saleQuantity: 10 },
    //   { saleItemId: 109, saleQuantity: 5 },
    // ];

    // Combine data
    const result = inventory.map(item => {
      const sold = sales
        .filter(sale => sale.saleItemId === item.itemId)
        .reduce((sum, sale) => sum + sale.saleQuantity, 0);
      return {
        name: item.itemName,
        sold,
        remaining: item.itemQuantity,
      };
    });

    setData(result);
  }, []);

  if (!data) {
    return <Spinner animation="border" />;
  }

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Sold',
        backgroundColor: '#dc3545',
        data: data.map(item => item.sold),
      },
      {
        label: 'Remaining',
        backgroundColor: '#198754',
        data: data.map(item => item.remaining),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <Card className="bg-white shadow rounded-2xl p-4 mt-3" style={{width:'570px'}}>
      <Card.Title className="text-center mb-4">Product Stock Overview</Card.Title>
      <Bar data={chartData} options={options} />
    </Card>
  );
};

export default ProductStockWidget;
