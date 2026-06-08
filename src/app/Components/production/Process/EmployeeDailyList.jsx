/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import { useSelector } from "react-redux";
import { selectEmployees } from "../../../features/api/employeesSlice";
import { selectEmployeeDailyList } from "../../../features/api/dailyEmployeesList";
import { useAddEmployeeDailyListMutation, useUpdateEmployeeDailyListMutation, useDeleteEmployeeDailyListMutation, usePayEmployeeMutation } from "../../../features/api/dailyEmployeesList";
import { Ls } from "dayjs";
import EmployeeSelector from "../../Models/SelectEmployees";
import { toast } from "react-toastify";
import {
  paginateItems,
  ProductionTableFooter,
} from "../ProductionTableControls";

const EmployeeDailyList = ({...props}) => {
  const getDateKey = (value) => {
    const parsedDate = value ? new Date(value) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return null;
    }
    return parsedDate.toISOString().split("T")[0];
  };

  const employees = useSelector(selectEmployees);

// const todayEmpIDs = todayList.map(list => list.empID); // Extract empID list
// console.log("IDs: "+todayEmpIDs);

// const employees = _employees.filter(emp => !todayEmpIDs.includes(emp.empID)); // Filter those not in today's list
// console.log("Emps: "+employees.map(emp=>emp.empID));


  const [createList, {isLoading,isError,error, isSuccess}] = useAddEmployeeDailyListMutation();
  const [_delete, {isLoading:isDeleteLoading,isError:isDeleteError,error:deleteError, isSuccess:isDeleteSuccess}] = useDeleteEmployeeDailyListMutation();
  const [payment, {data,isLoading:isPaymentLoading,isError: isPaymentError,error: paymentError, isSuccess:isPaymentSuccess}] = usePayEmployeeMutation();
const [update, {isLoading:isUpdateLoading, isSsuccess:isUpdateSuccess, isError:isUpdateError, error:updateError}] = useUpdateEmployeeDailyListMutation();

  const _dailyList = useSelector(selectEmployeeDailyList);

  const today = getDateKey(new Date());

  //Find All employees those fall under todays date
