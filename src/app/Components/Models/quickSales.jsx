import React from 'react';
import IncDecCounter from '../actions/IncDecCounter';
import {useState, useEffect, useRef } from 'react';
import {useSelector } from 'react-redux';
import { selectStock } from '../../features/stock/stockSlice';
import { useMakeSalesMutation } from '../../features/api/salesSlice';
import { useGetCategoriesQuery } from '../../features/api/categorySlice';
import { selectCategories } from '../../features/api/categorySlice';
import Fuse from "fuse.js";
import Button from 'react-bootstrap/Button'
import Toast from 'react-bootstrap/Toast'
import { ToastContainer } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner'
import PriceInput from '../actions/PriceInput';
import { selectProfile } from '../../auth/authSlice';
import generateSalesReceipt from '../../documents/functions/generateSalesReceipt';
import generateReceipt from '../../documents/functions/generateReceipt';

const QuickSales = () => {

  const businessInfo = useSelector(selectProfile)
  const businessId = businessInfo?.busId;

  const [makeSales, {
    data,
    isLoading,
    isSuccess,
    isError,
    error
  }] = useMakeSalesMutation();
      const _data = useSelector(selectStock);
      let FilteredData = _data.filter(item => (item.itemQuantity != 0));
      const[saleItems, setSaleItems] = useState([]);
      const [totalCost, setTotalCost] = useState(0);
      const [custName, setCustName] = useState("");
      const [cash, setCash] = useState(0.00);
      const [custContact, setCustContact] = useState("");
      const [show, setShow] = useState(true);
      const [saleItemsWithCustDetails, setSaleItemsWithCustDetails] = useState([]);
      const [receiptNo,setReceiptNo] = useState("");
      const ref = useRef(null);
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
        let _item = saleItems.filter(item => (item.itemId !== itemId));

        if(_item.length >= 0){
            setSaleItems(_item,calculateTotalCost()); 
        } 
      }

      const calculateTotalCost = () => {
          let total = 0;
     saleItems.map((item) => {
             total += (Number(item.salePrice) * Number(item.saleQuantity));
      })
          setTotalCost(total);
       
        }
     
