import { PriceChange } from '@mui/icons-material';
import React from 'react';
import { useState } from 'react';

const PriceInput = ({item, calcTotal}) => {

const [priceChange, setPriceChange] = useState(item.itemLeastPrice)

const handlePriceChange = (e) => {
    let value = e.target.value;
    setPriceChange(value);
    if(Number(value) >= Number(item.itemLeastPrice)){//Change to number for proper comparison
   e.target.style = "outline-color: black"; 
   item.salePrice = value;
   calcTotal();
    }else if(Number(value) < Number(item.itemLeastPrice)){
        e.target.style = "outline-color: red"; 
        item.salePrice = item.itemLeastPrice;
        // window.alert("Very low selling price entered! Item to be sold at its least price of "+item.itemLeastPrice);
    calcTotal();
    }
}

  return (
    <div>
        <input
   type='text'
    className='form-comtrol border-0 shadow-sm p-2'
    // style={{outlineColor: 'red'}}
     value={priceChange}
     onChange={handlePriceChange}
     placeholder={item.itemLeastPrice}
      />
    </div>
  );
}

export default PriceInput;
