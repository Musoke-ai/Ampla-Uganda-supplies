import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetSalesQuery, selectSales } from '../api/salesSlice';
import format from 'date-fns/format';
import { Avatar } from '@mui/material';
import ProductExcerpty from '../../Components/excerpts/ProductExcerpty';
import SearchIcon  from "@mui/icons-material/Search";
import Fuse from 'fuse.js';
import { selectStock } from '../stock/stockSlice';
import { Pencil, PencilFill } from 'react-bootstrap-icons';
import { Delete, Print, Send } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportCSV from '../../documents/components/ExportCSV';
const Sales = () => {
  const salesTable = useRef(null);
    const {
        isLoading: issalesLoading,
        isSuccess: issalesSuccess,
        isError: issalesError,
        error: saleError
      } = useGetSalesQuery();

      const products = useSelector(selectStock);
      const sales = useSelector(selectSales);

      const newSales = sales.map((sale) => {
        return {
          ...sale,
          item: products.map((product) => {
            if(Number(product.itemId) === Number(sale.saleItemId)){
              return product.itemName;
            }
          })
        }
      })

     
      // console.log("Sales: "+newSales[0].item[0][0]);

      const [searchTerm, setSearchTerm] = useState("");
      const [_sales, setSales] = useState(null);

      const FormatDate = ({date}) => {
        if(date){
          const _date = new Date(date);
          const fDate = format(_date,'MMM-dd-yyyy');
          return fDate;
        }else{
          return "";
        }
      }

      const options = {
        includeScore: true,
        includeMatches: true,
        threshold: 0.2,
        keys: ["custName","saleQuantity", 'item'],
      }
        
     const fuse = new Fuse(newSales, options);

     useEffect(() => {
        if(searchTerm.length > 0){
            const results = fuse.search(searchTerm);
            const items = results.map((result) => result.item);
            
            if(items.length > 0){
              
            setSales(items);
         
            }
        }
        else{
          setSales(newSales)
        }
     },[searchTerm])   

      const handleSearch = (e) => {
         setSearchTerm(e.target.value);
      };
      const extractItem =(itemId)=>{
        let itemName;
        products.map((product) => {
          if(Number(product.itemId) === Number(itemId)){
            itemName = product.itemName;
          }
        })
        return itemName
      }
      const salesExport = newSales.map((sale)=>{
        return {
          Date: sale.saleDateCreated.split(" ")[0],
          Item:  extractItem(sale.saleItemId),
          Quantity: sale.saleQuantity,
          UnitCost:'USH'+sale.salePrice,
          TotalCost: 'USH'+Number(sale.saleQuantity)*Number(sale.salePrice),
          CustomerDetails: sale.custName +" "+ sale.custContacts
        }
      })


const handlePrint = ()=>{
  const doc = new jsPDF();
  autoTable(doc, { html: salesTable.current});
  doc.autoPrint();
  doc.output('dataurlnewwindow');
}

  return (
    <div className='container'>
      <div className="custOperations bg-white w-100 p-4 mt-2 d-flex align-items-center justify-content-between mb-3" style={{height: '60px'}}>
        
        <div className="form-group has-search w-50 rounded border-0">
          <span className="fa fa-search border-0 form-control-feedback"><SearchIcon /></span>
          <input type="text" className="form-control form-control-input border" placeholder="Search sales"   onChange={handleSearch} />
        </div>
        <div className='d-flex gap-2'>
        <div><ExportCSV data={salesExport} fileName={'sales'+toString(new Date())} /></div>
        <div><button className='btn btn-primary' onClick={handlePrint}><Print/>Print</button></div>
        </div>
    </div> 
  
<div className="graphs container mt-1">
          <div className="d-flex justify-content-between align-items-center p-2 pt-3 rounded text-white" style={{backgroundColor: '#488A99'}}>
  <div><h5 class="">Your Sales</h5></div>
  <div>

  </div>
  </div>
  {/* <hr /> */}
  {
   issalesLoading?
    <div class="d-flex flex-row justify-content-center align-content-center">
      <h5>Loading sales...</h5>
    </div>
    :""
  }
  {issalesSuccess?
   <div className="mb-5">
   <table class="table table-striped" ref={salesTable}>
   <thead>
     <tr>
       <th scope="col">Date</th>
       <th scope="col">Item</th>
       <th scope="col">Quantity sold</th>
       <th scope="col">Unit cost</th>
       <th scope="col">Total cost</th>
       <th scope="col">Customer</th>
     </tr>
   </thead>
   <tbody>
    {
        _sales !== null?
        <>
          {
    
    _sales.map((sale, index) => {
   return(  <tr key={index}>
     <td>{ <FormatDate date={sale?.saleDateCreated} />}</td>
     <td>{<ProductExcerpty itemId={sale?.saleItemId} field="itemName" />}</td>
     <td>{sale?.saleQuantity}</td>
     <td>{sale?.salePrice}</td>
     <td>{Number(sale?.saleQuantity)*Number(sale?.salePrice)}</td>
     <td className='position-relative d-flex align-items-center'>{sale?.custName}&nbsp;-&nbsp;{sale?.custContacts}
    {/* <div className='position-absolute end-0 top-0 '>
      <button className='btn btn-sm btn-white me-2 mt-1 mb-2'><PencilFill /></button>
      <button className='btn btn-sm btn-white me-2 mt-1 mb-2'><Delete /></button>
      </div> */}
    {/* <PencilFill /> */}
     </td>
   </tr>)
   })}
        </>
        :<p className='text-warning w-100 text-center'>No sales made yet</p>
    }
    <>

  </>
   </tbody>
 </table>
 </div>
  :""}
  {issalesError? 
  <div class="d-flex flex-row justify-content-center align-content-center">
    <h5>An expected error occured while loading your content!</h5>
  </div>
  :""}
        </div>
    </div>
  );
}

export default Sales;
