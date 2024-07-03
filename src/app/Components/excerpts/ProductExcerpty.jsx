import React from 'react';
import { useSelector } from 'react-redux';
import { selectStockById } from '../../features/stock/stockSlice';
import CategoryExcerpty from './CategoryExcerpty';
const ProductExcerpty = ({itemId, field}) => {
const item = useSelector((state) => selectStockById(state, Number(itemId)));
let output = "";
if(item != undefined)
{
    if(field === 'itemName'){
    output = item.itemName
    return output;
}
else if(field === 'itemModel'){
    output = item.itemModel
    return output;
}
// else if(field === 'itemCategory'){
//     output = 
//     return output;
// }
}
  return (
    <div>
        {field === 'itemCategory'?<CategoryExcerpty catId={item?.itemCategoryId} />:output}
    </div>
  );
}

export default ProductExcerpty;
