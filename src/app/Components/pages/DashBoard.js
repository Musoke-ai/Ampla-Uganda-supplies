import React from "react";
import { useGetHistoryQuery } from '../../features/api/historySlice';
import { useSelector } from "react-redux";
import { selectHistory } from "../../features/api/historySlice";
import { selectStock } from "../../features/stock/stockSlice";
import ProductExcerpty from "../excerpts/ProductExcerpty";
import { useGetSalesQuery, selectSales } from "../../features/api/salesSlice";
import { useGetStatisticsQuery, selectStatistics } from "../../features/api/statisticsSlice";
import format from "date-fns/format";
import { selectProfile } from "../../auth/authSlice";
import calendar from '../../icons/calendar.png'
import CategoryExcerpty from "../excerpts/CategoryExcerpty";
const DashBoard = () => {

  const profile = useSelector(selectProfile);

  const{
    isLoading,
    isError,
    isSuccess,
    error
  } = useGetHistoryQuery();
  
  const {
    isLoading: issalesLoading,
    isSuccess: issalesSuccess,
    isError: issalesError,
    error: saleError
  } = useGetSalesQuery();

  const {
    isLoading: isstatsLoading,
    isSuccess: isstatsSuccess,
    isError: isstatsError,
    error: statError
  } = useGetStatisticsQuery();

  const sales = useSelector(selectSales);
  const products = useSelector(selectStock);
  const stats = useSelector(selectStatistics);
  const totalPdt = products.length;
  const mostStocked = (products.filter((product) => Number(product.itemQuantity) > 5)).length
  const lowStocked = (products.filter((product)  =>  Number(product.itemQuantity) < 5)).length
  const outOfStock = (products.filter((product)  =>  Number(product.itemQuantity) <= 0)).length

  const top5Purchases = stats.filter((stat) => Number(stat.statItemSales) > 5)
  const least5Selling = stats.filter((stat) => Number(stat.statItemSales) <= 5)

const FormatDate = ({date}) => {
  if(date){
    const _date = new Date(date);
    const fDate = format(_date,'MMM-dd-yyyy');
    return fDate;
  }else{
    return "";
  }
}

const historyData = useSelector(selectHistory);

  return (
   <div className="dashBoard">
      <div className="statistics">

        <div className="container">
          <div className="summaryCont mt-3 mb-2">
            <div className="bg-info sumItem shadow-sm rounded">
              <h6>{totalPdt}</h6>
              <p>Total products</p>
            </div>
            <div className="bg-success sumItem shadow-sm rounded">
              <h6>{mostStocked}</h6>
              <p>Most Stocked Products</p>
            </div>
            <div className="bg-warning sumItem shadow-sm rounded">
              <h6>{lowStocked}</h6>
              <p>Low Stocked Products</p>
            </div>
            <div className="bg-danger sumItem shadow-sm rounded">
              <h6>{outOfStock}</h6>
              <p>Out of Stock Products</p>
            </div>
          </div>

        </div>

        <div className="graphs container">
        <div className="d-flex justify-content-between align-items-center p-2 pt-3 rounded text-white" style={{backgroundColor: '#488A99'}}>
  <h5 class="">Recent Activities</h5>
  <button type="button" class="btn btn-secondary btn-sm" disabled>View All</button>
  </div>
  {/* <hr /> */}
  {
    isLoading?
    <div class="d-flex flex-row justify-content-center align-content-center">
      <h5>Loading recent activities...</h5>
    </div>
    :""
  }
  {isSuccess?
   <div>
   <table class="table table-striped">
   <thead>
     <tr>
       <th scope="col">Date</th>
       <th scope="col">Item</th>
       <th scope="col">Transaction</th>
       <th scope="col">Target</th>
     </tr>
   </thead>
   <tbody>
    <>
  {
    historyData.slice(0,5).map((history, index) => {

    return(  <tr key={index}>
      <th scope="row"><span><img src={calendar} width="20px" height="20px" /></span> &nbsp; {<FormatDate date = {history?.historyDateCreated} />} </th>
      <td>{<ProductExcerpty itemId = {Number(history?.historyItemId)} field="itemName" />}</td>
      <td>{history.historyAction}</td>
      <td>{history.historyDetails}</td>
    </tr>)

    })
  }
  </>

   </tbody>
 </table>
 </div>
  :""}

  {isError? 
  <div class="d-flex flex-row justify-content-center align-content-center">
    <h5>An expected error occured while loading your content!</h5>
  </div>
  :""}
        </div>
{/* //Top 5 purchase products */}

<div className="graphs container">
          <div className="d-flex justify-content-between align-items-center p-2 pt-3 rounded text-white" style={{backgroundColor: '#488A99'}}>
  <h5 class="">Top 5 Purchased Products</h5>
  <button type="button" class="btn btn-secondary btn-sm" disabled>View All</button>
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
   <table class="table table-striped">
   <thead>
     <tr>
       <th scope="col">Product Model</th>
       <th scope="col">Product Name</th>
       <th scope="col">Category </th>
       <th scope="col">sales</th>
       <th scope="col">Total</th>
     </tr>
   </thead>
   <tbody>
    <>
  {
   top5Purchases.slice(0,5).map((stat, index) => {

    return(  <tr key={index}>
      <td>{<ProductExcerpty itemId = {stat?.statItemId} field="itemModel" />}</td>
      <td>{<ProductExcerpty itemId = {stat?.statItemId} field="itemName" />}</td>
      <td>{<ProductExcerpty itemId = {stat?.statItemId} field="itemCategory" />}</td>
      <td>{stat?.statItemSales}</td>
      <td>{stat?.statItemSalesWorth}</td>
    </tr>)

    })
    

  }
  </>

   </tbody>
 </table>
 </div>
  :""}
  {isError? 
  <div class="d-flex flex-row justify-content-center align-content-center">
    <h5>An expected error occured while loading your content!</h5>
  </div>
  :""}
        </div>

        {/* //Least Selling products */}

<div className="graphs container">
          <div className="d-flex justify-content-between align-items-center p-2 pt-3 rounded text-white" style={{backgroundColor: '#488A99'}}>
  <h5 class="">Least Selling Products</h5>
  <button type="button" class="btn btn-secondary btn-sm" disabled>View All</button>
  </div>
  {/* <hr /> */}
  {
   isstatsLoading?
    <div class="d-flex flex-row justify-content-center align-content-center">
      <h5>Loading sales...</h5>
    </div>
    :""
  }
  {isstatsSuccess?
   <div className="" style={{paddingBottom:'2rem'}}>
   <table class="table table-striped">
   <thead>
     <tr>
       <th scope="col">Product Model</th>
       <th scope="col">Product Name</th>
       <th scope="col">Category </th>
       <th scope="col">sales</th>
       <th scope="col">Total</th>
     </tr>
   </thead>
   <tbody>
    <>
  {
    least5Selling.slice(0,5).map((stat, index) => {

    return(  <tr key={index}>
      
      <td>{<ProductExcerpty itemId = {stat?.statItemId} field="itemModel" />}</td>
      <td>{<ProductExcerpty itemId = {stat?.statItemId} field="itemName" />}</td>
      <td>{<ProductExcerpty itemId = {stat?.statItemId} field="itemCategory" />}</td>
      <td>{stat?.statItemSales}</td>
      <td>{stat?.statItemSalesWorth}</td>
    </tr>)

    })
    

  }
  </>

   </tbody>
 </table>
 </div>
  :""}
  {isError? 
  <div class="d-flex flex-row justify-content-center align-content-center">
    <h5>An expected error occured while loading your content!</h5>
  </div>
  :""}
        </div>


      </div>
      </div>
  );
};

export default DashBoard;
