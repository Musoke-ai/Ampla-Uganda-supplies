import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const HorizontalBarGraph = ({remainingStock, _soldToday, rescentSold }) => {
  // Data
  // const _remainingStock = Number(remainingStock); // Total stock available
  const soldRecently = rescentSold; // Stock sold recently
  const soldToday = _soldToday; // Stock sold today

  // Chart Data
  const data = {
    labels: ["Stock Availability"], // Single label for one bar
    datasets: [
      {
        label: "Sold Today",
        data: [soldToday],
        backgroundColor: "rgba(255, 99, 132, 0.8)", // Red for sold today
        barThickness: 5, // Bar width
      },
      {
        label: "Sold Recently",
        data: [soldRecently],
        backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue for sold recently
        barThickness: 5, // Bar width
      },
      {
        label: "Remaining Stock",
        data: [remainingStock],
        backgroundColor: "rgba(75, 192, 192, 0.8)", // Green for remaining stock
        barThickness: 8, // Bar width
      },
    ],
  };

  // Chart Options
  const options = {
    indexAxis: "y", // Horizontal bar
    responsive: true,
    maintainAspectRatio: false, // Allow manual height control
    plugins: {
      legend: {
        position: "top", // Legend on top
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        stacked: true, // Stack the data horizontally
        beginAtZero: true,
        display: false, // Hide the x-axis labels for a clean look
      },
      y: {
        stacked: true,
        ticks: {
          display: false, // Hide y-axis labels for a compact view
        },
        grid: {
          display: false, // Remove grid lines
        },
      },
    },
    layout: {
      padding: 0, // Remove extra padding around the chart
    },
  };

  return (
    <div style={{ height: "40px", width: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default HorizontalBarGraph;
