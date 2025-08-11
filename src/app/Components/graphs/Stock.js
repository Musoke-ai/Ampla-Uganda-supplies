import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const data = [
  { product: 'Product A', stock: 120 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product A', stock: 120 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product A', stock: 120 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product A', stock: 120 },
  { product: 'Product A', stock: 120 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product A', stock: 120 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product A', stock: 120 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product B', stock: 80 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product C', stock: 45 },
  { product: 'Product D', stock: 150 },
  { product: 'Product E', stock: 60 },
  { product: 'Product A', stock: 120 },
];

const getColor = (stock) => {
  if (stock > 100) return '#4CAF50';  // Green for high stock
  if (stock >= 50 && stock <= 100) return '#FFC107'; // Yellow for medium stock
  return '#F44336'; // Red for low stock
};

const StockBarChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={data}
      margin={{ top: 50, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey="product" tick={{ fill: '#555555' }} />
      <YAxis tick={{ fill: '#555555' }} />
      <Tooltip contentStyle={{ backgroundColor: '#f5f5f5', borderRadius: '10px', border: 'none' }} />
      <Legend />
      <Bar dataKey="stock" barSize={50}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={getColor(entry.stock)} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default StockBarChart;
