import React, { useState } from "react";
import { Table, Button, Container, Modal, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from "react-redux";
import { selectExpenses, useAddExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } from "../../features/api/ExpensesSlice";
import { LinearProgress } from "@mui/material";
import { Pencil } from "react-bootstrap-icons";
import { Delete } from "@mui/icons-material";

import { toast } from 'react-toastify';
import PermissionWrapper from "../../auth/PermissionWrapper";
import { selectPermissions } from "../../auth/authSlice";
import { useSettings } from "../Settings";

const handleApiError = (error) => {
  const status = error?.status || 'unknown';
  const message = error?.data?.message;

  let toastMessage = `An unexpected error occurred: ${message || 'Unknown error'}`;

  switch (status) {
      case 400:
          toastMessage = message || 'Bad request. Please check your input.';
          break;
      case 401:
          toastMessage = message || 'Unauthorized. Please log in.';
          break;
      case 404:
          toastMessage = message || 'Resource not found.';
          break;
      case 500:
          toastMessage = message || 'Server error. Please try again later.';
          break;
  }
  toast.error(toastMessage, { autoClose: 4000 });
};

const FactoryExpenses = () => {
  const { settings } = useSettings();
  const currency = settings?.currency!=='none'?settings?.currency:"";

  const expenses = useSelector(selectExpenses);

  const [addExpense, {data,isLoading,isError,Error,isSuccess}] = useAddExpenseMutation();
  const [updateExpense, {data:updateData,isLoading: isUpdateLoading,isError: isUpdateError,Error: updateError,isSuccess: isUpdateSuccess}] = useUpdateExpenseMutation();
  const [deleteExpense, {data:deleteData,isLoading: isDeleteLoading,isError: isDeleteError,Error: deleteError,isSuccess: isDeleteSuccess}] = useDeleteExpenseMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const[expenseId, setExpenseId] = useState("");
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: "",
    givenTo: "",
    remarks: ""
  });

  const [isEdit, setisEdit] = useState(false);

  const handleDeleteModalClose = () => {
setShowDeleteModal(false);
setisEdit(false);
setExpenseId("");
  }

  const handleDeleteExpense = async () => {
    try{
      const deleteResponse = await deleteExpense({id: expenseId}).unwrap();
      toast.success(deleteResponse?.message || "Expense deleted successfully!");
      handleDeleteModalClose();
    }catch(error){ handleApiError(error); }
  }

  const handleChange = (e) => {
    setNewExpense({ ...newExpense, [e.target.name]: e.target.value });
  };

  const handleEdit = (emp) => {
setNewExpense(emp);
setisEdit(true);
setShowModal(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newExpense.amount && newExpense.category && newExpense.description) {
      try {
        const addResponse = await addExpense({...newExpense}).unwrap();
        toast.success(addResponse?.message || "Expense added successfully!");
        setNewExpense({
          category: "",
          description: "",
          amount: "",
          givenTo: "",
          remarks: ""
        });
      } catch(error) { handleApiError(error); }
    }
  };

  const handleUpdateExpense = async() => {
    try {
      const updateResponse = await updateExpense({...newExpense}).unwrap();
      toast.success(updateResponse?.message || "Expense updated successfully!");
      setNewExpense({
        category: "",
        description: "",
        amount: "",
        givenTo: "",
        remarks: ""
      });
      setisEdit(false);
      setShowModal(false);
    } catch(error) {
      handleApiError(error);
    }
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-3">Factory Expenses</h2>
      <PermissionWrapper required={['expensescreate']} children={
      <Button variant="primary" onClick={() => setShowModal(true)} className="mb-3">
        Add New Expense
      </Button>
      } />
      <Modal show={showModal} onHide={() => {setShowModal(false); setisEdit(false);}}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit?<div>Edit Expense</div>:<div>Add Expense</div>}</Modal.Title>
        </Modal.Header>
        {isLoading?<LinearProgress />:""}
        {isUpdateLoading?<LinearProgress />:""}
        <Modal.Body>
          <Form onSubmit={handleSubmit}>  
          <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control type="text" name="category" value={newExpense.category} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control type="text" name="description" value={newExpense.description} onChange={handleChange} required />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Amount (UGX)</Form.Label>
              <Form.Control type="number" min={100} name="amount" value={newExpense.amount} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Received By</Form.Label>
              <Form.Control type="text" name="givenTo" value={newExpense.givenTo} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control type="text" name="remarks" value={newExpense.remarks} onChange={handleChange} required />
            </Form.Group>
            {isUpdateSuccess?<div>{updateData.message}</div>:""}
            {isEdit?<div>
              {isUpdateLoading?<Button variant="primary">Saving expense</Button>:<Button variant="primary" onClick={handleUpdateExpense}>Save expense</Button>}
            </div>
            :<div>
     {isLoading?<Button variant="primary">Adding expense</Button>:<Button variant="primary" type="submit">Add Expense</Button>}
            </div>
            }
            
          </Form>
        </Modal.Body>
      </Modal>
      <Modal show={showDeleteModal} onHide={() => handleDeleteModalClose()}>
        <Modal.Header closeButton>
        Delete Alert!
        </Modal.Header>
        {isLoading?<LinearProgress />:""}
        <Modal.Body>
         <p className="text-danger fw-bold"> You are about to delete expesnse from the tables</p>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn btn-sm btn-light">Close</Button>
          {expenseId.length>0?isDeleteLoading? <Button className="btn btn-sm btn-danger" >Deleting</Button>: <Button className="btn btn-sm btn-danger" onClick={handleDeleteExpense}>Delete</Button>:
             <Button className="btn btn-sm btn-danger" disabled>Delete</Button>}
        </Modal.Footer>
      </Modal>
      
      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount (USH)</th>
            <th>Received By</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length > 0 ? (<>{
            expenses.map((expense, index) => (
              <tr key={index}>
                <td>{index+1}</td>
                <td>{expense.expenseDateCreated}</td>
                <td>{expense.category}</td>
                <td>{expense.description}</td>
                <td>{currency}{expense.amount}</td>
                <td>{expense.givenTo}</td>
                <td>{expense.remarks}</td>
                <td><div className="d-flex flex-row justify-content-between gap-2">
                  <div>
                    <PermissionWrapper required={["expensesupdate"]} children={<Button className="bg-transparent btn-dark" onClick={() => handleEdit(expense)}><Pencil className="text-info" /></Button>} />
                    </div>
                  <div>
                    <PermissionWrapper required={["expensesdelete"]} children={<Button className="bg-transparent btn-dark" onClick={()=>{setShowDeleteModal(true);setExpenseId(expense.id)}}><Delete className="text-danger" /></Button>}/>
                    </div>
                  </div></td>
              </tr>
            ))}
         <tr className="fs-5 fw-bold">
          <td colspan={4} >Total: </td>
          <td>{currency}{expenses?.reduce((prev, curr) => prev+Number(curr.amount)||0, 0)} </td>
          </tr> </> ) : (
            <tr>
              <td colSpan="3" className="text-center">No expenses recorded</td>
            </tr>
          )}
        </tbody>
      </Table>

    </Container>
  );
};

export default FactoryExpenses;
