
import React, { useEffect, useMemo } from "react";
import { useState } from "react";
import { useCreateCustomerMutation } from '../../features/api/customers';
import { useGetBranchesQuery, selectBranches } from "../../features/api/branchesSlice";
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';
import { useSelector } from "react-redux";
import { selectBranchScope } from "../../auth/authSlice";

const AddCustomer = ({
    showModal,
    handleModalToggle
}) => {

    useGetBranchesQuery();
    const branches = useSelector(selectBranches) ?? [];
    const branchScope = useSelector(selectBranchScope) ?? {};
    const currentBranchId = branchScope?.effective_branch_id ? String(branchScope.effective_branch_id) : "";
    const canSwitchBranches = Boolean(branchScope?.can_switch_branches);
    const visibleBranches = useMemo(() => {
      if (canSwitchBranches || !currentBranchId) {
        return branches;
      }

      return branches.filter((branch) => String(branch.branchId) === currentBranchId);
    }, [branches, canSwitchBranches, currentBranchId]);

    const [addCustomer, {data,isLoading, isError,error,isSuccess}] = useCreateCustomerMutation();

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        contact: '',
        email: '',
        location: '',
        branchId: '',
      });

    const canSubmitCustomer = [
      newCustomer.branchId,
      newCustomer.name,
      newCustomer.contact,
      newCustomer.email,
      newCustomer.location,
    ].every((value) => String(value ?? "").trim()) && !isLoading;

    useEffect(() => {
      if (currentBranchId) {
        setNewCustomer((previous) => ({
          ...previous,
          branchId: previous.branchId || currentBranchId,
        }));
      }
    }, [currentBranchId]);

    const handleAddCustomer = async () => {
        if (canSubmitCustomer) {
         try {
           await addCustomer({
            cust_name:     newCustomer.name,
            cust_contact:  newCustomer.contact,
            cust_email:    newCustomer.email,
            cust_location: newCustomer.location,
            branch_id:     newCustomer.branchId,
           }).unwrap();
          setNewCustomer({ name: '', contact: '', email: '', location: '', branchId: currentBranchId });
          handleModalToggle();
         } catch (err) {
       console.log('Error: '+err);
         }
        }
       }

       const handleSafeModalClose = () => {
        if (!isLoading) {
          handleModalToggle();
        }
      };

       const handleInputChange = (e) => {
        if (isLoading) {
          return;
        }
        const { name, value } = e.target;
        setNewCustomer({ ...newCustomer, [name]: value });
      };

    return (<>
    {/* Modal for Adding a New Customer */}
    <Modal
      show={showModal}
      onHide={handleSafeModalClose}
      backdrop={isLoading ? "static" : true}
      keyboard={!isLoading}
      centered
      className="add-customer-modal"
      backdropClassName="add-customer-backdrop"
      dialogClassName="add-customer-dialog"
    >
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={3}>
                Branch
              </Form.Label>
              <Col sm={9}>
                <Form.Select
                  name="branchId"
                  value={newCustomer.branchId}
                  onChange={handleInputChange}
                  disabled={isLoading || (!canSwitchBranches && Boolean(currentBranchId))}
                >
                  <option value="">Select branch</option>
                  {visibleBranches.map((branch) => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </Col>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleSafeModalClose} disabled={isLoading}>
            Close
          </Button>
          <Button variant="success" onClick={handleAddCustomer} disabled={!canSubmitCustomer}>
          {isLoading?<div>Saving customer...</div>:<div>Add Customer</div>}
          </Button>
        </Modal.Footer>
      </Modal>
    </>);

}
export default AddCustomer;
