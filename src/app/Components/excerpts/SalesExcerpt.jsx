import React from 'react';
import { selectStatistics } from '../../features/api/statisticsSlice';
import { useSelector } from 'react-redux';
import { useState } from 'react';

const SalesExcerpt = ({itemId, saleType}) => {
  let sales =0
    const stats = useSelector(selectStatistics);
    const itemSales = stats.filter((stat) =>{
        return stat.statItemId === itemId
    })
    // window.alert(itemSales)
    if(itemSales !== undefined){
        if(itemSales[0] !== undefined){
            if(saleType === "debt"){
                sales = itemSales[0].statItemIndebt
            }else{
                sales = itemSales[0].statItemSales
            }
        }
       
    }

  return (
    <div>
      {sales}
    </div>
  );
}

export default SalesExcerpt;
