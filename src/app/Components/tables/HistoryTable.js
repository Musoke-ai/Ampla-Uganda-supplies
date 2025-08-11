import React, { useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSettings } from "../Settings";
import Table from 'react-bootstrap/Table';
// import { format } from 'date-fns'; // Assuming you use date-fns for formatting

const HistoryTable = ({ historyData, itemsData, companyName }) => {

const { settings } = useSettings();

  const [searchTerm, setSearchTerm] = useState("");

  // Merge history and items data
  const mergedData = historyData.map((history) => {
    const item = itemsData.find((item) => item.itemId === history.historyItemId);
    return {
      ...history,
      itemName: item?.itemName || "Unknown",
      itemModel: item?.itemModel || "Unknown",
      itemNotes: item?.itemNotes || "Unknown",
    };
  });

  // Filter based on search input
  const filteredData = mergedData.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.itemName.toLowerCase().includes(searchLower) ||
      record.historyAction.toLowerCase().includes(searchLower) ||
      format(new Date(record.historyDateCreated), "yyyy-MM-dd").includes(searchLower)
    );
  });

  // Export history to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    // Add company name and report generation date
    doc.text(`${companyName}`, 14, 10);
    doc.text(`Report generated on: ${currentDate}`, 14, 20);

    // Add table
    doc.autoTable({
      startY: 30,
      head: [["Date", "Item Name", "Model", "Notes", "Action", "Details"]],
      body: filteredData.map((record) => [
        format(new Date(record.historyDateCreated), "yyyy-MM-dd HH:mm:ss"),
        record.itemName,
        record.itemModel,
        record.itemNotes,
        record.historyAction,
        record.historyDetails,
      ]),
    });

    // Save PDF
    doc.save("history-report.pdf");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>History Table</h2>
      <input
        type="text"
        placeholder="Search by date, item, or action"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "20px", padding: "10px", width: "100%" }}
      />
      <button
        onClick={exportToPDF}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Export to PDF
      </button>
          <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Date</th>
          <th>Item Name</th>
          <th>Model</th>
          <th>Notes</th>
          <th>Action</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((record) => (
          <tr key={record.historyId}>
            <td>
              {format(new Date(record.historyDateCreated), "yyyy-MM-dd HH:mm:ss")}
            </td>
            <td>{record.itemName}</td>
            <td>{record.itemModel}</td>
            <td>{record.itemNotes}</td>
            <td>{record.historyAction}</td>
            <td>{record.historyDetails}</td>
          </tr>
        ))}
      </tbody>
    </Table>
      {/* <table className="table-striped"> */}
      {/* <table className="">
        <thead >
          <tr >
            <th>Date</th>
            <th>Item Name</th>
            <th>Model</th>
            <th>Notes</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((record) => (
            <tr key={record.historyId}>
              <td style={{padding: "10px" }}>
                {format(new Date(record.historyDateCreated), "yyyy-MM-dd HH:mm:ss")}
              </td>
              <td style={{  padding: "10px" }}>{record.itemName}</td>
              <td style={{  padding: "10px" }}>{record.itemModel}</td>
              <td style={{  padding: "10px" }}>{record.itemNotes}</td>
              <td style={{  padding: "10px" }}>{record.historyAction}</td>
              <td style={{  padding: "10px" }}>{record.historyDetails}</td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
};

export default HistoryTable;
