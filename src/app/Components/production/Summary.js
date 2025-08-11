import React, { useState, useMemo, useRef } from "react";
import { Table, Form, Container, Badge, Button } from "react-bootstrap";
import { useTable, useSortBy } from "react-table";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Summary = () => {
  const [filterDate, setFilterDate] = useState("");
  const [minRows, setMinRows] = useState(5);
  const tableRef = useRef(null);

  // Example production data
  const productionData = [
    {
      date: "2025-03-10",
      workers: 5,
      rawMaterials: 20,
      productsProduced: 100,
      expenses: 500,
      retailPrice: 1500,
      wholesalePrice: 1200,
      profit: 1000,
      ranking: 1,
      products: { '8"': 12, '10"': 10, '12"': 8, '14"': 20, '17"': 50 }
    },
    {
      date: "2025-03-09",
      workers: 4,
      rawMaterials: 18,
      productsProduced: 80,
      expenses: 400,
      retailPrice: 1200,
      wholesalePrice: 1000,
      profit: 800,
      ranking: 2,
      products: { '8"': 10, '10"': 8, '12"': 6, '14"': 18, '17"': 38 }
    }
  ];

  // Filter data by selected date
  const filteredData = useMemo(() => {
    let data = filterDate ? productionData.filter((row) => row.date === filterDate) : productionData;
    return data.slice(0, minRows);
  }, [filterDate, minRows]);

  // Table columns
  const columns = useMemo(
    () => [
      { Header: "Date", accessor: "date" },
      { Header: "Workers", accessor: "workers" },
      { Header: "Raw Materials Used (kg)", accessor: "rawMaterials" },
      {
        Header: "Products Produced",
        accessor: "products",
        Cell: ({ value }) => (
          <div>
            {Object.entries(value).map(([size, qty]) => (
              <div key={size}>
                {size}: <strong>{qty}pc</strong>
              </div>
            ))}
          </div>
        )
      },
      { Header: "Expenses ($)", accessor: "expenses" },
      { Header: "Retail Price ($)", accessor: "retailPrice" },
      { Header: "Wholesale Price ($)", accessor: "wholesalePrice" },
      { Header: "Profit ($)", accessor: "profit" },
      { Header: "Ranking", accessor: "ranking", Cell: ({ value }) => getBadge(value) },
    ],
    []
  );

  // Use react-table for sorting
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    { columns, data: filteredData },
    useSortBy
  );

  // Function to get color badges based on ranking
  function getBadge(rank) {
    let variant = "secondary";
    if (rank === 1) variant = "success";
    else if (rank <= 3) variant = "primary";
    else if (rank <= 5) variant = "warning";
    else variant = "danger";

    return <Badge bg={variant}>#{rank}</Badge>;
  }

  // Print Functionality (Prints only the table)
  const handlePrint = () => {
    const printContent = document.getElementById("printable-table").innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Production Summary", 14, 10);
    autoTable(doc, { html: "#summary-table" });
    doc.save("production_summary.pdf");
  };

  // Export to Excel (Fixes date formatting issue)
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map(row => ({
        Date: row.date,
        Workers: row.workers,
        "Raw Materials Used (kg)": row.rawMaterials,
        "Products Produced": Object.entries(row.products)
          .map(([size, qty]) => `${size}: ${qty}pc`)
          .join(", "),
        "Expenses ($)": row.expenses,
        "Retail Price ($)": row.retailPrice,
        "Wholesale Price ($)": row.wholesalePrice,
        "Profit ($)": row.profit,
        Ranking: row.ranking
      })),
      { cellDates: true } // Ensures date formatting
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(wb, "production_summary.xlsx");
  };

  return (
    <Container className="mt-4">
      <h3 className="mb-3">Production Summary</h3>

      {/* Filter Controls */}
      <div className="d-flex flex-row justify-content-between">
        <div>
      <Form className="d-flex gap-3 mb-3">
        <Form.Group>
          <Form.Label>Filter by Date:</Form.Label>
          <Form.Control type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </Form.Group>

        <Form.Group>
          <Form.Label>Show Rows:</Form.Label>
          <Form.Select value={minRows} onChange={(e) => setMinRows(Number(e.target.value))} style={{height:"2.5rem"}}>
            {[5, 10, 15, 20].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Form>
      </div>
      <div>
          {/* Export Buttons */}
          <div className="d-flex align-items-end gap-2">
          <Button variant="primary" onClick={handlePrint}>Print</Button>
          <Button variant="danger" onClick={exportToPDF}>Export PDF</Button>
          <Button variant="success" onClick={exportToExcel}>Export Excel</Button>
        </div>
      </div>
      </div>

      {/* Printable Table Wrapper */}
      <div id="printable-table">
        {/* Production Table */}
        <Table striped bordered hover ref={tableRef} id="summary-table" {...getTableProps()} className="text-center">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render("Header")}{" "}
                    <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default Summary;
