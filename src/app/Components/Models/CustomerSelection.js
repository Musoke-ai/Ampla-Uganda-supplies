import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectCustomers } from '../../features/api/customers';
import AddCustomer from './AddCustomer';
import { PlusSquare } from 'react-bootstrap-icons';


const CustomerSelection = ({
  setCustId,
  custId,
  setCustomer,
  customersOverride,
  className = "",
}) => {

  const allCustomers = useSelector(selectCustomers);
  const customers = customersOverride ?? allCustomers;

  const [showModal, setShowModal] = useState(false);

  const handleModalToggle = () => setShowModal(!showModal);

  const handleCustomerSelect = (e) => {
    setCustId(e.target.value);
    const customer = customers.find((cust) => Number(cust.custId) === Number(e.target.value)) || null;
    setCustomer(customer);
  }

  return (
    <div className={`customer-selection ${className}`.trim()}>
      <div className="customer-selection__field">
        <Form className='mb-0'>
          <Form.Group controlId="customerSelect">
            <Form.Select value={custId} onChange={handleCustomerSelect} className='w-100' style={{height:'44px'}}>
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
      <div className="customer-selection__action">
        <Button variant="primary" onClick={handleModalToggle} className="customer-selection__button">
          <PlusSquare />
        </Button>
      </div>

      <AddCustomer showModal={showModal} handleModalToggle={handleModalToggle} />
    </div>
  );
};

export default CustomerSelection;
