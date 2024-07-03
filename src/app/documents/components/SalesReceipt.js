import { Print, Send, SkipNext, SkipPrevious } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import { set } from 'date-fns';
import {useState, useEffect} from 'react';
import { Pencil, SkipBackward } from 'react-bootstrap-icons';
import format from 'date-fns/format';
import ProductExcerpty from '../../Components/excerpts/ProductExcerpty';
import CurrencyFormat from 'react-currency-format';

const SalesReceipt = ({receiptNo, receipt}) => {

  const totalAmount = receipt.reduce((accumulator, item) => {
    return accumulator += Number(item.saleQuantity)*Number(item.salePrice)
}, 0)

  return (
    <div>
    <div className='sales-receipt'>

      <div className='d-flex justify-content-between mb-3 mt-1'>

        <div ><b className='fs-5'>Customer Details</b>
        <div><b>Name:</b> {receipt[0]?.custName}</div>
        <div><b>Contact:</b> {receipt[0]?.custContacts}</div>
        {/* <div><b>Address:</b> Bweyogerere</div> */}
        </div>

        <div className='position-relative'> 
        <div className='position-absolute end-0 top-0'><b>No.</b><span className='text-danger fw-bold'>{receiptNo<=9?<div>SR0{receiptNo}</div>:<div>SR{receiptNo}</div>}</span></div>
           <br /> <div><b>Date:</b> {receipt.length>0?
              format(new Date(receipt[0]?.saleDateCreated),'MMM-dd-yyyy'):""}</div>
            <div><b>Total Amount:</b><CurrencyFormat value={totalAmount} displayType='text' thousandSeparator={true} prefix='Ush'suffix='.00' /></div>
            <div><b>Balance Due:</b> <CurrencyFormat value={0} displayType='text' thousandSeparator={true} prefix='Ush'suffix='.00' /></div>
            </div>

            </div>
            {/* Receipt Items */}
            <div>
            <table class="table table-bordered shadow-sm">
  <thead>
    <tr>
      <th scope="col">#</th>
      <th scope="col">Item</th>
      {/* <th scope="col">Description</th> */}
      <th scope="col">Quantity</th>
      <th scope="col">Unit Cost</th>
      <th scope="col">Total Cost</th>
    </tr>
  </thead>
  <tbody>

   {
   receipt.map((sale,index) => {
    return <tr>
    <th scope="row">{index+1}</th>
    <td>{<ProductExcerpty itemId={sale?.saleItemId} field="itemName" />}</td>
    <td>{sale?.saleQuantity}</td>
    <td>{sale?.salePrice}</td>
    <td>{Number(sale?.saleQuantity)*Number(sale?.salePrice)}</td>
  </tr>
   })}
   
  </tbody>
</table>
            </div>

    </div>

    {/* bottom ribbon */}

    </div>
  );
}

export default SalesReceipt;
