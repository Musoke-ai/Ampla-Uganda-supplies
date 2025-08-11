import React, { useState } from 'react';
import { Button, Table, Modal, Form, ProgressBar, Row, Col } from 'react-bootstrap';
import { format, differenceInDays } from 'date-fns';

const DebtPage = () => {
  const [debts, setDebts] = useState([
    { id: 1, customer: 'John Doe', product: 'Laptop', total: 10000, paid: 3000, date: new Date(), duration: 30 },
    { id: 2, customer: 'Jane Smith', product: 'Phone', total: 5000, paid: 2000, date: new Date(), duration: 15 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [newDebt, setNewDebt] = useState({ customer: '', product: '', total: '', date: '', duration: '' });
  const [payAmount, setPayAmount] = useState('');
  const [currentDebtId, setCurrentDebtId] = useState(null);
  const [filters, setFilters] = useState({ customer: '', product: '', date: '' });

  const handleAddDebt = () => {
    if (newDebt.customer && newDebt.product && newDebt.total && newDebt.date && newDebt.duration) {
      setDebts([
        ...debts,
        {
          id: debts.length + 1,
          ...newDebt,
          total: parseFloat(newDebt.total),
          paid: 0,
          date: new Date(newDebt.date),
          duration: parseInt(newDebt.duration),
        },
      ]);
      setNewDebt({ customer: '', product: '', total: '', date: '', duration: '' });
      setShowAddModal(false);
    }
  };

  const handleOpenPayModal = (id) => {
    setCurrentDebtId(id);
    setShowPayModal(true);
  };

  const handlePayDebt = () => {
    if (payAmount >= 1000) {
      setDebts(debts.map(debt =>
        debt.id === currentDebtId
          ? { ...debt, paid: Math.min(debt.paid + parseFloat(payAmount), debt.total) }
          : debt
      ));
      setPayAmount('');
      setShowPayModal(false);
    }
  };

  const calculateRemainingDays = (date, duration) => {
    const expirationDate = new Date(date);
    expirationDate.setDate(expirationDate.getDate() + duration);
    return differenceInDays(expirationDate, new Date());
  };

  const filteredDebts = debts.filter((debt) => {
    const matchesCustomer = debt.customer.toLowerCase().includes(filters.customer.toLowerCase());
    const matchesProduct = debt.product.toLowerCase().includes(filters.product.toLowerCase());
    const matchesDate = filters.date ? format(new Date(debt.date), 'yyyy-MM-dd') === filters.date : true;
    return matchesCustomer && matchesProduct && matchesDate;
  });

  return (
    <div className="container mt-4">
      <div className='d-flex justify-content-between'>
        <div> <h2>Debt Management</h2></div>
        <div>{/* Add Debt Button */}
<Button variant="primary" onClick={() => setShowAddModal(true)}>
  Add Debt
</Button></div>
      </div>
     

      {/* Filters */}
      <div className="mt-4">
        <Row>
          <Col>
            <Form.Control
              type="text"
              placeholder="Filter by customer"
              value={filters.customer}
              onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
            />
          </Col>
          <Col>
            <Form.Control
              type="text"
              placeholder="Filter by product"
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
            />
          </Col>
          <Col>
            <Form.Control
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </Col>
        </Row>
      </div>

      {/* Debt Table */}
      <Table
        hover
        className="mt-4"
        style={{
          borderCollapse: 'separate',
          borderSpacing: '0 10px',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#f9f9f9',
        }}
      >
        <thead>
          <tr>
            <th>Customer</th>
            <th>Product</th>
            <th>Date</th>
            <th>Duration (days)</th>
            <th>Remaining (days)</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Remaining Amount</th>
            <th>Progress</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredDebts.map(debt => (
            <tr key={debt.id} style={{ backgroundColor: '#ffffff', boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' }}>
              <td>{debt.customer}</td>
              <td>{debt.product}</td>
              <td>{format(new Date(debt.date), 'yyyy-MM-dd')}</td>
              <td>{debt.duration}</td>
              <td>{calculateRemainingDays(debt.date, debt.duration)}</td>
              <td>${debt.total}</td>
              <td>${debt.paid}</td>
              <td>${debt.total - debt.paid}</td>
              <td>
                <ProgressBar
                  now={(debt.paid / debt.total) * 100}
                  label={`${((debt.paid / debt.total) * 100).toFixed(0)}%`}
                />
              </td>
              <td>
                <Button
                  variant="success"
                  onClick={() => handleOpenPayModal(debt.id)}
                >
                  Pay
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add Debt Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Debt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Form Fields */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddDebt}>
            Add Debt
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pay Debt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Payment Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount to pay (min 1000)"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPayModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handlePayDebt}
            disabled={payAmount < 1000}
          >
            Pay
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DebtPage;
