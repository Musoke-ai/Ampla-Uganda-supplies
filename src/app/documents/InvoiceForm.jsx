import { useState, useEffect } from 'react';
import { ColorPicker } from 'primereact/colorpicker'; 
import SignPad from './SignPad';
import { Back } from 'react-bootstrap-icons';
import { ArrowBack, Preview, Save, Send } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStock } from '../features/stock/stockSlice';
import { selectProfile } from '../auth/authSlice';
import Fuse from 'fuse.js';
import PriceInput from '../Components/actions/PriceInput';
import IncDecCounter from '../Components/actions/IncDecCounter';
import generateInvoice from './functions/generateInvoice';
import { Document, Page } from 'react-pdf';
import format from 'date-fns/format';
import { pdfjs } from 'react-pdf';
import { Worker } from '@react-pdf-viewer/core';
// Import the main component
import { Viewer } from '@react-pdf-viewer/core';
import { Modal } from 'react-bootstrap';
// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import CustomerSelection from '../Components/Models/CustomerSelection';

const InvoiceForm = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
  
const [showPreviewModal, setshowPreviewModal] = useState(false)

  const date = format(new Date(),'dd/MM/yyyy');
  const [signURL,setSignURL] = useState(null);
  const businessProfile = useSelector(selectProfile);
  const businessId = businessProfile?.busId;

  const _data = useSelector(selectStock);
  let FilteredData = _data.filter(item => (item.itemQuantity != 0));
  const[saleItems, setSaleItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0.00);
  const [totalProducts, setTotalProducts] = useState(0);

  const [showSignPad, setShowSignPad] = useState(false);

  
const [BusinessTitleColor, setBusinessTitleColor] = useState('#000000');
const [BillTitleColor, setBillTitleColor] = useState('#000000');
const [totalCostColor, setTotalCostColor] = useState('#000000');
const [amountDueColor, setAmountDueColor] = useState('#000000');

//Bill to info
const [custName, setCustName] = useState("");
const [custTel_1, setCustCustTel_1] = useState("");
const [custTel_2, setCustCustTel_2] = useState("");
const [custEmail, setCustEmail] = useState("");
const [custAddress, setCustAddress] = useState("");
const [dueDate, setDueDate] = useState("On Receipt");



const [invoice, setInvoice] = useState('');

const handleCustNameChange = (e) => {setCustName(e.target.value)}
const handleCustTel_1Change = (e) => {setCustCustTel_1(e.target.value)}
const handleCustTel_2Change = (e) => {setCustCustTel_2(e.target.value)}
const handleCustEmailChange = (e) => {setCustEmail(e.target.value)}
const handleCustAddressChange = (e) => {setCustAddress(e.target.value)}
const handleDueDateChange = (e) => {setDueDate(e.target.value)}

  const canSale =  saleItems.length != 0;
  //Filter out all items with 0 quantity
  const [itemList, setItemList] = useState(FilteredData);
  const options = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    keys: ["itemName", "itemModel"],
  };

  const searchItem = (e) => {
    let searchTerm = e.target.value;
        const results = fuse.search(searchTerm);
        const items = results.map((result) => result.item);
        if(items.length > 0){
         setItemList(items);
        }else{
            setItemList(FilteredData);
        }
  }
 
  const fuse = new Fuse(FilteredData, options);

  useEffect(() => {
    let searchTerm = "";
    const results = fuse.search(searchTerm);
    const items = results.map((result) => result.item);
    if(items.length > 0){
     setItemList(items);
    }else{
        setItemList(FilteredData);
    }
    }, []);

  const removeItem = (itemId) => {
    //Use vanilla js to check if the item is already selected from the list
    const checkBox = document.getElementById(itemId);
    const isChecked = checkBox.checked;
    //if yes uncheck it
    if(isChecked){
      checkBox.checked = false;
    }
    let _item = saleItems?.filter(item => (item.itemId !== itemId));

    if(_item.length >= 0){
        setSaleItems(_item,calculateTotalCost()); 
    } 
  }

  const calculateTotalCost = () => {
      let total = 0;
 saleItems?.map((item) => {
         total += (Number(item.salePrice) * Number(item.saleQuantity));
  })
      setTotalCost(total);
   
    }

    const calculateTotalProducts = () => {
      let total = 0;
      saleItems.map((item) => {
              total += Number(item.saleQuantity);
       })
           setTotalProducts(total);
    }
 