const dailyList = (Array.isArray(_dailyList) ? _dailyList : []).filter(list => {
  const createdDate = getDateKey(list?.dailyEmployeeDateCreated);
  return createdDate && createdDate === today;
});
  const workersList = useSelector(selectEmployees);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNestedModal, setShowNestedModal] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: "", role: "", pay: "" });
  const [editWorker, setEditWorker] = useState({id:"", empID:"", role: "", pay: "", amountPaid:"" });
  const [showPayModal, setShowPayModal] = useState(false);
  const [payee, setPayee] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [deleteID, setDeleteID] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [edit, setEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(dailyList.length / rowsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [currentPage, dailyList.length, rowsPerPage]);

  const {
    totalPages,
    paginatedItems: paginatedDailyList,
  } = useMemo(
    () => paginateItems(dailyList, currentPage, rowsPerPage),
    [currentPage, dailyList, rowsPerPage]
  );

  const handleSave = async () => {
try{
  const data = await createList(
    selectedWorkers
  ).unwrap();

}catch(error){
  console.log("Error occured! "+error);

}finally{

}
    // setShowModal(false);
  };

  const clear = () => {
    setEditWorker({id:"", empID:"", role: "", pay: "", amountPaid:"" });
    setEdit(false);
  }

const handlePayment = async () => {
  try{
    const data = await payment({
      id: payee.ID,
      amountPaid: Number(payAmount)||0
    }).unwrap();
    toast.success(data?.message || "Payment successful!");
    setShowPayModal(false);
    setPayee("");
    setPayAmount("");
  } catch(error){
    toast.error(error?.data?.message || "Operation failed!");
  }
}

  const handleUpdate = async() => {
    try{
      
        const _update =  await update({
         ...editWorker
        }).unwrap();
         toast.success(_update?.message || "Update successful!");
         clear();
         setEditModal(false);
       
      }
   catch(error){
      toast.error(error?.data?.message || "Update failed!");
    }
   
  };
  const handlePayClick = (_payee) => {
    setEdit(false);
    setPayAmount((Number(_payee?.payment) || 0) - (Number(_payee?.amountPaid) || 0));
    setPayee(_payee);
    setShowPayModal(true);
  };

  const EmployeeExcerpty = ({...props}) => {
const employee = employees.filter(emp => Number(emp.empID) === Number(props.empID));
return (
  <div>{employee[0]?.empName}</div>
)
  }

  const handleDelete = async() => {
    try{
      const _Delete = await _delete({id:deleteID}).unwrap();
      setDeleteID("");
      toast.success(_Delete?.message || "Delete successful!");
      setDeleteModal(false);

    }catch(error){
      toast.error(error?.data?.message || "Operation failed!");
    }
  }

  const setEditDetails = (emp) => {
setEditWorker({...editWorker,id:emp.ID, empID: emp.empID, role: emp.role, pay: emp.payment, amountPaid: emp.amountPaid });
setEdit(true)
setEditModal(true);

  }

  const handleEdit = () => {

  }

  return (
    <div className="production-section-shell">
      <div className="production-section-header">
        <div className="production-section-copy">
          <h2 className="h5 mb-0">Daily Workers</h2>
          <p>Build today’s worker list, track balances, and update payroll entries safely.</p>
        </div>
        <div className="production-action-cluster">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Create List
          </Button>
        </div>
      </div>
      
        {dailyList?
           <div className="production-table-card">
             <div className="production-table-scroll">
           <Table hover responsive className="production-modern-table align-middle text-center">
             <thead>
               <tr>
                 <th>#</th>
                 <th>Name</th>
                 <th>Role</th>
                 <th>Payroll</th>
                 <th>Paid</th>
                 <th>Balance</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {dailyList.length > 0 ? (
                 paginatedDailyList.map((list, idx) => (
                   <tr key={list.ID || idx}>
                     <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                     <td><EmployeeExcerpty empID={list.empID} /></td>
                     <td>{list.role}</td>
                     <td>{list.payment}</td>
                     <td>{list.amountPaid}</td>
                     <td>{Number(list.payment) - Number(list.amountPaid)}</td>
                     <td>
                       <div className="d-flex justify-content-center gap-2">
                         <Button size="sm" onClick={() => handlePayClick(list)} disabled={list?.amountPaid === list?.payment}>Pay</Button>
                         <Button size="sm" variant="warning" onClick={() => setEditDetails(list)}>Edit</Button>
                         <Button size="sm" variant="danger" onClick={() => { setDeleteID(list.ID); setDeleteModal(true); }}>Delete</Button>
                       </div>
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan="7" className="text-center text-muted">No Employees Selected</td>
                 </tr>
               )}
             </tbody>
           </Table>
             </div>
             <ProductionTableFooter
               totalItems={dailyList.length}
               currentPage={currentPage}
               rowsPerPage={rowsPerPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
               onRowsPerPageChange={setRowsPerPage}
               itemLabel="daily workers"
             />
         </div>
        :<div>Empty List</div>}
      
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Select Daily Workers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="production-action-cluster mb-3">
            <Button onClick={()=>props.setShowModal(true)}>New Employee</Button>
          </div>
         <EmployeeSelector />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>    
        </Modal.Footer>
      </Modal>

      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
        <Modal.Title className="d-flex gap-2">Pay {<div className=""><EmployeeExcerpty empID={payee.empID} /></div>} <div className="fw-bold">Pay: {Number(payee?.payment)-Number(payee?.amountPaid)}</div></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Amount to Pay</Form.Label>
            <Form.Control
              type="number"
              max={Number(payee?.payment)-Number(payee?.amountPaid)}
              placeholder={Number(payee?.payment)-Number(payee?.amountPaid)}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPayModal(false)}>Cancel</Button>
          {
            isPaymentLoading?<Button variant="primary">Processing payment...</Button>: <Button variant="primary"  onClick={handlePayment} disabled={Number(payAmount) <= 0} >Submit Payment</Button>
          }
         
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModal} onHide={() => setDeleteModal(false)} size="lg" backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
       <div className="production-modal-alert production-modal-alert-danger">You are about to delete an employee from the daily list.</div>
        </Modal.Body>
        <Modal.Footer>
          {isDeleteLoading?<Button variant="secondary" >
            Deleting...
          </Button> :<Button variant="danger" onClick={handleDelete}>
            Delete
          </Button> }
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>
            Close
          </Button>    
        </Modal.Footer>
      </Modal>

      <Modal show={editModal} onHide={() => {setEditModal(false);clear()}} size="lg" backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Edit {<EmployeeExcerpty empID={editWorker?.empID} />}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="production-form-grid">
            <Form.Group>
              <Form.Label>Amount Paid</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={editWorker.amountPaid}
                onChange={(e) => setEditWorker({...editWorker,amountPaid:e.target.value})}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Payment</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={editWorker.pay}
                onChange={(e) => setEditWorker({...editWorker,pay: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="production-form-grid-single">
              <Form.Label>Role</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter role"
                value={editWorker.role}
                onChange={(e) => setEditWorker({...editWorker,role: e.target.value})}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
        <Button variant="secondary" onClick={() => setEditModal(false)}>
            Close
          </Button>  
          {edit?isUpdateLoading?<Button className="btn btn-info" >
            Updating...
          </Button> :<Button className="btn btn-primary" onClick={handleUpdate}>
            Update
          </Button>:"" }
            
        </Modal.Footer>
      </Modal>
     
    </div>
  );
};

export default EmployeeDailyList;
