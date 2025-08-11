import React, { useState } from 'react';
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectCustomers } from '../../features/api/customers';
import AddCustomer from './AddCustomer';
import { PlusSquare } from 'react-bootstrap-icons';


const CustomerSelection = ({
  setCustId,
  custId,
  setCustomer
}) => {

  const customers = useSelector(selectCustomers);

  const [showModal, setShowModal] = useState(false);

  const handleModalToggle = () => setShowModal(!showModal);

  const handleCustomerSelect = (e) => {
    setCustId(e.target.value);
    const customer = customers.filter(cust => Number(cust.custId) === Number(e.target.value));
    console.log("cust1: "+customer);
    setCustomer(customer);
  }

  return (
    <div className="container mt-4 d-flex gap-2 w-100 align-items-center">
      {/* <h6 className="mb-4 fw-bold">Select Customer for this Transaction</h6> */}
      <div>
<Form className='mb-2 mt-2'>
        {/* Customer Selection */}
        <Form.Group controlId="customerSelect">
          {/* <Form.Label>Customer</Form.Label> */}
          <Form.Select value={custId} onChange={handleCustomerSelect} className='w-100' style={{height:'50px'}}>
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.custId} value={customer.custId}>
                {customer.custName} - {customer.custContact}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
           </Form>
      </div>
        {/* Add New Customer Button */}
        <div>
          <Button variant="primary" onClick={handleModalToggle}>
       <PlusSquare />
        </Button>
        </div>

      {/* Modal for Adding a New Customer */}
      <AddCustomer showModal={showModal} handleModalToggle={handleModalToggle} />
    </div>
  );
};

export default CustomerSelection;
