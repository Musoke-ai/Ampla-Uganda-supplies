import React from 'react';
import { useAddStockMutation } from '../../features/stock/stockSlice';
import { useSelector } from 'react-redux';
import { useState,useRef, useEffect } from 'react';
import { useGetCategoriesQuery } from '../../features/api/categorySlice';
import { selectCategories } from '../../features/api/categorySlice';
import Alerts from '../actions/Alerts';
import { LinearProgress } from '@mui/material';
function AddItem() {

  const {
    data: response,
    isLoading: cisLoading,
    isSuccess: cIssuccess,
    isError: cisError,
    error: cError
  } = useGetCategoriesQuery();

  const categories = useSelector(selectCategories);
  const [addStock, { isLoading, isSuccess }] = useAddStockMutation();

  const conditions = ['New','Used'];
  const qualities = ['Original','Second grade'];
  
  const [item_name, setItemName] = useState('');
  const [item_category, setItemCategory] = useState('');
  const [item_model, setItemModel] = useState('');
  const [item_quality, setItemQaulity] = useState('');
  const [item_quantity, setItemQuantity] = useState('');
  const [item_condition, setItemCondition] = useState('');
  const [item_size, setItemSize] = useState('');
  const [item_min_price, setItemMinPrice] = useState('');
  const [item_notes, setItemNotes] = useState('');
  const [item_owner, setItemOwner] = useState(1);
  const [item_stock_price, setItemStockPrice] = useState(0);
  let category = '';
  
  const onitemNameChanged = e => (setItemName(e.target.value));
  const onitemCategoryChanged = (e) => {
    category = e.target.value;
    setItemCategory(category);
    // window.alert("category: "+item_category+"Evalue: "+e.target.value);
  };
  const onitemModelChanged = e => (setItemModel(e.target.value));
  const onitemQualityChanged = e => {setItemQaulity(e.target.value);};
  const onitemQuantityChanged = e => {setItemQuantity(e.target.value);}
  const onitemConditionChanged = e => {setItemCondition(e.target.value);}
  const onitemSizeChanged = e => (setItemSize(e.target.value));
  const onitemLeastPriceChanged = e => (setItemMinPrice(e.target.value));
  const onitemNotesChanged = e => (setItemNotes(e.target.value));
  const onItemStockPriceChanged = e => (setItemStockPrice(e.target.value));

  useEffect(() => {
    if(item_quantity !== ""){
      if(Number(item_quantity) <= 0){
        setItemQuantity(1);
      }
    }
  }, [item_quantity]);
  
  const canAdd = [item_name, item_category, item_model, item_quantity, item_min_price, item_stock_price].every(Boolean) && !isLoading;
  
const resetFields = () => {
  setItemName(' ')
  setItemCategory(' ')
  category = ' ';
  setItemModel(' ')
  setItemQaulity(' ')
  setItemQuantity(1)
  setItemCondition(' ')
  setItemSize(' ')
  setItemMinPrice(' ')
  setItemNotes(' ')
  setItemOwner('')
  setItemStockPrice(' ') 
}

  const handleAddItem = async () => {
   if (canAdd){
    try {
      await addStock({
        item_name,
        item_category,
        item_model,
        item_quality,
        item_quantity,
        item_condition,
        item_size,
        item_min_price,
        item_notes,
        item_owner,
        item_stock_price
      }).unwrap()
    resetFields();
    } catch (err) {
  
    }
   }
  }
if(isSuccess){

}
  return (
    <div>
        <div class="modal-dialog"  style={{ width: '75vw'}}>
    <div class="modal-content">
      <div class="modal-header text-white shadow" style={{backgroundColor: "#1C4E80"}}>
        <h5 class="modal-title" id="staticBackdropLabel">New Item Entry Form
        </h5>
        <button type="button" class="btn-close bg-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
              {
          isLoading?
   <LinearProgress />
          :""  
    }
                      {
    isSuccess? <Alerts
    heading="Item Added"
    message="Item has been successfully added to your inventory"
    delay={600}
    variant="success"
    />:" "
  }
      <div class="modal-body" style={{height: '410px'}}>
        <h5 className='border-bottom pb-1' style={{borderColor: '#488A99'}}>Item Details</h5>
      <form class="row g-3 h-100">
  <div class="col-6">
    <label for="itemName" class="form-label" >Item Name</label>
    <input type="text" class="form-control" id="itemName" placeholder='Makita Angle Grinder 9"' value={item_name} onChange={onitemNameChanged} />
  </div>
  <div class="col-12">
    <label for="model" class="form-label">Model</label>
    <input type="text" class="form-control" id="model" placeholder="GA9020" value={item_model} onChange={onitemModelChanged} />
  </div>
  <div class="col-6">
    <label for="quantity" class="form-label">Quantity</label>
    <input type="number" value={item_quantity} class="form-control" id="quantity" onChange={onitemQuantityChanged} placeholder='100' />
  </div>
  <div class="col-12">
    <label for="quality" class="form-label">Quality</label>
    <select id="qualities" class="form-select  h-50" onChange={onitemQualityChanged}>
      <option selected>Select</option>
      {
        qualities.map( (quality, index) => {
return  <option key={index} value={quality} >{quality}</option>
        })
      }
    
    </select>
  </div>
 
  <div class="col-12">
    <label for="conditions" class="form-label">Condition</label>
    <select id="conditions" class="form-select  h-50" onChange={onitemConditionChanged}>
      <option selected>Select</option>
      {
        conditions.map( (condition, index) => {
return  <option key={index} value={condition} >{condition}</option>
        })
      }
    
    </select>
  </div>
  <div class="col-12">
    <label for="stockPrice" class="form-label">Purchase Price (including shipping and taxes)</label>
    <input type="text" class="form-control" id="stockPrice" placeholder="400000" value={item_stock_price} onChange={onItemStockPriceChanged} />
  </div>
  <div class="col-12">
    <label for="itemSize" class="form-label">Item Size</label>
    <input type="text" class="form-control" id="itemSize" placeholder="9inch" value={item_size} onChange={onitemSizeChanged} />
  </div>
  <div class="col-md-6">
    <label for="desc" class="form-label">Simple note</label>
    <input type="text-field" class="form-control" id="desc" placeholder='10 more pieces arriving next month' onChange={onitemNotesChanged} value={item_notes} />
  </div>
  <div class="col-md-4">
    <label for="category" class="form-label">Category</label>
    <select id="category" class="form-select  h-50" onChange={onitemCategoryChanged}>
      <option selected>Select</option>
      {
        categories.map( (category, index) => {
return  <option key={index} value={category?.categoryId}>{category?.categoryName}</option>
        })
      }
    
    </select>
  </div>
  <div class="col-md-2">
    <label for="lastPrice" class="form-label">Last selling price</label>
    <input type="text" class="form-control" id="lastPrice" value={item_min_price} onChange={onitemLeastPriceChanged} />
  </div>

</form>
      </div>
      <div class="modal-footer mt-4">

        {
          canAdd?
          <button type="button" class="btn btn-secondary" onClick={(e) => {
          e.preventDefault();
          handleAddItem();
        }}>Add</button>:
        <button type="button" class="btn btn-secondary" disabled>Add</button>
        }
        {/* <button type="button" class="btn btn-primary">Add & Cont...</button> */}

      </div>
    </div>
  </div>
    </div>
  );
}

export default AddItem;
