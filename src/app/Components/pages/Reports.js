import React from 'react';
import { LineChart } from '@mui/x-charts';
import { selectStock } from '../../features/stock/stockSlice';
import { useSelector } from 'react-redux';
import { selectStatistics } from '../../features/api/statisticsSlice';
import { selectSales } from '../../features/api/salesSlice';
import { selectCategories } from '../../features/api/categorySlice';
import { format } from 'date-fns';
import { current } from '@reduxjs/toolkit';
import BarComponent from '../graphs/BarComponent'
import PieChart from '../graphs/PieChartComponent';
import { Cell,RadialBar,RadialBarChart,AreaChart, linearGradient,Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart } from 'recharts';
import PieChartComponent from '../graphs/PieChartComponent';

const Reports = () => {
  const data = useSelector(selectStock);
  const sales = useSelector(selectSales);
  const stats = useSelector(selectStatistics);
  const categories = useSelector(selectCategories);
  
  const productNames = data?.map((item) => item.itemName);
  const productsQty = data?.map((item) => item.itemQuantity);

//Extracting top selling products and manuplating the array formed
const findItemName = (id) => {
  const itemName = data.filter((item) => Number(item.itemId) === id);
  return itemName[0].itemName;
}
  let topSalesDataset = [];
  let topSelling = stats.filter((item) => Number(item.statItemSales) > 0);
  topSelling = topSelling.map((item) => {
    return{ ...item,
      itemName: findItemName(Number(item.statItemId)),
    } 
  })

  //Sales trend logic

  //extracting and normalizing dates
  const dates = sales?.map((item) => {
    if(item !== undefined){
      let date = item.saleDateCreated;
      if(date !== undefined) {
        date = date.split(" ")[0];
        return date;
      }else{
        return {};
      }
    }
  })
// removing duplicates
let uniqueDates = dates.reduce ((acc, curr) => {
  if(!acc.includes(curr))
  acc.push(curr);
return acc;
},[]);

// calculating total sales per date
  const _sales = uniqueDates.map((date) => {
    let newSale = {};
    newSale['date'] = date;
   const salesPerDate = sales.filter((sale) => {
    if(sale !== undefined){
      let _date = sale.saleDateCreated;
      if(_date !== undefined){
        _date = date.split(" ");
        if(_date === date){
          return date;
        }
      }
    }
  });

   const totalSalesPerDate = salesPerDate.reduce((acc, curr) => {
  return acc+Number(curr.saleQuantity)
   },0)//calculating total sales

   newSale['sales'] = totalSalesPerDate;
return newSale;
  })

  //Sales per category logic
  const findItemCategory = (id) => {
    const item = data.filter((item) =>Number(item.itemId) === Number(id) );
     const category = categories.filter((category) => Number(item[0]?.itemCategoryId) === Number(category?.categoryId) )
      return category[0]?.categoryName;
  }

  //Scanning Sales and arranging items sales according to categories
  const salesPerCategory = categories.map((category) => {
    let newSalesPerCategory = {};
    newSalesPerCategory['category'] = category.categoryName;
    const salesInCategory = sales.filter((sale) => category.categoryName === findItemCategory(sale.saleItemId));
    const totalSalesPerCategory = salesInCategory.reduce((acc, curr) => {
      return acc + Number(curr.saleQuantity);
    },0)
    newSalesPerCategory['sales'] = totalSalesPerCategory;
    return newSalesPerCategory;
  })
  //Generate pieChart data
  const pieChartData = salesPerCategory.map((data, index) => {
    // { id: 0, value: 10, label: 'series A' },
    const newData = {}
    newData['id'] = index;
    newData['value'] = data.sales;
    newData['label'] = data.category;  
    return newData;
  })

  return<div>
    {
      data.length>=5?
      <div>
<div className='d-flex justify-content-end pe-2'>
  <button type='button' className='btn btn-white border-bottom shadow-sm'>Today</button>
  <button type='button' className='btn btn-white text-muted'>Weekly</button>
  <button type='button' className='btn btn-white text-muted'>Monthly</button>
</div>
{data?
<div style={{height: '100%', width: '100%',overflow: 'auto'}}>
<div className='bg-white m-2 p-1 shadow-sm' style={{width: '100%', height: '150px'}}>
  <h5 className='bg-light rounded w-25 p-2'>Stock levels</h5>
  {
    data.length >= 5?
<BarComponent  data={data} layout='horizontal' />
    : <div>No Data for graph</div>
  }

  </div>

<div className="bg-white ps-2 pe-2 mb-3 d-flex flex-row gap-4 p-2" style={{width: '100%', height: '320px'}}>

<div>
  <h5 className='bg-light rounded p-2 w-50'>Sales Per Category</h5>
  {sales.length >= 5 && categories.length >0?
<PieChartComponent data={salesPerCategory} />
: <div>No data for pie</div>
  }

</div>
<div className='ps-2'>
  <h5 className='bg-light rounded p-2 w-50'>Top Selling Products</h5>
  {
    stats.length >= 5 && topSelling.length > 0?
    // <BarComponent data={data} layout='vertical' />
    <BarChart
    dataset={topSelling}
    yAxis={[{ scaleType: 'band', dataKey: 'itemName' }]}
    series={[{ dataKey: 'statItemSales', label: 'Item Sales'}]}
    layout="horizontal"
    height={250}
    width={600}
  />
  : <div>No data</div>
  }

</div>
</div>

<div className='bg-white ms-2 me-2 p-2' style={{width: '100%', height: '300px'}}>
  <h5>Sales Trend</h5>
  {sales.length >= 5 && _sales.length >= 5?
  <LineChart
  dataset={_sales}
  xAxis={[{scaleType: 'point', dataKey: 'date' }]}
  series={[{ dataKey: 'sales'}]}
  height={250}
/>:<div>No data</div>

  }

</div>

</div>:<div className='d-flex justify-content-center align-items-center w-100 h-100 mt-4'><div className='bg-white p-2 rounded shadow-sm'>No Data for graphs</div></div>
}
</div>:<div className='d-flex justify-content-center align-items-center mt-5 w-100 p-2'><div className=' bg-white rounded shadow-sm text-center p-2'>No enough data for any graph</div></div>}
</div>
}

export default Reports;
