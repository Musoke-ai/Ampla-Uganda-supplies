import React from 'react';
import { Table, Badge } from 'react-bootstrap';

const DebtsTable = () => {
  const debts = [
    {
      id: 1,
      productName: 'Wireless Headphones',
      quantity: 5,
      customerName: 'John Doe',
      transactionDate: '2024-11-15',
      dueDate: '2024-12-01',
      status: 'Pending',
    },
    {
      id: 2,
      productName: 'Smart Speaker',
      quantity: 2,
      customerName: 'Jane Smith',
      transactionDate: '2024-11-10',
      dueDate: '2024-11-25',
      status: 'Overdue',
    },
    {
      id: 3,
      productName: 'Bluetooth Mouse',
      quantity: 3,
      customerName: 'Michael Brown',
      transactionDate: '2024-11-18',
      dueDate: '2024-12-05',
      status: 'Paid',
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <Badge bg="success">Paid</Badge>;
      case 'Overdue':
        return <Badge bg="danger">Overdue</Badge>;
      default:
        return <Badge bg="warning">Pending</Badge>;
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Customer Debts</h3>
      <Table bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Customer Name</th>
            <th>Transaction Date</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt, index) => (
            <tr key={debt.id}>
              <td>{index + 1}</td>
              <td>{debt.productName}</td>
              <td>{debt.quantity}</td>
              <td>{debt.customerName}</td>
              <td>{debt.transactionDate}</td>
              <td>{debt.dueDate}</td>
              <td>{getStatusBadge(debt.status)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DebtsTable;
