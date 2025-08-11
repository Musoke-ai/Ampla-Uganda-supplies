import { Add } from '@mui/icons-material';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SalesReceipt from './components/SalesReceipt';
import NewDocModal from './components/NewDocModal';
import { useState } from 'react';
import { Pencil, PencilFill } from 'react-bootstrap-icons';
import { Delete, Print, Send, SkipPrevious,SkipNext } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import NewDocumentForm from './components/NewDocumentForm';
import QuotationTemplate from './components/QuotationTemplate';
import { useSelector } from 'react-redux';
import { useGetSalesQuery, selectSales } from '../features/api/salesSlice';
import { Cancel } from '@mui/icons-material';
import { useCancelSalesMutation } from '../features/api/salesSlice';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner'
import Receipt from './templates/Receipt';
import { selectProfile } from '../auth/authSlice';
import { et } from 'date-fns/locale';
import deleteGif from '../../gifs/delete-animation.gif';
// import generateReceipt from './functions/generateReceipt';

const Invoice = () => {

  const businessInfo = useSelector(selectProfile);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleClose = () => setShowDeleteAlert(false);
  const handleShow = () => setShowDeleteAlert(true);

  const [cancelSales, {
    data,
    isLoading,
    isSuccess,
    isError,
    error
  }] = useCancelSalesMutation();

const sales = useSelector(selectSales);

// Extract receipt numbers from the sales
const receiptNos = sales.map((sale) => {
let _receiptNos = new Array();
let _receiptNo = Number(sale.SR_ID);
_receiptNos.push(_receiptNo);
return _receiptNos;
})

//Removing Duplicate receipt numbers from the array
let values = receiptNos.toString().split(",");
values = values.filter((item) => Number(item) !== 0);
values = [...new Set(values)]

const [index, setIndex] = useState(0);
const [receiptNo, setReceiptNo] =useState(values[index]);
const [receipt, setReceipt] = useState(sales?.filter((value, index) => Number(value?.SR_ID) === Number(receiptNo)));

const extractSalesPerReceipt = (_receiptNo) => {
  const salesPerReceipt = sales.filter((value, index) => Number(value.SR_ID) === Number(_receiptNo));
  setReceipt(salesPerReceipt);
}

  const [modalShow, setModalShow] = useState(false);
  const [showNewDocModal, setshowNewDocModal] = useState(false);

  const handlePrev = () => {
    let dec = index;
    dec = dec-1;
   setIndex(dec)
    if(dec < 0){
      setIndex(0)
    }
    setReceiptNo(values[index]);
  }

  const handleNext = () => {
    let dec = index;
    dec = dec+1;
    if(dec >= values.length){
      dec = 0;
    }
    setIndex(dec)
    setReceiptNo(values[index]);
  }

  useEffect(()=>{
    extractSalesPerReceipt(receiptNo);
  },[receiptNo])

  const handleCancelSales = async () => {
 
      try {
        await cancelSales({
          SR_ID: receiptNo
        }).unwrap()
      } catch (err) {
    
      }
  }
  
  
  return (
    <div className='p-4'>
      <div
      className="bg-light d-flex align-items-center mb-3 shadow-sm w-100 p-2 position-relative"
      >
        <ul className='nav d-flex gap-5 fs-6 fw-bold'>
        <li className='nav-item navItem nav-item-active '>Reciept</li>
{/* <li className='nav-item navItem text-muted'>Quotation</li>
<li className='nav-item navItem text-muted'>Catolog</li> */}
<li className='nav-item navItem text-muted'>Invoice</li>
<li className='nav-item navItem text-muted'>
  </li>
{/* <li className='nav-item navItem'><QuotationTemplate /></li> */}
        </ul>
        <button className='btn btn-dark btn-sm ms-0 position-absolute end-0 me-3 mt-1 mb-1' 
        onClick={() => setModalShow(true)} 
><Add/></button>
      <div className='d-flex justify-content-end w-50 gap-3'>
      <footer className='d-flex justify-content-end'>
<div className='d-flex gap-3'>
           <button className='btn btn-transparent doc-icon' onClick={handleShow}> <Avatar className='bg-white shadow-sm'><Cancel className='text-dark'/></Avatar></button>
           <Receipt
  businessInfo={businessInfo}
  receiptItems={receipt}
  receiptNumber={receiptNo}
  />
           <button className='btn btn-transparent doc-icon'> <Avatar className='bg-white shadow-sm'><Send className='text-dark'/></Avatar></button>
            </div>
</footer>
      

      <div className='d-flex justify-content-between align-items-center bg-light' style={{boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px"}}>
<div className='ms-2 me-2'><span><input className="input"value={index+1}  style={{width:"50px"}}/></span><span className='fs-6'>/{values.length}</span></div>
<div className='d-flex gap-2'>
    <div><button className='btn btn-sm btn-white shadow-sm slideBtn' onClick={handlePrev}><SkipPrevious/></button></div>
    <div><button className='btn btn-sm btn-white shadow-sm me-1 slideBtn' onClick={handleNext}><SkipNext/></button></div>
</div>

    </div>
    </div>

      </div>

      <div>
        <SalesReceipt receiptNo={receiptNo} receipt={receipt} />
      </div>
  

      <NewDocModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        setshowNewDocModal={setshowNewDocModal}
      />
      <NewDocumentForm setshowNewDocModal={setshowNewDocModal} showNewDocModal={showNewDocModal} />
      {/* Delete alert Modal */}
      <Modal show={showDeleteAlert} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title className=''>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body className='fw-bold'>Receipt information and sales will be deleted permanently!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>{
            handleClose();
            }}>
            Close
          </Button>
         {isLoading? <div>
          Deleting...
         </div>
       : 
       <Button variant="danger" onClick={handleCancelSales} 
      //  className={isError?'d-none':'d-block'}
       >
  Delete
       </Button>
       }
       {
        isSuccess?
      <div>Receipt Deleted</div>  
             :""
       }
       {
        // isError?<div className='text-info'> Item Deleted successfully <span className='text-danger fw-bold'>!</span></div>:""
       }
        </Modal.Footer>
      </Modal>
    </div>
  );
}


export default Invoice;
