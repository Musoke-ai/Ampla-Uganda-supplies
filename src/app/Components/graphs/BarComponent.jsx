import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

// Register required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const QuantitiesBarChart = (data) => {
  console.log("Data Bar: "+JSON.stringify(data));
  console.log("Data keys: "+JSON.stringify(Object.keys(data['data'])));
  
    // Convert the data into an array with keys "day" and "sales"
const transformedData = Object.keys(data['data'])?.map(date => ({
  date,
  sales: data['data'][date]
}));
  const sampleData = transformedData;
  // Convert the transformed data to JSON string
const jsonData = JSON.stringify(transformedData);

console.log(transformedData);

if (Array.isArray(transformedData) ){
  const result = sampleData.map(item => ({
    day: item.date,
    sales: item.sales,
  }));
  console.log('Data is Array: '+JSON.stringify(result));
} else {
  console.error("Data is not an array:", sampleData);
}
  // const sampleData = [
  //   { date: "Mon", quantity: 30 },
  //   { date: "Tue", quantity: 45 },
  //   { date: "Wed", quantity: 60 },
  //   { date: "Thur", quantity: 50 },
  //   { date: "Fri", quantity: 80 },
  //   { date: "Sat", quantity: 70 },
  //   { date: "Sun", quantity: 100 },
  // ];

  const chartData = {
    labels: sampleData.map((entry) => entry.date), // Dates
    datasets: [
      {
        label: "Quantities Sold",
        data: sampleData.map((entry) => entry.sales), // Quantities
        backgroundColor: "#42a5f5", // Bar color
        borderColor: "#1e88e5", // Border color
        borderWidth: 1,
        hoverBackgroundColor: "#64b5f6", // Bar hover color
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
        borderColor: "#1e88e5",
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
          callback: (value) => `${value}`, // Add "units" label
        },
        title: {
          display: true,
          //text: "Quantities Sold",
          color: "#444",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} className="p-2"/>;
};

export default QuantitiesBarChart;
