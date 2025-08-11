import React from 'react';
import { useTheme } from '@mui/material/styles';
import 'chart.js/auto';
import { Dropdown } from 'react-bootstrap';
import { Arrow90degDown, Arrow90degUp, ThreeDots } from 'react-bootstrap-icons';
// import { format, parseISO } from 'date-fns';

import RecentTransactions from '../tables/RescentTransactions';

import { useSelector } from 'react-redux';
import { selectStock } from '../../features/stock/stockSlice';
import { selectSales } from '../../features/api/salesSlice';
import { selectCustomers } from '../../features/api/customers';
import { BoxFill, CartDashFill, Coin, CurrencyDollar, ExclamationOctagon, Grid1x2Fill, HouseDoor, Layers } from 'react-bootstrap-icons';
import GraphFrame from '../graphs/GraphFrame';
import SalesLineChart from '../graphs/SalesChart';
import QuantitiesBarChart from '../graphs/BarComponent';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval,getWeek, isSameMonth, isSameYear } from "date-fns";
import { selectCategories } from '../../features/api/categorySlice';
import { getWeekNumber, groupSalesBySRIDWithCustomer,formatCurrencyWithScale,calculateSalesMetricsToday, addCategoryNames, calculateSalesByCategoryWithPrice, calculateWeeklySalesPerDay,addCategoryToSales, calculateTotals, calculateTotal, calculateInventoryMetrics } from '../../dataAnalytics/functions';
import HorizontalBarGraph from '../graphs/StockVision';
import CurrencyFormat from 'react-currency-format';

