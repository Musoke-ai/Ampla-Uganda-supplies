import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { LinearProgress } from "@mui/material";
import ReactLoading from 'react-loading';
import { useSelector } from "react-redux";
import { format, formatDistance, parse, parseISO, differenceInDays } from "date-fns";
import {
  useGetDebtsQuery,
  selectDebt,
  useAddDebtMutation,
  usePayDebtMutation,
  useDeleteDebtMutation
} from "../api/debtSlice";
import CurrencyFormat from "react-currency-format";

import { selectStockById, selectStock } from "../stock/stockSlice";
import CustomerSelection from '../../Components/Models/CustomerSelection';
import { selectCustomers } from "../api/customers";

import { Button, Table, Modal, Form, ProgressBar, Row, Col, Alert } from 'react-bootstrap';
import DebtDetailsModal from "../../Components/Models/DebtsDetails";
import { Eyeglasses } from "react-bootstrap-icons";
import Notification from "../../Components/alerts/GlobalNotify";
import { Delete } from "@mui/icons-material";

const Debts = () => {

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [debtId, setDebtId] = useState("");

  const sampleDebtDetails = {
    customerName: 'John Doe',
    productName: 'Laptop',
    debtTakenDate: '2024-11-01',
    currentDate: new Date().toISOString().split('T')[0],
    recentPayments: [
      { date: '2024-11-10', amount: 100 },
      { date: '2024-11-20', amount: 150 },
      { date: '2024-11-25', amount: 200 },
    ],
  };

   const [
      deleteDebt,
      {
        isLoading: isDeleteLoading,
        isError: isDeleteError,
        error: deleteError,
        isSuccess: isDeleteSuccess,
      },
    ] = useDeleteDebtMutation();

  const debts = useSelector(selectDebt);
  const customers = useSelector(selectCustomers);
  console.log("Debts: "+JSON.stringify(debts));
  console.log("Debts: "+JSON.stringify(debts));
  //fetch Debts on loading if not cached
  const { data1, isLoading, isSuccess, isError, error } = useGetDebtsQuery();
  const [
    addDebt,
    {
      data: debtData,
      isLoading: isAddDebtLoading,
      isSuccess: isAddDebtSuccess,
      isError: isAddDebtError,
      error: addDebtError,
    },
  ] = useAddDebtMutation();
  const [
    payDebt,
    {
      isLoading: ispayDebtLoading,
      isSuccess: ispayDebtSuccess,
      isError: ispayDebtError,
      error: payDebtError,
    },
  ] = usePayDebtMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [filters, setFilters] = useState({ customer: '', product: '', date: '' });

  const handleOpenPayModal = (debt) => {
    setPayItem(debt);
    setShowPayModal(true);
    console.log('PayItem: '+payItem.initialDeposit);
  };

  const calculateRemainingDays = (takenDate, endDate) => {
    const expirationDate = new Date(endDate);
    const _takenDate =new Date(takenDate);
    const gracePeriod = differenceInDays(expirationDate, _takenDate);
    expirationDate.setDate(expirationDate.getDate() + Number(gracePeriod));
    return Math.abs(differenceInDays(expirationDate, new Date()));
  };

  // const filteredDebts = debts.filter((debt) => {
  //   const matchesCustomer = debt.customer.toLowerCase().includes(filters.customer.toLowerCase());
  //   const matchesProduct = debt.product.toLowerCase().includes(filters.product.toLowerCase());
  //   const matchesDate = filters.date ? format(new Date(debt.date), 'yyyy-MM-dd') === filters.date : true;
  //   return matchesCustomer && matchesProduct && matchesDate;
  // });

  //Setup notifaction popup
   const [isOpen, setIsOpen] = useState(false);
  const [notificationType, setNotificationType] = useState(true);
  const [message, setMessage] = useState('');
  const triggerNotification = (type) => {
    setNotificationType(type);
    setMessage(type ? 'Action completed successfully!' : 'An error occurred!');
    setIsOpen(true);
  };


  const dispatch = useDispatch();
  const [navigate, setNavigate] = useState(0);
  // const debts = useSelector(selectDebt);
  const inventory = useSelector(selectStock).filter(item => item.itemQuantity>0);//filter out items with 0 quantity
  const [selectedItem, setSelectedItem] = useState(null);
  const [indebtItemId, setIndebtItemId] = useState(null);
  const [indebtOwner, setIndebtOwner] = useState(1);
  const [quantityDebted, setQuantityDebted] = useState(1);
  const [atPrice, setAtPrice] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [custId, setCustId] = useState(null);
  const [cust, setCust] = useState(null);

  const [payItem, setPayItem] = useState([]);
  const [open, setOpen] = useState(false);

  const getSelectedItem = (itemId) => {
    const item = inventory.filter((item) => {
      return item.itemId === itemId
    })
    setSelectedItem(item[0]);
  }

  const clear = () => {
    setPayItem([]);
  }
  const handleClose = () => {
    setOpen(false, clear());
  };

  const [amountPaid, setAmountPaid] = useState("");
  useEffect(() => {
    const validQuantity = isNaN(Number(quantityDebted)) ? 0 : Number(quantityDebted);
    const validPrice = isNaN(Number(atPrice)) ? 0 : Number(atPrice);
    const total = validQuantity * validPrice;
    setTotalAmount(total);
  }, [atPrice, quantityDebted]);

  useEffect(() => {
    if (selectedItem !== null) {
      setIndebtItemId(selectedItem.itemId)
      setAtPrice(selectedItem.itemLeastPrice);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem || quantityDebted === "") return;
  
    const availableQuantity = Number(selectedItem.itemQuantity);
    const debtedQuantity = Number(quantityDebted);
  
    if (debtedQuantity > availableQuantity) {
      setQuantityDebted(availableQuantity);
    } else if (debtedQuantity <= 0) {
      setQuantityDebted(1);
    }
  }, [quantityDebted, selectedItem]);
  

  const onQuantityDebtedChange = (e) => {
    setQuantityDebted(e.target.value)
  };
  const onAtPriceChange = (e) => setAtPrice(e.target.value);
  const onInitialDepositChange = (e) => setInitialDeposit(e.target.value);
  const onTotalAmountChange = (e) => setTotalAmount(e.target.value);
  const onEndDateChange = (e) => setEndDate(e.target.value);

  const onAmountPaidChange = (e) => setAmountPaid(e.target.value);
  const canPay = (amountPaid >= 1000 ? true : false) && (Number(amountPaid) <= (Number(payItem.totalAmount) - Number(payItem.initialDeposit)));

  const canAddDebt = ([
    indebtOwner,
    quantityDebted,
    atPrice,
    initialDeposit,
    totalAmount,
    endDate,
    custId,
  ].every(Boolean) && !isLoading);

  const handleReset = () => {
    setIndebtItemId("");
    setQuantityDebted("");
    setAtPrice("");
    setInitialDeposit("");
    setTotalAmount("");
    setEndDate("");
    setCustId(null);
 
  };

  const handleAddDebt = async () => {
    try {
      await addDebt({
        indebtItemId,
        indebtOwner,
        quantityDebted,
        atPrice,
        initialDeposit,
        totalAmount,
        endDate,
        custId,
      }).unwrap();
      handleReset();
    } catch (error) {
    }
  };

  const handlePay = async () => {
    try {
      await payDebt({
        debtId: payItem.indebtId,
        amountPaid,
      }).unwrap();
      setAmountPaid('');
      setAmountPaid('');
      setPayItem([]);
    } catch (error) {
    }
  }

  const ItemExerpty = ({ itemId }) => {
    const item = useSelector((state) =>
      selectStockById(state, Number(itemId))
    );
    if (item !== undefined) {

      return (<div>{item.itemName}</div>)
    }

  }

  const CustomerExcerpty = ({custId}) => {
return customers.filter(customer => Number(customer.custId) === Number(custId))[0]?.custName;
  }

  useEffect(() => {
    if (ispayDebtSuccess || isAddDebtSuccess) {
      triggerNotification(true);
    }
  }, [ispayDebtSuccess, isAddDebtSuccess]); // Run only when isSuccess changes
  useEffect(() => {
    if (ispayDebtError || isAddDebtError) {
      triggerNotification(false);
    }
  }, [ispayDebtError, isAddDebtError]); // Run only when isSuccess changes

  const handleCloseDeleteModal = () => {
setDebtId("");
setShowDeleteModal(false);
  }

  const handleDeleteDebt = async () => {
    try{
const _deleteDebt = await deleteDebt({}).unwrap();
setDebtId("");
    }catch(error){
      console.log("error: "+error);
    }
  }

  return (

    <div className="container mt-4">
      <div className='d-flex justify-content-between'>
        <div> <h2>Credit Management</h2></div>
        <div>{/* Add Debt Button */}
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            New Credit
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
            <th>Date Taken</th>
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
          {debts.map(debt => (
            <tr key={debt.id} style={{ backgroundColor: '#ffffff', boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' }}>
              <td>{
                <CustomerExcerpty custId={ debt.custId} />
              }</td>
              <td>{<ItemExerpty itemId={debt.indebtItemId} />}</td>
              <td>{format(new Date(debt.indebtDateCreated), 'yyyy-MM-dd')}</td>
              <td>{2}</td>
              <td>{calculateRemainingDays(debt.endDate, debt.indebtDateCreated)}</td>
              <td>{
                <CurrencyFormat
                value={debt.totalAmount}
                displayType={'text'} 
                thousandSeparator={true}
                prefix=""
                />
             
              }</td>
              <td>{
                <CurrencyFormat
                value={debt.initialDeposit}
                displayType={'text'} 
                thousandSeparator={true}
                prefix=""
                className='text-success'
                />
             
              }</td>
              <td>
                
              <CurrencyFormat
                value={parseFloat(debt.totalAmount)-parseFloat(debt.initialDeposit)}
                displayType={'text'} 
                thousandSeparator={true}
                prefix={parseFloat(debt.totalAmount)-parseFloat(debt.initialDeposit)>0?"":"Paid"}
                className="text-danger fw-bold"
                />
                </td>
              <td>
                <ProgressBar
                  now={(Number(debt.initialDeposit) / Number(debt.totalAmount)) * 100}
                  label={`${((Number(debt.initialDeposit)/ Number(debt.totalAmount)) * 100).toFixed(0)}%`}
                />
              </td>
              <td>
                <div className="d-flex gap-2">
               <div><Button
                  variant="success"
                  onClick={() => handleOpenPayModal(debt)}
                >
                  Pay
                </Button></div> 
                <div>      <Button variant="light" onClick={() => setShowModal(true)} >
        <Eyeglasses />
      </Button></div>
                <div>      
                  <Button variant="light" onClick={() => setShowDeleteModal(true)} >
        <Delete  className="text-danger"/>
      </Button>
      </div>
                </div>
              
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add Debt Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>New Credit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="bg-white p-4 border border-top-0 ms-2 me-2">
            <div className="form-row d-flex flex-row ">
              <div className="form-group required col-md-6 border-0 me-1">
                <label for="inputEmail4" className="control-label">Product</label>
                <select
                  type=""
                  className="form-control form-select border shadow-sm mt-2 h-50"
                  onChange={(e) => {
                    getSelectedItem(e.target.value);
                  }}
                >
                  <option>Select Item </option>
                  {
                    inventory.map((item, index) => {
                      return <option key={index} value={item.itemId} >{item.itemName}</option>
                    })
                  }
                </select>
              </div>
              <div className="form-group required col-md-6 border-0">
                <label for="inputPassword4" className="control-label">Quantity</label>
                <input
                  type="number"
                  className="form-control border shadow-sm mt-2"
                  id="inputPassword4"
                  value={quantityDebted}
                  onChange={onQuantityDebtedChange}
                />
              </div>
            </div>
            <div className="form-row d-flex flex-row">
              <div className="form-group required col-md-6 border-0 me-1">
                <label for="inputEmail4" className="control-label">Unit Cost</label>
                <input
                  type="text"
                  className="form-control border shadow-sm mt-2"
                  id="inputEmail4"
                  placeholder="Unit cost"
                  value={atPrice}
                  onChange={onAtPriceChange}
                />
              </div>
              <div className="form-group col-md-6 border-0">
                <label for="inputPassword4">Total Amount</label>
                <input
                  disabled
                  type="text"
                  className="form-control border shadow-sm mt-2"
                  id="inputPassword4"
                  placeholder="Total amount"
                  value={totalAmount}
                  onChange={onTotalAmountChange}
                />
              </div>
            </div>
            <div className="form-group required border-0">
              <label for="inputAddress" className="control-label">Initial Deposit</label>
              <input
                type="text"
                className="form-control border shadow-sm mt-2"
                id="inputAddress"
                placeholder="Initial Deposit"
                value={initialDeposit}
                onChange={onInitialDepositChange}
              />
            </div>
            <div className="form-row d-flex flex-row">
              <div className="form-group required col-md-6 border-0 me-1">
                <label for="inputEmail4" className="control-label">End Date</label>
                <input
                  type="date"
                  className="form-control border shadow-sm mt-2"
                  id="inputPassword4"
                  value={endDate}
                  onChange={onEndDateChange}
                />
              </div>

            </div>
            <CustomerSelection
            setCustId={setCustId}
            setCustomer={setCust}
            />

          </form>
        </Modal.Body>
        {isAddDebtLoading ? <LinearProgress /> : ""}
        <Modal.Footer>
          <div className="d-flex justify-content-between gap-4">
            <button
              type="button"
              className="btn btn-danger"
              onClick={
                (e) => {
                  e.preventDefault()
                  handleReset()
                }
              }
            >
              Clear Form
            </button>
            {
              canAddDebt ?
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    (e) => {
                      e.preventDefault()
                      handleAddDebt()
                    }
                  }
                >
                  Save credit
                </button> :
                <button
                  disabled
                  type="button"
                  className="btn btn-primary"
                >
                  Save debt
                </button>
            }
          </div>
        </Modal.Footer>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} backdrop='static'>
        <Modal.Header closeButton>
          <Modal.Title>Pay Debt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <h5 className="d-flex flex-row shadow text-white p-2 rounded" style={{ backgroundColor: "#1C4E80" }}><span>Pay For: </span> <pan>{<ItemExerpty itemId={payItem.indebtItemId} />}</pan></h5>
              {ispayDebtLoading ? <LinearProgress /> : ""}
              <p>
                <strong>Bal: </strong>{Number(payItem.totalAmount) - Number(payItem.initialDeposit)}
              </p>
              <p>
                <input type="text" className="form-control border shadow-sm" placeholder="Enter Amount"
                  value={amountPaid}
                  onChange={(e) => {
                    onAmountPaidChange(e);
                    // validatePay(bal);
                  }}
                />
              </p>

            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex align-items-end justify-content-end">
            {
              canPay ?
                <button className="btn btn-primary btn-sm" onClick={() => { handlePay()}}>Pay</button> :
                <button className="btn btn-primary btn-sm" disabled>Pay</button>
            }
          </div>
        </Modal.Footer>
      </Modal>

      <div>

      <DebtDetailsModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        debtDetails={sampleDebtDetails}
      />
    </div>
{/* //Notification body */}
<Notification
        isOpen={isOpen}
        isSuccess={notificationType}
        message={message}
        duration={5000} // 5 seconds
        onClose={() => setIsOpen(false)}
      />

  {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>
       Delete Alert
          </Modal.Title>
        </Modal.Header>
        {isDeleteLoading ? <LinearProgress /> : <div></div>}
        <Modal.Body className="text-danger">
          {
            isDeleteSuccess?<div className="text-success"> Item successfully deleted !</div>:<div> You are about to delete credit details !</div>
          }
        
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Close
          </Button>
          {isDeleteLoading ? 
            <Button className="btn btn-danger btn-small" >Deleting...</Button>:debtId?
           <Button className="btn btn-danger btn-small" onClick={handleDeleteDebt} >Delete</Button>:<Button className="btn btn-danger btn-small" disabled >Delete</Button>
          }
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default Debts;
