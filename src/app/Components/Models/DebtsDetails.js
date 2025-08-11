import React from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import { jsPDF } from 'jspdf';

const DebtDetailsModal = ({ show, handleClose, debtDetails }) => {
  const {
    customerName,
    productName,
    debtTakenDate,
    recentPayments,
    currentDate,
  } = debtDetails;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Debt Payment Details', 10, 10);

    // Add details
    doc.setFontSize(12);
    doc.text(`Customer Name: ${customerName}`, 10, 20);
    doc.text(`Product Name: ${productName}`, 10, 30);
    doc.text(`Debt Taken Date: ${debtTakenDate}`, 10, 40);
    doc.text(`Current Date: ${currentDate}`, 10, 50);

    // Add payments table
    doc.autoTable({
      startY: 60,
      head: [['Date', 'Amount']],
      body: recentPayments.map((payment) => [
        payment.date,
        `$${payment.amount.toFixed(2)}`,
      ]),
    });

    doc.save('debt-details.pdf');
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Recent Payments</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <p><strong>Customer Name:</strong> {customerName}</p>
          <p><strong>Product Name:</strong> {productName}</p>
          <p><strong>Debt Taken Date:</strong> {debtTakenDate}</p>
          <p><strong>Current Date:</strong> {currentDate}</p>

          <h5>Recent Deposits:</h5>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.date}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={exportToPDF}>
          Export to PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DebtDetailsModal;
