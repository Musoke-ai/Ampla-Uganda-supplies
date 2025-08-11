import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Button, IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const InvoicesManager = () => {
  const [invoices, setInvoices] = useState([
    { id: 1, customerName: "John Doe", status: "Paid", total: 150.0 },
    { id: 2, customerName: "Jane Smith", status: "Unpaid", total: 300.0 },
    { id: 3, customerName: "Acme Corp", status: "Overdue", total: 450.0 },
  ]);

  const handleEdit = (id) => {
    alert(`Edit invoice #${id}`);
    // Logic for editing the invoice
  };

  const handleDelete = (id) => {
    setInvoices(invoices.filter((invoice) => invoice.id !== id));
    alert(`Deleted invoice #${id}`);
  };

  const handleCreate = () => {
    alert("Create a new invoice");
    // Logic for navigating to a new invoice creation page or showing a form
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Invoices</h2>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreate}
        style={{ marginBottom: "20px" }}
      >
        Create New Invoice
      </Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Invoice #</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>{invoice.customerName}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>${invoice.total.toFixed(2)}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleEdit(invoice.id)} color="primary">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(invoice.id)} color="error">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoicesManager;
