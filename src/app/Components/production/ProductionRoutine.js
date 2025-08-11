import React, { useState } from "react";
import { Card, Button, Form, Modal, Table } from "react-bootstrap";

const ProductionProcess = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [payroll, setPayroll] = useState("");
  const [role, setRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([
    { id: 1, name: "Cardboard Sheets", quantity: 100 },
    { id: 2, name: "Glue", quantity: 50 },
  ]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);

  const addWorker = () => {
    if (selectedWorker && payroll && role) {
      setWorkers([...workers, { name: selectedWorker, payroll, role }]);
      setSelectedWorker("");
      setPayroll("");
      setRole("");
    }
  };

  const removeWorker = (index) => {
    setWorkers(workers.filter((_, i) => i !== index));
  };

  return (
    <div className="container mt-4">
      <div className="row g-4">
        {/* Worker Registration */}
        <div className="col-md-4">
          <Card>
            <Card.Body>
              <h5>Register Workers</h5>
              <Form.Select onChange={(e) => setSelectedWorker(e.target.value)} style={{height:"2.5rem"}}>
                <option value="">Select a worker</option>
                <option value="Worker 1">Worker 1</option>
                <option value="Worker 2">Worker 2</option>
              </Form.Select>
              <Form.Control
                type="number"
                placeholder="Payroll Amount"
                className="mt-2"
                value={payroll}
                onChange={(e) => setPayroll(e.target.value)}
              />
              <Form.Control
                type="text"
                placeholder="Role"
                className="mt-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <Button className="mt-3 me-2" onClick={addWorker}>Add to Payroll</Button>
              <Button className="mt-3 ms-2 me-2" onClick={() => setShowModal(true)}>View Workers</Button>
            </Card.Body>
          </Card>
        </div>

        {/* Raw Material Registration */}
        <div className="col-md-4">
          <Card>
            <Card.Body>
              <h5>Register Raw Materials</h5>
              {rawMaterials.map((material) => (
                <div key={material.id} className="d-flex align-items-center gap-2">
                  <Form.Check type="checkbox" id={material.name} />
                  <label htmlFor={material.name}>{material.name} ({material.quantity} available)</label>
                  <Form.Control type="number" placeholder="Quantity taken" className="w-25" />
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>

        {/* Expense Registration */}
        <div className="col-md-4">
          <Card>
            <Card.Body>
              <h5>Register Expenses</h5>
              <Form.Control type="text" placeholder="Expense Description" />
              <Form.Control type="number" placeholder="Amount" className="mt-2" />
              <Button className="mt-2">Add Expense</Button>
            </Card.Body>
          </Card>
        </div>

        {/* Product Registration */}
        <div className="col-md-4">
          <Card>
            <Card.Body>
              <h5>Register Products Produced</h5>
              <Form.Control type="text" placeholder="Product Name" />
              <Form.Control type="number" placeholder="Quantity" className="mt-2" />
              <Button className="mt-2">Add Product</Button>
            </Card.Body>
          </Card>
        </div>

        {/* Worker Payment */}
        <div className="col-md-4">
          <Card>
            <Card.Body>
              <h5>Handle Worker Payments</h5>
              <Form.Select style={{height:"2.5rem"}}>
                <option>Select a worker</option>
                <option value="Worker 1">Worker 1</option>
                <option value="Worker 2">Worker 2</option>
              </Form.Select>
              <Form.Control type="number" placeholder="Payment Amount" className="mt-2" />
              <Button className="mt-2">Process Payment</Button>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modal to Display Workers */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Registered Workers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {workers.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Payroll</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker, index) => (
                  <tr key={index}>
                    <td>{worker.name}</td>
                    <td>{worker.role}</td>
                    <td>${worker.payroll}</td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => removeWorker(index)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No workers registered.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductionProcess;
