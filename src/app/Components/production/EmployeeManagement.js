import { useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Button, Modal, Form, InputGroup } from "react-bootstrap";

import { useSelector } from "react-redux";
import { selectEmployees } from "../../features/api/employeesSlice";
import { useAddEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation } from "../../features/api/employeesSlice";
import { LinearProgress } from "@mui/material";
import EmployeeDailyList from "./Process/EmployeeDailyList";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { Delete, Edit, Search } from "@mui/icons-material";
import { ArrowUp, ArrowDown } from "react-bootstrap-icons";
import { toast } from 'react-toastify';
import { useSettings } from "../Settings";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";

// Define which fields in the employee object are searchable
const searchableFields = ['empName', 'empRole', 'empContact', 'empEmail', 'empLocation'];

/**
 * EmployeeManagement component for handling CRUD operations for employees.
 * It uses Redux Toolkit for state management, RTK Query for API calls,
 * and React Bootstrap for UI components.
 */
const EmployeeManagement = () => {
// Get currency settings from context
const { settings } = useSettings();
const currency = settings.currency!=='none'?settings?.currency:"";
const theme = settings.theme;

  // Defines the initial state structure for an employee object.
  const initialEmployeeState = { empID: "", empName: "", empRole: "", empContact: "", empEmail: "", empLocation: "", empSalary: "", empStatus: 1, startDate: "", endDate: "" };

  // --- Redux and RTK Query Hooks ---
  // Selectors to get data from the Redux store.
  const employees = useSelector(selectEmployees);
  // RTK Query mutations for adding, updating, and deleting employees.
  // These hooks return a tuple: a trigger function and an object with metadata (isLoading, isError, etc.).
  const [addEmployee, {isLoading,isError,Error,isSuccess}] = useAddEmployeeMutation();
  const [updateEmployee, {isLoading:isUpdateLoading,isError:isUpdateError,Error:updateError,isSuccess:isUpdateSuccess}] = useUpdateEmployeeMutation();
  const [deleteEmployee, {data:deleteData, isLoading:isDeleteLoading, isError:isDeleteError, Error:deleteError,isSuccess:isDeleteSuccess}] = useDeleteEmployeeMutation();
  
  // --- Search and Sort Logic ---
  // Filter out any employees without a name before passing to the hook
  const validEmployees = useMemo(() => employees.filter(e => e.empName && e.empName.length > 0), [employees]);

  // Apply the custom hook for search and sort functionality
  const {
    items: sortedEmployees,
    requestSort,
    sortConfig,
    setSearchTerm,
    searchTerm
  } = useTableSortSearch(validEmployees, searchableFields, { key: 'empName', direction: 'ascending' });

  // Helper to display sort direction icon in table headers
  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ms-1" /> : <ArrowDown className="ms-1" />;
  };
  // --- Component State Management ---
  // State for controlling the visibility of modals and alerts.
  const [showModal, setShowModal] = useState(false);
  const [showDailyList, setShowDailyList] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  // State to hold the employee data currently being added or edited in the form.
  const [currentEmployee, setCurrentEmployee] = useState(initialEmployeeState);
  // State to hold the original employee data to check for changes.
  const [originalEmployee, setOriginalEmployee] = useState(null);
  // State to track if the modal is in "edit" mode or "add" mode.
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Opens the main modal for adding or editing an employee.
   * @param {object} employee - The employee object to edit. Defaults to an empty state for adding.
   */
  const handleShowModal = (employee = initialEmployeeState) => {
    setCurrentEmployee(employee);
    setOriginalEmployee(employee); // Store the original state for comparison
    setIsEditing(!!employee.empID);
    setShowModal(true);
  };

  /**
   * Opens the confirmation alert for deleting an employee.
   * @param {object} employee - The employee to be deleted.
   */
  const handleShowAlert = (employee = initialEmployeeState) => {
    setCurrentEmployee(employee);
    setIsEditing(!!employee.empID);
    setShowAlert(true);
  };

  /**
   * A generic handler for form input changes.
   * Updates the `currentEmployee` state based on the input's name and value.
   * @param {Event} e - The input change event.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentEmployee(prev => ({ ...prev, [name]: value }));
  };

  // Closes the delete confirmation alert and resets the employee state.
  const handleCloseAlert = () => {
    setShowAlert(false);
    setCurrentEmployee(initialEmployeeState);
  };

  // Closes the main modal and resets the form state.
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentEmployee(initialEmployeeState);
    setOriginalEmployee(null);
    setIsEditing(false);
  };

  // --- API Interaction Functions ---

  // A boolean to check if the employee data has been changed in the form.
  const hasChanges = isEditing ? JSON.stringify(currentEmployee) !== JSON.stringify(originalEmployee) : true;

    /**
   * Handles adding a new employee.
   * Calls the `addEmployee` mutation and shows a success or error toast.
   */
  const handleAddEmployee = async() => {
    try{
const add =  await addEmployee({
  ...currentEmployee
}).unwrap();
handleCloseModal();
toast.success(add.message || 'Employee added successfully!');
    } catch(error){
      toast.error(error?.data?.message || 'Employee creation failed!');

    }finally{

    }
  
  };

  /**
   * Handles updating an existing employee.
   * Calls the `updateEmployee` mutation and shows a success or error toast.
   */
  const handleUpdateEmployee = async() => {
    try{
const update =  await updateEmployee({
  ...currentEmployee
}).unwrap();
handleCloseModal();
toast.success(update?.message || 'Employee updated successfully');
    } catch(error){
      toast.error(error?.data?.message || 'Employee update failed!');
console.log("error: "+error.status)
    }finally{

    }
  
  };

