/* eslint-disable no-unused-vars, default-case */
import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Container, Modal, Form, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from "react-redux";
import {
  selectExpenses,
  useAddExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "../../features/api/ExpensesSlice";
import { LinearProgress } from "@mui/material";
import { Pencil, ArrowUp, ArrowDown } from "react-bootstrap-icons";
import { Delete, Search } from "@mui/icons-material";
import { toast } from "react-toastify";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { selectBranchScope } from "../../auth/authSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import { useSettings } from "../Settings";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";
import {
  paginateItems,
  ProductionTableFooter,
} from "./ProductionTableControls";

const EMPTY_ARRAY = [];

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

const searchableFields = ['category', 'description', 'givenTo', 'remarks', 'branchName'];

const FactoryExpenses = () => {
  const { settings } = useSettings();
  const currency = settings?.currency!=='none'?settings?.currency:"";
  const branchScope = useSelector(selectBranchScope);
  const currentBranchId = branchScope?.effective_branch_id ? String(branchScope.effective_branch_id) : "";
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches);

  useGetBranchesQuery();
  const branches = useSelector(selectBranches) ?? EMPTY_ARRAY;
  const expenses = useSelector(selectExpenses);
  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [String(branch.branchId), branch.branchName])),
    [branches]
  );
  const expensesWithBranch = useMemo(
    () =>
      (expenses ?? EMPTY_ARRAY).map((expense) => ({
        ...expense,
        branchId: expense.branchId ? String(expense.branchId) : "",
        branchName: expense.branchId ? branchMap.get(String(expense.branchId)) || "Unknown branch" : "Unassigned",
      })),
    [branchMap, expenses]
  );

  const {
    items: sortedExpenses,
    requestSort,
    sortConfig,
    setSearchTerm,
    searchTerm
  } = useTableSortSearch(expensesWithBranch, searchableFields);

  const [addExpense, {
    data,
    isLoading, isError, Error, isSuccess
  }] = useAddExpenseMutation();
  const [updateExpense, {data:updateData,isLoading: isUpdateLoading,isError: isUpdateError,Error: updateError,isSuccess: isUpdateSuccess}] = useUpdateExpenseMutation();
  const [deleteExpense, {data:deleteData,isLoading: isDeleteLoading,isError: isDeleteError,Error: deleteError,isSuccess: isDeleteSuccess}] = useDeleteExpenseMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const[expenseId, setExpenseId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newExpense, setNewExpense] = useState({
    branchId: currentBranchId,
    category: "",
    description: "",
    amount: "",
    givenTo: "",
    remarks: ""
  });

  const [isEdit, setisEdit] = useState(false);

  useEffect(() => {
    if (!isEdit && currentBranchId) {
      setNewExpense((previous) => ({ ...previous, branchId: previous.branchId || currentBranchId }));
    }
  }, [currentBranchId, isEdit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, rowsPerPage]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(sortedExpenses.length / rowsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [currentPage, rowsPerPage, sortedExpenses.length]);

  const {
    totalPages,
    paginatedItems: paginatedExpenses,
  } = useMemo(
    () => paginateItems(sortedExpenses, currentPage, rowsPerPage),
    [currentPage, rowsPerPage, sortedExpenses]
  );

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp />;
    }
    return <ArrowDown />;
  };

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
setNewExpense({ ...emp, branchId: emp.branchId ? String(emp.branchId) : currentBranchId });
setisEdit(true);
setShowModal(true);
  }

  const resetExpenseForm = () => {
    setNewExpense({
      branchId: currentBranchId,
      category: "",
      description: "",
      amount: "",
      givenTo: "",
      remarks: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.branchId) {
      toast.error("Select a branch before recording an expense.");
      return;
    }

    if (newExpense.amount && newExpense.category && newExpense.description) {
      try {
        const addResponse = await addExpense({...newExpense}).unwrap();
        toast.success(addResponse?.message || "Expense added successfully!");
        resetExpenseForm();
      } catch(error) { handleApiError(error); }
    }
  };

  const handleUpdateExpense = async() => {
    try {
      const updateResponse = await updateExpense({...newExpense}).unwrap();
      toast.success(updateResponse?.message || "Expense updated successfully!");
      resetExpenseForm();
      setisEdit(false);
      setShowModal(false);
    } catch(error) {
      handleApiError(error);
    }
  }

  return (
    <Container className="mt-4 production-section-shell">
      <div className="production-section-header">
        <div className="production-section-copy">
          <h2>Factory Expenses</h2>
          <p>Keep production spending visible with searchable records, totals, and faster editing flows.</p>
        </div>
        <PermissionWrapper required={['expensescreate']}>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add New Expense
          </Button>
        </PermissionWrapper>
      </div>

      <div className="production-filter-bar">
        <div className="production-filter-search">
          <InputGroup>
            <InputGroup.Text><Search /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by category, description, receiver, or remarks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="production-stat-row">
          <span className="production-stat-chip">Expenses: {sortedExpenses.length}</span>
          <span className="production-stat-chip">
            Branch: {currentBranchId ? branchMap.get(String(currentBranchId)) || "Current branch" : "All Branches"}
          </span>
          <span className="production-stat-chip">
            Total: {currency}{sortedExpenses.reduce((total, item) => total + (Number(item.amount) || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>

      <Modal show={showModal} onHide={() => {setShowModal(false); setisEdit(false);}} backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>{isEdit?<div>Edit Expense</div>:<div>Add Expense</div>}</Modal.Title>
        </Modal.Header>
        {isLoading?<LinearProgress />:""}
        {isUpdateLoading?<LinearProgress />:""}
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="production-form-grid">
              <Form.Group>
                <Form.Label>Branch</Form.Label>
                <Form.Select
                  name="branchId"
                  value={newExpense.branchId || ""}
                  onChange={handleChange}
                  disabled={!canSwitchBranches || isEdit}
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.branchId} value={String(branch.branchId)}>
                      {branch.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Control type="text" name="category" value={newExpense.category} onChange={handleChange} required />
              </Form.Group>

              <Form.Group>
                <Form.Label>Received By</Form.Label>
                <Form.Control type="text" name="givenTo" value={newExpense.givenTo} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="production-form-grid-single">
                <Form.Label>Description</Form.Label>
                <Form.Control type="text" name="description" value={newExpense.description} onChange={handleChange} required />
              </Form.Group>

              <Form.Group>
                <Form.Label>Amount ({currency || "UGX"})</Form.Label>
                <Form.Control type="number" min={100} name="amount" value={newExpense.amount} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="production-form-grid-single">
                <Form.Label>Remarks</Form.Label>
                <Form.Control type="text" name="remarks" value={newExpense.remarks} onChange={handleChange} required />
              </Form.Group>
            </div>
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
      <Modal show={showDeleteModal} onHide={() => handleDeleteModalClose()} backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
        Delete Alert!
        </Modal.Header>
        {isLoading?<LinearProgress />:""}
        <Modal.Body>
         <div className="production-modal-alert production-modal-alert-danger">
           You are about to delete an expense from the table.
         </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn btn-sm btn-light" onClick={handleDeleteModalClose}>Close</Button>
          {expenseId.length>0?isDeleteLoading? <Button className="btn btn-sm btn-danger" >Deleting</Button>: <Button className="btn btn-sm btn-danger" onClick={handleDeleteExpense}>Delete</Button>:
             <Button className="btn btn-sm btn-danger" disabled>Delete</Button>}
        </Modal.Footer>
      </Modal>

      <div className="production-table-card">
        <div className="production-table-scroll">
          <Table hover className="production-modern-table align-middle">
            <thead>
          <tr>
            <th>#</th>
            <th onClick={() => requestSort('expenseDateCreated')} className="production-sortable">
              Date {getSortIcon('expenseDateCreated')}
            </th>
            <th onClick={() => requestSort('category')} className="production-sortable">
              Category {getSortIcon('category')}
            </th>
            <th onClick={() => requestSort('branchName')} className="production-sortable">
              Branch {getSortIcon('branchName')}
            </th>
            <th onClick={() => requestSort('description')} className="production-sortable">
              Description {getSortIcon('description')}
            </th>
            <th onClick={() => requestSort('amount')} className="production-sortable">
              Amount ({currency}) {getSortIcon('amount')}
            </th>
            <th onClick={() => requestSort('givenTo')} className="production-sortable">
              Received By {getSortIcon('givenTo')}
            </th>
            <th onClick={() => requestSort('remarks')} className="production-sortable">
              Remarks {getSortIcon('remarks')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedExpenses.length > 0 ? (<>{
            paginatedExpenses.map((expense, index) => (
              <tr key={index}>
                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                <td>{expense.expenseDateCreated}</td>
                <td>{expense.category}</td>
                <td>{expense.branchName}</td>
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
         <tr className="production-total-row">
          <td colSpan={5} >Total: </td>
          <td>{currency}{sortedExpenses?.reduce((total, item) => total + (Number(item.amount) || 0), 0).toFixed(2)} </td>
          <td colSpan={3}></td>
          </tr> </> ) : (
            <tr>
              <td colSpan="9" className="text-center">No expenses recorded</td>
            </tr>
          )}
        </tbody>
      </Table>
        </div>
        <ProductionTableFooter
          totalItems={sortedExpenses.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemLabel="expenses"
        />
      </div>

    </Container>
  );
};

export default FactoryExpenses;