const handleCustName = (e) => {
setCustName(e.target.value);
}
const handleCash = (e) => {
setCash(e.target.value);
}
const handleCustContact = (e) => {
setCustContact(e.target.value);
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

if(isSuccess){
  // generateSalesReceipt(itemList,totalCost);
}

useEffect(() => {
  calculateTotalCost();
},[saleItems, calculateTotalCost]);

const handleSales = async () => {
  if (saleItems){
    //Add customer Detials to each item sold
   let _saleItemsWithCustDetails = saleItems.map((item) => {
      return{ ...item,
         custName: custName,
         custContacts: custContact,
       } 
       })
    try {
   const _data = await makeSales({
        saleItems: _saleItemsWithCustDetails
      }).unwrap()
      setSaleItemsWithCustDetails(_saleItemsWithCustDetails);
      setReceiptNo(_data.receiptNumber);
      // console.log("Response: "+Object.keys(_data));
    } catch (err) {
  
    }
   }
}

const generateReceiptOnSales =  async(receiptNo,itemsSold) =>{
  // (generateSalesReceipt(saleItems,totalCost,cash,businessInfo,custName));
  generateReceipt(
    businessInfo,
    itemsSold,
    receiptNo,
    _data 
   )
}

const handleToasterOnClose = () =>{
  setCustContact(" ")
  setCustName(" ")
  setCash(0)
  setTotalCost(" ")
  setSaleItems([]); 
  setReceiptNo("");
  setSaleItemsWithCustDetails([]);
  setShow(false);
}

  return (
    <div className="position-relative">
      <div class="modal-dialog" id="salesModal">
    <div class="modal-content">
      <div class="modal-header text-white shadow d-flex" style={{backgroundColor: "#1C4E80"}}>
        
        <div class="btn-group w-75 h-25">
        <button class="btn btn-secondary btn-sm dropdown-toggle btn-light shadow-sm" style={{width:"100px"}} type="button" data-bs-toggle="dropdown" aria-expanded="false">
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

        <button type="button" class="btn-close bg-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" style={{height: '350px', overflow: "auto"}}>
      <table class="table" style={{height: '150px',overflow: 'auto'}}>
  <thead>
    <tr>
      <th scope="col">#</th>
      <th scope="col">Item</th>
      <th scope="col" >Cost</th>
      <th scope="col">Quantity</th>
      <th scope="col" className='col-1'></th>
    </tr>
  </thead>
  <tbody>
    {
        saleItems.map((item,index) => (
            <tr key={index}>
            <th scope="row">{index+1}</th>
            <td>{item.itemName}</td>
            <td class="w-25" ><PriceInput item={item} calcTotal = {calculateTotalCost} /></td>
            <td className='w-100'><IncDecCounter 
              _item = {item}
              calTotal={calculateTotalCost}
              setTotalCost={setTotalCost}
              /></td>
            <td><button class="btn btn-sm btn-danger bg-danger" onClick={() => {removeItem(item.itemId)}}>X</button></td>
          </tr>
        ))
    }
   
  </tbody>
</table>
<div class="form-floating mb-3">
  <input type="text" class="form-control" id="cash" placeholder="Customer name" value={cash}  onChange={handleCash} />
  <label for="cash">Cash</label>
</div>
<div class="form-floating mb-3">
  <input type="text" class="form-control" id="custName" placeholder="Customer name" value={custName}  onChange={handleCustName} />
  <label for="custName">Customer Name</label>
</div>
<div class="form-floating">
  <input type="text" class="form-control" id="contact" placeholder="Contact" value={custContact} onChange={handleCustContact} />
  <label for="contact">Contact</label>
</div>
<br />
{/* <h6>Transaction Type</h6> */}
<hr />
{/* <div class="form-check">
  <input class="form-check-input" type="radio" name="cash" id="cash" checked />
  <label class="form-check-label" for="credit">
   Cash
  </label>
</div> */}
{/* <div class="form-check">
  <input class="form-check-input" type="radio" name="credit" id="credit"  />
  <label class="form-check-label" for="credit">
   Credit
  </label>
</div> */}
      </div>
      <div class="modal-footer">

      <div class="col-12 ">
      <h6>Totals</h6>
      <div className='d-flex shadow-sm border p-2 bg-light'>
      <div class="col-6"><h6>Discount: </h6>0.00%</div>
      <div class="col-6"><h6>Total: </h6>{totalCost}</div>
      </div>
   
    </div>

        {
           canSale?
          <div>
            {isLoading?
            <Button
             variant='secondary'
            >
            <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className='me-1'
            />
            <span className='visually-hidden' > Loading... </span>
            Loading...
            </Button>
           :<Button
           variant='secondary'
           onClick={() => {
             handleSales();
             setShow(true)
           }}
           >Sell</Button>
            }
            
            </div>
          : <Button 
          variant='dark'
          disabled={true}
          > 
          Sell
            </Button>
        }
       
        {/* <button type="button" class="btn btn-primary" onClick={generateReceipt}>Save/print</button> */}
      </div>
  
    </div>
   
  </div>
 
  {
      isSuccess? 
   
      <ToastContainer 
position='bottom-end'

style={{zIndex: 1}}
>
<Toast
onClose={() => {handleToasterOnClose()}}
 show={show}
// delay={6000}
// autohide
bg='success'
  >
    <Toast.Header>
    <strong className='me-auto' >
Quick Sell
    </strong>
</Toast.Header>
<Toast.Body className="text-white">
  {/* Transaction completed successfully.  */}
  {data.message}
</Toast.Body>
<footer className='d-flex gap-3 p-2 w-100 bg-light'>
<button className="btn btn-sm btn-info" onClick={() => {generateReceiptOnSales(receiptNo, saleItemsWithCustDetails)}}>Print Receipt</button>
<button className="btn btn-sm btn-danger" onClick={()=>{handleToasterOnClose()}}>Not Now</button>
</footer>

</Toast>
</ToastContainer>
       :""
    }

    </div>
  );
}

export default QuickSales;