/**
 * Handles changing the status of an employee (active/inactive).
 * This function is currently not used in the UI but is available.
 * @param {number} status - The new status for the employee (e.g., 1 for active, 0 for inactive).
 */
const handleEmpStatus = async(status) => {
  try{
    const update =  await updateEmployee({
      ...currentEmployee,
      empStatus: status
    }).unwrap();
  }catch(error){
console.log("Error: "+error);
  }
}

  /**
   * Handles deleting an employee.
   * Calls the `deleteEmployee` mutation and shows a success or error toast.
   */
  const handleDeleteEmployee = async() => {
    try{
const _delete = await deleteEmployee({...currentEmployee}).unwrap();
toast.success(_delete?.message || 'Employee deleted successfully');
    } catch(error){
      toast.error(error?.data?.message || 'Employee deletion failed');
    }
    finally{

    }
  
  };

  return (
    // Main container for the component
    <div className="container mt-4">
      <h2>Employee Management</h2>
      <div className="d-flex flex-row justify-content-between">
        <PermissionWrapper required={['employeescreate']} children={
          <>
      <Button variant="primary" onClick={() => handleShowModal()}>Add Employee</Button>
      <Button variant="info" onClick={() => setShowDailyList(true)}>Daily List</Button>
      </>
        } />
      </div>

      {/* Search Input */}
      <div className="mt-3" style={{ maxWidth: '400px' }}>
        <InputGroup>
          <InputGroup.Text className={`${theme==='dark'?'text-white':'text-dark'}`}><Search /></InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>
     
      {/* Employee Data Table */}
      <Table striped bordered hover className="mt-3">
        <thead className="table-dark">
          <tr>
            <th onClick={() => requestSort('empID')} className="sortable-header"># {getSortIcon('empID')}</th>
            <th onClick={() => requestSort('empName')} className="sortable-header">Name {getSortIcon('empName')}</th>
            <th onClick={() => requestSort('empRole')} className="sortable-header">Role {getSortIcon('empRole')}</th>
            <th onClick={() => requestSort('empContact')} className="sortable-header">Contact {getSortIcon('empContact')}</th>
            <th onClick={() => requestSort('empEmail')} className="sortable-header">Email {getSortIcon('empEmail')}</th>
            <th onClick={() => requestSort('empLocation')} className="sortable-header">Location {getSortIcon('empLocation')}</th>
            <th onClick={() => requestSort('empSalary')} className="sortable-header">Daily Pay {getSortIcon('empSalary')}</th>
            <th onClick={() => requestSort('empStatus')} className="sortable-header">Status {getSortIcon('empStatus')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Conditionally render rows if employees exist, otherwise show a message */}
          {sortedEmployees.length > 0 ? (
            <>
 {sortedEmployees.map((emp, idx) => (
            <tr key={emp.empID}>
              <td>{idx+1}</td>
              <td>{emp?.empName}</td>
              <td>{emp?.empRole}</td>
              <td>{emp?.empContact}</td>
              <td>{emp?.empEmail}</td>
              <td>{emp?.empLocation}</td>
              <td>{currency}{emp?.empSalary}</td>
              <td>{Number(emp?.empStatus) === 1?"active":"Inactive"}</td>
              <td className="d-flex flex-wrap gap-1">
                {/* <Button variant="success" size="sm" onClick={() => { let status; Number(emp.empStatus) === 1?status=0:status=1;handleEmpStatus(status);}}>{isUpdateLoading?Number(emp?.empStatus) === 1?"Deactivating...":"Activating...":Number(emp?.empStatus) === 1?"Deactivate":"Activate"}</Button> */}
                <PermissionWrapper required={['employeesupdate']} children={<Button variant="info" size="sm" className="text-white" onClick={() => handleShowModal(emp)}><Edit /></Button>} />
                <PermissionWrapper required={['employeesdelete']} children={<Button variant="danger" size="sm"  className="text-white" onClick={() => handleShowAlert(emp)}><Delete/></Button>} />
              </td>
            </tr>
          ))}
          {/* Footer row to display the total salary */}
          <tr >
            <td colSpan={6} className="fs-5 fw-bold" >Total:</td>
            <td className="fs-6 fw-bold">{currency}{sortedEmployees.reduce((prev, curr) => prev + Number(curr.empSalary) || 0, 0)}</td>
          </tr>
            </>
          ) : (
            <tr><td colSpan="9" className="text-center">No Employees Data</td></tr>
          )
          }
        </tbody>
      </Table>

      {/* Add/Edit Employee Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Employee" : "Add Employee"}</Modal.Title>
        </Modal.Header>
        {isLoading?<div><LinearProgress /></div>:""}
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="empName" value={currentEmployee.empName} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Control type="text" name="empRole" value={currentEmployee.empRole} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Daily Pay</Form.Label>
              <Form.Control type="number" name="empSalary" value={currentEmployee.empSalary} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Contact</Form.Label>
              <Form.Control type="text" name="empContact" value={currentEmployee.empContact} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="empEmail" value={currentEmployee.empEmail} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Location</Form.Label>
              <Form.Control type="text" name="empLocation" value={currentEmployee.empLocation} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="Date" name="startDate" value={currentEmployee.startDate} onChange={handleChange} />
            </Form.Group>
            {isEditing?<Form.Group>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="Date" name="endDate" value={currentEmployee.endDate} onChange={handleChange} />
            </Form.Group>:""}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={isEditing ? handleUpdateEmployee : handleAddEmployee} disabled={isLoading || isUpdateLoading || !hasChanges}>
            {isEditing ? (isUpdateLoading ? 'Updating...' : 'Update') : (isLoading ? 'Saving...' : 'Save')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Daily List Modal */}
      <Modal show={showDailyList} onHide={()=>setShowDailyList(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Daily List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
         <EmployeeDailyList setShowModal={setShowModal} showModal={showModal}/>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDailyList(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showAlert} onHide={handleCloseAlert}>
        <Modal.Header closeButton>
          <Modal.Title><div className="text-danger">You are about to delete an employee from the table!</div></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDeleteLoading?<div>Deleting...</div>:""}
          {isDeleteError?<div>Something has gone wrong: {deleteError}</div>:""}
          {isDeleteSuccess?<div>{deleteData.message}</div>:""}
        </Modal.Body>
        <Modal.Footer>
         
          <Button variant="secondary" onClick={handleCloseAlert}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteEmployee} disabled={isDeleteLoading}>
            {isDeleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