const Dashboard = () => {

// console.log("WeekNumber: "+getWeekNumber(2024,3,1));
const salesData = useSelector(selectSales);
const products = useSelector(selectStock);
const categories = useSelector(selectCategories);
const customers = useSelector(selectCustomers);
console.log("Categories: "+JSON.stringify(categories));
const totalProducts = products.length;

const outOfStockProducts = products.reduce((count, product) => {
if(product.itemQuantity <= 0){
 return count+1;
}
return count;
},0)

console.log("outOfStockProducts: "+JSON.stringify(outOfStockProducts));

function getCurrentDateDetails() {
    const now = new Date();

    // Get the full year
    const year = now.getFullYear();

    // Get the month (0-indexed, so add 1)
    const month = now.getMonth() + 1;

    // Get the day of the month
    const day = now.getDate();

    return { day, month, year };
}
// Example usage
const currentDate = getCurrentDateDetails();

const weekNumber = getWeekNumber(currentDate.year, currentDate.month, currentDate.day);

console.log('week Number: '+weekNumber+' week');
  
  const DailySales = calculateWeeklySalesPerDay(salesData, currentDate.year, currentDate.month, weekNumber);

// Calculate totals
const totals = calculateTotals(salesData);

//calculate total quantity of stock for sell

const salesDataWithCatId = addCategoryToSales(salesData, products);
const SRID_groupedData = groupSalesBySRIDWithCustomer(salesData, customers);
console.log("SRID: "+JSON.stringify(SRID_groupedData));
// console.log("salesNew: "+JSON.stringify(salesDataWithCatId));
const totalSales = calculateTotal(salesDataWithCatId);
const catRankings = calculateSalesByCategoryWithPrice(salesDataWithCatId);
const catRankingsWithNames = addCategoryNames(catRankings,categories);
// console.log("SalesCat: "+JSON.stringify(catRankings));
console.log("SalesCatNames: "+JSON.stringify(catRankingsWithNames));
// console.log("End");

const salesArray = Object.values(catRankingsWithNames);
console.log('Rankings: '+JSON.stringify(catRankingsWithNames))

const categoryMappedData = salesArray.map(item => {
  return {
    category: item.categoryName,
    totalSales: item.totalAmount,
    totalQuantity: item.totalQuantity,
    percentageQuantity: item.quantityPercentage,
    percentageSales: item.amountPercentage
  };
});

// console.log('MappedData: '+JSON.stringify(mappedData));
// // console.log('MappedData: '+JSON.stringify(mappedData));
const inventoryMetrics = calculateInventoryMetrics(products);
const todayMetrics = calculateSalesMetricsToday(salesData);
console.log("inventory_metrics: "+JSON.stringify(inventoryMetrics));
console.log("Today_metrics: "+todayMetrics.totalQuantity);

    return (
      <div>
<div className='p-3'>
      <div className='w-full bg-white shadow-md KPI d-flex align-items-center gap-4 ps-4'>
<div>
    <div className='d-flex gap-3 align-items-center'>
        <div className='Kpi_icon'><Layers className='text-info' size={20}/></div>
        <div className='d-flex flex-column'>
            <div className='text-bold fs-6'style={{color:'#3D1CDA'}}>
                {totalProducts}
            </div>
            <div className='fs-8 text-muted'>
                Total Products
            </div>
        </div>
    </div>
</div>

<div>
    <div className='d-flex gap-3 align-items-center'>
        <div className='Kpi_icon'><BoxFill className='text-success' size={20}/></div>
        <div className='d-flex flex-column'>
            <div className='text-bold fs-6'style={{color:'#3D1CDA'}}>
                {totalSales?.totalQuantity}
            </div>
            <div className='fs-8 text-muted'>
                Products sold
            </div>
        </div>
    </div>
</div>


<div>
    <div className='d-flex gap-3 align-items-center'>
        <div className='Kpi_icon'><CurrencyDollar className='text-primary' size={20}/></div>
        
        <div className='d-flex flex-column'>
            <div className='text-bold fs-6'style={{color:'#3D1CDA'}}>
              {formatCurrencyWithScale(totalSales?.totalCost).formatted}
            </div>
            <div className='fs-8 text-muted'>
                Total Sales
            </div>
        </div>
    </div>
</div>

<div>
    <div className='d-flex gap-3 align-items-center justify-items-center '>
        <div className='Kpi_icon'><Coin className='text-info' size={20}/></div>
        <div className='d-flex flex-column'>
            <div className='text-bold fs-6'style={{color:'#3D1CDA'}}>
              {inventoryMetrics?.totalQuantity}
            </div>
            <div className='fs-8 text-muted'>
              Stock on Hand
            </div>
        </div>
    </div>
</div>

<div>
    <div className='d-flex gap-3 align-items-center'>
        <div className='Kpi_icon'><ExclamationOctagon color='red' size={20}/></div>
    
        <div className='d-flex flex-column'>
            <div className='text-bold fs-6'style={{color:'#3D1CDA'}}>
                {outOfStockProducts}
            </div>
            <div className='fs-8 text-muted'>
                Out of Stock 
            </div>
        </div>
    </div>
</div>

      </div>

      <HorizontalBarGraph remainingStock={inventoryMetrics?.totalQuantity} _soldToday={todayMetrics?.totalQuantity} rescentSold={totalSales?.totalQuantity} />

<div className='d-flex gap-2'>
<GraphFrame title='Daily Sales' graph={<SalesLineChart data={DailySales.weeklyRevenue} />} />
<GraphFrame title='Quantity Sold' graph={<QuantitiesBarChart data={DailySales.weeklySales} />}  />
</div>

<div className='d-flex gap-3'>
<div className='bg-white rounded shadow-md d-flex flex-column w-75'>
<div className='d-flex align-items-center justify-content-between ps-2 pe-2'>
   <div className='text-muted fs-bold' style={{fontSize:'1rem'}} >Rescent Transactions</div>
   <div>
   <Dropdown>
      <Dropdown.Toggle variant="transparent" id="dropdown-basic" className='border-none'>
       <ThreeDots />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
        <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
        <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
   </div>
</div>

<div className='bg-light shadow-md' style={{width:'100%', height:'1.5px'}}></div>

<div>
    <RecentTransactions data={SRID_groupedData} limit={5}/>
</div>

</div>

<div className='bg-white rounded shadow-md d-flex flex-column' style={{width:'250px'}}>
<div className='d-flex align-items-center justify-content-between ps-2 pe-2'>
   <div className='text-muted fs-bold' style={{fontSize:'1rem'}} >Sales Per Category</div>
   <div>
   <Dropdown>
      <Dropdown.Toggle variant="transparent" id="dropdown-basic" className='border-none'>
       <ThreeDots />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
        <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
        <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
   </div>
</div>

<div className='bg-light shadow-md' style={{width:'100%', height:'1.5px'}}></div>
<div>
   { 
    categoryMappedData?.map((ranking, index) => {
      return(
<div className='d-flex justify-content-between p-2' key={index}>
  {ranking?.percentageSales<50?<>
    <div className='text-muted'>{ranking?.category}
        <span className='text-danger'>(<Arrow90degDown />{ranking?.percentageSales}%)</span></div>
        <div className='text-danger fs-bold'>{
            formatCurrencyWithScale(ranking?.totalSales).formatted
        }</div>
    </>:
    <>
    <div className='text-muted'>{ranking?.category}
        <span className='text-success'>(<Arrow90degUp />{ranking?.percentageSales}%)</span></div>
        <div className='text-success fs-bold'>{
       formatCurrencyWithScale(ranking?.totalSales).formatted
       }</div>
    </>}
        
    </div>
      )
    })}
    
</div>
</div>

</div>

</div>

      </div>
    );
};

export default Dashboard;
