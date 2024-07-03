import { useSelector, useDispatch } from "react-redux";
import {
  useGetStokQuery,
  selectStok,
} from "../api/stockSlice";
import {selectStockById} from '../stock/stockSlice'
import React from 'react';
import StockEntry from "../../Components/StockEntry";
import Box from '@mui/material/Box';
import {useState} from 'react';
import { LinearProgress, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import format from "date-fns/format";
import CountStock from "../../Components/Models/CountStock";
import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { Print } from "@mui/icons-material";

const ItemsExerpt = () => {
  const stockTakingRef = useRef(null);
  const stockList = useRef(null);

    const {
      isLoading: isStockQueryLoading,
      isSuccess,
      isError,
      error,
    } = useGetStokQuery();

  const [value, setValue] = useState('1');

  const stock = useSelector(selectStok);
  // const stockData =  stock[0]?.stockCreated;
  let isDataAvailable = false;
  if(stock.length > 0) {
    isDataAvailable = true;
  }

  // if(stock === undefined  || stock.length<=0 || stock === null){
  //   return <div className="d-flex justify-content-center align-items-center mt-5"><div className="bg-white shadow-sm text-center p-2 rounded">
  //     No Stock Data
  //     </div></div>
  // }
  // else{
  let stockDates = [];
  stockDates = stock.map((item,index) => {
    if(item !== undefined){
      let date = item?.stockCreated
      if(date !== undefined){
        date = item?.stockCreated?.split(" ")[0];
        return date;
      }else{
        // date = "";
      }
    }

  })

 stockDates = stockDates?.filter((item, index, arr) =>arr?.indexOf(item) === index );

  const StockExcerpty = ({ stockItem, index }) => {
    const item = useSelector((state) => selectStockById(state, Number(stockItem?.stockItem)));
    return <tr>
     <th scope="row">{index}</th>
    <td>{item?.itemName}</td>
    <td>{stockItem?.stockItemPrice}</td>
    <td>{stockItem?.itemSupplier} </td>
    <td>{stockItem?.oldStock}</td>
    <td>{stockItem?.stockItemQuantity}</td>
    </tr>
    // return <li class="list-group-item d-flex justify-content-between align-items-start">
    {/* <div class="ms-2 me-auto">
    <div class="fw-bold">{item?.itemName}</div>
    <strong className="text-secondary">Stock Price:</strong>&nbsp; {stockItem?.stockItemPrice} <br />
    <strong className="text-secondary">Supplier:</strong>&nbsp; <span class="text-muted"> {stockItem?.itemSupplier} </span>
    </div> */}
    {/* <span class="badge bg-primary rounded-pill"><span className="bold">Qty:&nbsp;</span>{stockItem?.stockItemQuantity}</span>
   <p className="mt-2"> <span class="badge bg-danger rounded-pill"><span className="bold">OldQty:&nbsp;</span>{stockItem?.oldStock}</span></p> */}
 
    {/* </li> */}

  };

const StockItems = ({stockDate}) => {
  return (
    stock.map((item,index) => {
      if(item !== undefined){
        let date = item?.stockCreated;
        if(date !== undefined){
          date = date.split(" ")[0];
          if(date === stockDate) {
            return <StockExcerpty stockItem={item} index={index+1} />
          } else {
            // return "";
            index=0
          }
        }
      }
    })
  )
}
       
const Total = ({
  stockDate,
  whichTotal
}) => {
  let itemToAdd = [];
  itemToAdd  = stock?.filter(item => {
    let date = item?.stockCreated;
    if(date !== undefined){
      date = date?.split(" ")[0];
      if(date === stockDate){
        return date;
      }
    }
  } )
if(whichTotal === 'cost')
{
  return itemToAdd.reduce((prevTotal, currentItem) => prevTotal + Number(currentItem.stockItemPrice), 0);
}else{
  return itemToAdd.reduce((prevTotal, currentItem) => prevTotal + Number(currentItem.stockItemQuantity), 0);
}

}

  const handleValueChange = (event, newValue) => {
setValue(newValue);
  }
  return (
    <div className="">
      <TabContext value={value}>
      <Box sx={{ borderBottom: 1,  borderColor: 'divider'}}>
        <TabList  aria-label="stock Tabs" onChange={handleValueChange} >
<Tab label="Stock Summary" value='1' />
<Tab label="New Stock" value='2' />
{/* <Tab label="Count Stock" value='3' /> */}
        </TabList>
      </Box>
<TabPanel value="1">
  { isStockQueryLoading?<LinearProgress />:""}
<div class="p-2">
{ isDataAvailable?<div>
{
 stockDates?.length > 0?   stockDates?.map( (value) => {
   
return (<table class="table shadow rounded" ref={stockList}>
<thead>
<tr>
<th scope="col">Stock Date</th>
<th scope="col">Stock Items</th>
<th scope="col">Initials</th>
</tr>
</thead>
<tbody>
<tr>
<th scope="row">{value?format((new Date(value)), 'EEE-dd-YYY,'):""}</th>
<td class="colspan-2">
<ol class="list-group list-group-numbered"style={{maxHeight: '200px',overflow: 'auto'}}>
{/* <StockItems stockDate={value} /> */}
<table class="table">
  <thead>
    <tr>
      <th scope="col">#</th>
      <th scope="col">Item</th>
      <th scope="col">Stock price</th>
      <th scope="col">Supplier</th>
      <th scope="col">Old stock</th>
      <th scope="col">New stock</th>
    </tr>
  </thead>
  <tbody>
  <StockItems stockDate={value} />
  </tbody>
</table>
</ol>
</td>
<td></td>
</tr>
</tbody>
<tfooter >
<td>
<h6>Total Quantity: &nbsp; {<Total stockDate={value} />}</h6>
</td>
<td>
<h6>Total cost:&nbsp; {<Total stockDate={value} whichTotal='cost' />}</h6>
</td>
</tfooter>
</table>)
}):""}
</div>:<div className="d-flex justify-content-center align-items-center text-center bg-white rounded p-2 shadow-sm">No Stock Data</div>
}

 </div>
</TabPanel>
<TabPanel value="2">
<StockEntry />
</TabPanel>
</TabContext>
{/* Modals */}
{/* <CountStock /> */}
    </div>
  );
// }
}

export default ItemsExerpt;
