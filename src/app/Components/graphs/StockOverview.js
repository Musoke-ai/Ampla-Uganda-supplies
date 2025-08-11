import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const data = [
  {
    name: 'Total Stock Worth',
    totalStockWorth: 100000,
    sales: 60000,
    profit: 30000,
    loss: 10000,
    remainingStockWorth: 40000,
  }
];

const colors = ['#4CAF50', '#FFC107', '#F44336', '#2196F3'];

const CustomTooltip = ({ payload, label }) => {
  if (payload && payload.length) {
    const total = payload.reduce((acc, cur) => acc + cur.value, 0);
    const percentages = payload.map(entry => ({
      name: entry.name,
      value: ((entry.value / total) * 100).toFixed(2),
    }));

    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '10px', border: 'none' }}>
        <p className="label">{`${label}`}</p>
        {percentages.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: colors[index] }}>
            {`${entry.name}: ${entry.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StockWorthChart = () => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 50, right: 30, left: 20, bottom: 80 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis type="number" tick={{ fill: '#555555' }} />
      <YAxis dataKey="name" type="category" tick={{ fill: '#555555' }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend verticalAlign="bottom" align="center" height={36} />
      <Bar dataKey="sales" stackId="a" fill={colors[0]} name="Sales" />
      <Bar dataKey="profit" stackId="a" fill={colors[1]} name="Profit" />
      <Bar dataKey="loss" stackId="a" fill={colors[2]} name="Loss" />
      <Bar dataKey="remainingStockWorth" stackId="a" fill={colors[3]} name="Remaining Stock Worth" />
    </BarChart>
  </ResponsiveContainer>
);

export default StockWorthChart;