const handleSelection = (e) => {
    const itemId  = e.target.value;
    //Check if the item has already been added to the list
    let check = saleItems.filter(item => (item.itemId === itemId));
    if(check.length > 0){
        let _item = saleItems.filter(item => (item.itemId !== itemId));
        setSaleItems(_item,calculateTotalCost());
    }
    else{
        let _item = FilteredData.filter(item => (item.itemId === itemId));
        if(_item.length > 0){
          //Modify the original item by adding a new saleQuantity property
              _item = _item.map((item) => {
       return{ ...item,
          saleQuantity: 1,
          // custName: custName,
          // custContacts: custContact,
          saleOwner: businessId,
          saleItemId: item.itemId,
          salePrice: item.itemLeastPrice
        } 
        })
        _item = _item[0];
            setSaleItems((saleItems) => {return [...saleItems, _item]},calculateTotalCost());
        } 
    }
}

useEffect(() => {
  calculateTotalCost();
  calculateTotalProducts();
},[saleItems, calculateTotalCost, calculateTotalProducts]);

const saveInvoice = ()=>{
  
  const customerInfo = 
    {
    custName: custName,
    custEmail: custEmail,
    custAddress: custAddress,
    custTel_1: custTel_1,
    custTel_2: custTel_2
  }
  ;
  // console.log("custName: "+customerInfo.custName);
  const colors = {
    BillTitleColor: BillTitleColor,
    BusinessTitleColor: BusinessTitleColor,
    totalCostColor: totalCostColor,
    amountDueColor: amountDueColor
  };
  const businessInfo = {
    busName: businessProfile?.busName,
    busEmail: businessProfile.busEmail,
    busLocation: businessProfile.busLocation + ' - ' + businessProfile.busBuilding,
    tel: businessProfile.busContactOne + ' - '+businessProfile.busContactTwo,
    tin: "TH1238"

  };
const balance = totalCost;
  const totals = 
    {
    totalCost: totalCost,
    balance: balance
  };
  const content = saleItems;
   const invoicePreview = generateInvoice(
    customerInfo,
    colors,
    businessInfo,
    content,
    totals,
    signURL,
    date,
    dueDate
  );
  setInvoice(invoicePreview);
}

  return (
    <div className='invoice-form'>

    <div className='invoiceCont p-3'>
        <div>
        <div class="btn-group w-100 h-25 mt-3">
        <button class="btn btn-secondary btn-sm dropdown-toggle btn-light fw-bold w-100 shadow-sm"  type="button" data-bs-toggle="dropdown" aria-expanded="false">
          Add item
        </button>
        <ul class="dropdown-menu col-12 p-3" style={{height: 200 +'px', overflow: 'hidden'}} >
          <div class="position-sticky top-0 w-100 bg-light searchIn">
        <input class="form-control form-control-sm position-sticky top-0 " type="text" placeholder="Search item" aria-label=".form-control-sm" onChange={searchItem} />
        </div>
        <div class="mt-1">
        <ul class="list-group" style={{height: 130 +'px',overflow: 'auto'}}><br />
        {
          itemList?.map((item,index) => (
      <li class="list-group-item" key={index}>
          <input class="form-check-input me-1" type="checkbox" value={item?.itemId} aria-label="..." onClick={handleSelection} id={item?.itemId} />
         {item?.itemName}
        </li>
          ))
        }
        
      </ul>
      </div>
        </ul>
      </div>
        {/* <div className="card position-relative" style={{height: 'auto'}}>
  <div className="card-header d-flex justify-content-end gap-3">
    <div className='position-absolute start-0 ps-3 fw-bold d-flex justify-content-center align-items-center'><span className='me-2'>
      </span>INVOICE FORM</div>
   <button type='button' className='btn btn-sm btn-dark' onClick={()=>{
    saveInvoice();
    setshowPreviewModal(true);
    }}><Preview /> Preview</button>
   {/* <button type='button' className='btn btn-sm btn-info '>Save</button> */}
  {/* </div>
  <div className="card-body">
  <form className="row g-3"> */} 
  {/* <div className="col-md-6">
    <label for="name" className="form-label">Bussiness / Customer Name</label>
    <input type="text" className="form-control" id="name" value={custName} onChange={handleCustNameChange} />
  </div> */}
  {/* <div className="col-md-6">
    <label for="custEmail" className="form-label">Email</label>
    <input type="text" className="form-control" id="custEmail" value={custEmail} onChange={handleCustEmailChange} />
  </div>
  <div className="col-6">
    <label for="inputAddress" className="form-label">Address</label>
    <input type="text" className="form-control" id="inputAddress" placeholder="Mukono" value={custAddress} onChange={handleCustAddressChange} />
  </div>
  <div className="col-6">
    <label for="dueDate" className="form-label">Due</label>
    <input type="date" className="form-control" id="dueDate" placeholder="Mukono" value={dueDate} onChange={handleDueDateChange} />
  </div>
  <div className="col-6">
    <label for="tell1" className="form-label">Tellephone</label>
    <input type="text" className="form-control" id="tell1" placeholder="07703299736" value={custTel_1} onChange={handleCustTel_1Change} />
  </div>
  <div className="col-6">
    <label for="tell2" className="form-label">Tellephone 2</label>
    <input type="text" className="form-control" id="tell2" placeholder="07703299736" value={custTel_2} onChange={handleCustTel_2Change} />
  </div> */}
  {/* <div className="col-12">
  <button type="button" className='btn btn-success w-100'>Add Item</button>
  </div> */}

  {/* <div className="col-12 d-flex">
    <button type="button" className="btn btn-dark" onClick={() => {setShowSignPad(true)}} > Add your signature</button>  */}
    {/* <div className='ms-5'>or</div>
    <div className="input-group w-50 ms-5"> 
  <input type="file" className="form-control" id="inputGroupFile04" aria-describedby="inputGroupFileAddon04" aria-label="Upload" />
  <button className="btn btn-outline-secondary zIndex-3" type="button" id="inputGroupFileAddon04">Upload signature</button>
</div> */}
  {/* </div>
</form>
  </div>

  {
    showSignPad? <div className='position-absolute bottom-0 mt-5 zIndex-5'><SignPad setShow={setShowSignPad} setSignURL={setSignURL} /></div>:''
   }

</div> */}
        {/* </div> */}
        {/* //SAMPLES */}
        {/* <div> */}
{/* 
        <div className="input-group mb-3">
  <input type="text" className="form-control" placeholder="Recipient's email" aria-label="Recipient's username" aria-describedby="basic-addon2" />
  <span className="input-group-text" id="basic-addon2">SEND</span>
</div> */}
{/* 
<div className='fw-bold text-center w-100'>
            Format <br />
            <br />
        </div>


        <div className='d-flex gap-2 mb-2'>
<div style={{width: 100}} >Business Title</div>
<div className='me-3'>
<ColorPicker format='hex' value={BusinessTitleColor} onChange={(e) => setBusinessTitleColor(e.value)}  /> 
        </div>
        </div>

        <div className='d-flex gap-2 mb-2'>
<div style={{width: 100}} >Bill to title</div>
<div className='me-3'>
<ColorPicker format='hex' value={BillTitleColor} onChange={(e) => {setBillTitleColor(e.target.value)}}  /> 
        </div>
        </div>

        <div className='d-flex gap-2 mb-2'>
<div style={{width: 100}} >Total Cost</div>
<div className='me-3'>
<ColorPicker format='hex' value={totalCostColor} onChange={(e)=>{setTotalCostColor(e.target.value)}}  /> 
        </div>
        </div>

        <div className='d-flex gap-2 mb-2'>
<div style={{width: 100}} >Amount Due</div>
<div className='me-3'>
<ColorPicker value={amountDueColor} onChange={(e) => {setAmountDueColor(e.target.value)}}  /> 
        </div>
        </div>
         */}
{/* INVOICE DETAILS */}


<div className='mt-4 positio-relative'>
<div className='d-flex gap-4 w-100 position-relative fs-6'><span className='ms-2 fw-bold '>Total Quantity:</span> 
<span className='position-absolute end-0 me-2'>{totalProducts}</span>
</div>
<div className='d-flex gap-4 w-100 position-relative fs-6'><span className='ms-2 fw-bold '>Items:</span> 
<span className='position-absolute end-0 me-2'>{saleItems.length}</span>
</div>
<div className='d-flex gap-4 w-100 position-relative fs-6'><span className='ms-2 fw-bold '>Total Cost:</span> 
<span className='position-absolute end-0 me-2'>{totalCost}</span>
</div><div className='d-flex gap-4 w-100 position-relative fs-6'><span className='ms-2 fw-bold '>Amount Due:</span> 
<span className='position-absolute end-0 me-2'>{totalCost}</span>
</div>

{/* <div><button className='btn btn-light w-100 shadow-sm mt-4 fw-bold'>Add Item</button></div> */}
</div>

        </div>


    </div>
{/* //ITEMS */}
    <div className='ps-3 pe-3' style={{height: '50px'}}>   
 <table className="table table-sm">
  <thead >
    <tr className='bg-light'>
      <th scope="col">#</th>
      <th scope="col" className='col-3'>DESCRIPTION</th>
      <th scope="col" className='col-3 text-center'>RATE</th>
      <th scope="col" className='col-2 pe-3'>QUANTITY</th>
      <th scope="col">AMOUNT</th>
      <th scope="col" className='' style={{width: '10px'}}></th>
    </tr>
  </thead>
  <tbody>

  {
        saleItems?.map((item,index) => (
            <tr key={index} className='pt-2'>
            <th scope="row">{index+1}</th>
            <td>{item.itemName}</td>
            <td className="d-flex align-items-center justify-content-center" ><PriceInput item={item} calcTotal = {calculateTotalCost} /></td>
            <td className=''><IncDecCounter 
              _item = {item}
              calTotal={calculateTotalCost}
              setTotalCost={setTotalCost}
              calTotalProducts={calculateTotalProducts}
              /></td>
              <td>{item.saleQuantity*item.salePrice}</td>
            <td><button class="btn btn-sm btn-dark bg-dark" onClick={() => {removeItem(item.itemId)}}>X</button></td>
          </tr>
        ))
    }

  </tbody>
</table></div>


{/* Preview Modal */}
{/* <!-- Button trigger modal --> */}
{/* <button type="button" class="btn btn-primary">
  Launch static backdrop modal
</button> */}

{/* <!-- Modal --> */}
{/* <div className="modal fade " id="invoicePreview" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="invoicepreview" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header position-relative">
        <h5 class="modal-title" id="staticBackdropLabel">INVOICE</h5>
        <div className='position-absolute end-0 me-5 d-flex gap-2'>
        <button className="btn btn-dark btn-sm"><Save /> Save</button>
        <button className="btn btn-dark btn-sm "><Send /> Send</button>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div> */}
      {/* <div class="modal-body"> */}
      {/* <iframe id="pdf_preview" type="application/pdf" src={invoice} width="800" height="400"></iframe> */}
      {/* <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"> */}
      {/* // Your render function */}
{/* <Viewer fileUrl={invoice} />
</Worker> */}
      {/* </div> */}
      {/* // <div class="modal-footer"> */}
        {/* <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Understood</button> */}
      {/* </div>
    </div>
  </div>
</div> */}

<div>
       <Modal 
        show={showPreviewModal}
        fullscreen={false}
        onHide={() => setshowPreviewModal(false)}
        size='lg'
        scrollable={true}
        >
        <Modal.Header 
        closeButton
        >
          {/* <Modal.Title>Modal</Modal.Title> */}
          <div className='position-relative w-100'>
          <h5 class="modal-title" id="staticBackdropLabel">INVOICE</h5>
        <div className='position-absolute end-0 me-5 top-0 d-flex gap-2'>
        <button className="btn btn-dark btn-sm"><Save /> Save</button>
        <button className="btn btn-dark btn-sm "><Send /> Send</button>
        </div>
        </div>
        </Modal.Header>
        <Modal.Body>
           {/* <iframe id="pdf_preview" type="application/pdf" src={invoice} width="800" height="400"></iframe> */}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      {/* // Your render function */}
<Viewer fileUrl={invoice} />
</Worker>
          {/* <InvoiceForm /> */}
        </Modal.Body>
      </Modal>
    </div>

    </div>
  );
}

export default InvoiceForm;
