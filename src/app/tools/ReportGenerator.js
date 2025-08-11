import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title);

const ReportGenerator = () => {
  const [reportType, setReportType] = useState("Stock Level");

  // Sample data for each report
  const reportData = {
    "Stock Level": [
      { item: "Product A", quantity: 100, status: "In Stock" },
      { item: "Product B", quantity: 50, status: "Low Stock" },
    ],
    "Sales": [
      { date: "2024-11-01", product: "Product A", quantity: 5, total: "$50" },
      { date: "2024-11-02", product: "Product B", quantity: 3, total: "$30" },
    ],
    "Profit and Loss": [
      { month: "October", revenue: "$5000", expenses: "$3000", profit: "$2000" },
      { month: "November", revenue: "$7000", expenses: "$4000", profit: "$3000" },
    ],
  };

  const businessName = "Your Business Name";
  const reportDate = new Date().toLocaleDateString();

  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `${reportType} Report`;
    const data = reportData[reportType];

    // Add Business Name and Report Date
    doc.setFontSize(18);
    doc.text(businessName, 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${reportDate}`, 20, 30);

    // Add Title
    doc.setFontSize(16);
    doc.text(title, 20, 40);

    // Add Table
    if (data.length) {
      const headers = Object.keys(data[0]);
      const rows = data.map((item) => Object.values(item));
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 50,
      });
    } else {
      doc.text("No data available.", 20, 60);
    }

    // Add Graph (Optional, for specific reports)
    if (reportType === "Profit and Loss") {
      const canvas = document.querySelector(`#${reportType.replace(/\s+/g, "-")}-chart`);
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 15, doc.previousAutoTable.finalY + 10, 180, 90);
    }

    // Save PDF
    doc.save(`${reportType.replace(/\s+/g, "_")}_Report.pdf`);
  };

  // Chart Data for Profit and Loss Report
  const profitAndLossChartData = {
    labels: reportData["Profit and Loss"].map((item) => item.month),
    datasets: [
      {
        label: "Profit",
        data: reportData["Profit and Loss"].map((item) => parseFloat(item.profit.replace("$", ""))),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Report Generator</h1>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="reportType">Select Report Type: </label>
        <select
          id="reportType"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="Stock Level">Stock Level</option>
          <option value="Sales">Sales</option>
          <option value="Profit and Loss">Profit and Loss</option>
        </select>
      </div>
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={generatePDF}
      >
        Generate PDF
      </button>

      {/* Render Chart for Profit and Loss Report */}
      {reportType === "Profit and Loss" && (
        <div style={{ marginTop: "20px" }}>
          <h3>Profit and Loss Overview</h3>
          <Bar
            id="Profit-and-Loss-chart"
            data={profitAndLossChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Profit and Loss" },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
