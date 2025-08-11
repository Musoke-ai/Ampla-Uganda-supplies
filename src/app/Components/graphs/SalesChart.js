import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

// Register required components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Title);

const SalesLineChart = ({data}) => {
  // Convert the data into an array with keys "day" and "sales"
const transformedData = Object.keys(data)?.map(date => ({
  date,
  sales: data[date]
}));

// Convert the transformed data to JSON string
const jsonData = JSON.stringify(transformedData);

console.log(transformedData);
  // Sample data
  const sampleData = transformedData;

  if (Array.isArray(transformedData) ){
    const result = sampleData.map(item => ({
      day: item.date,
      sales: item.sales,
    }));
    console.log('Data is Array: '+result);
  } else {
    console.error("Data is not an array:", sampleData);
  }

  const chartData = {
    labels: sampleData?.map((entry) => entry.date), // Dates
    datasets: [
      {
        label: "Daily Sales ($)",
        data: sampleData.map((entry) => entry.sales), // Sales values
        borderColor: "#42a5f5", // Line color
        backgroundColor: "rgba(66, 165, 245, 0.3)", // Point fill color
        borderWidth: 2,
        pointRadius: 0.8,
        pointHoverRadius: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: "top",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#333",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "#42a5f5",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          // text: "Date",
          color: "#444",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#666",
          font: {
            size: 12,
          },
          callback: (value) => `${value}`, // Add $ symbol
        },
        title: {
          display: true,
          // text: "Sales",
          color: "#444",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curve
      },
    },
  };

  return <Line data={chartData} options={options} className="pe-2"/>;
};

export default SalesLineChart;
