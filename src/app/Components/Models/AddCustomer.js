
import React from "react";
import { useState } from "react";
import { useCreateCustomerMutation } from '../../features/api/customers';
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';

const AddCustomer = ({
    showModal,
    handleModalToggle
}) => {


    const [addCustomer, {data,isLoading, isError,error,isSuccess}] = useCreateCustomerMutation();

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        contact: '',
        email: '',
        location: '',
      });

    const handleAddCustomer = async () => {
        if (newCustomer.name && newCustomer.contact && newCustomer.email && newCustomer.location) {
         try {
           await addCustomer({
            cust_name:     newCustomer.name,
            cust_contact:  newCustomer.contact,
            cust_email:    newCustomer.email,
            cust_location: newCustomer.location,
           }).unwrap();
          setNewCustomer({ name: '', contact: '', email: '', location: '' });
          handleModalToggle();
         } catch (err) {
       console.log('Error: '+err);
         }
        }
       }

       const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer({ ...newCustomer, [name]: value });
      };

    return (<>
    {/* Modal for Adding a New Customer */}
    <Modal show={showModal} onHide={handleModalToggle} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>
                Name
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChange={handleInputChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>
                Contact
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  name="contact"
                  placeholder="Enter contact number"
                  value={newCustomer.contact}
                  onChange={handleInputChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>
                Email
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={newCustomer.email}
                  onChange={handleInputChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>
                Location
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  name="location"
                  placeholder="Enter location"
                  value={newCustomer.location}
                  onChange={handleInputChange}
                />
              </Col>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalToggle}>
            Close
          </Button>
          <Button variant="success" onClick={handleAddCustomer}>
          {isLoading?<div>isLoading...</div>:<div>Add Customer</div>}
          </Button>
        </Modal.Footer>
      </Modal>
    </>);

}
export default AddCustomer;