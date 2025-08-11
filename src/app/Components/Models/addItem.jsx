import React from 'react';
import { useAddStockMutation } from '../../features/stock/stockSlice';
import { useSelector } from 'react-redux';
import { useState,useRef, useEffect } from 'react';
import { useGetCategoriesQuery } from '../../features/api/categorySlice';
import { selectCategories } from '../../features/api/categorySlice';
import Alerts from '../actions/Alerts';
import { LinearProgress } from '@mui/material';
import Notification from '../alerts/GlobalNotify';
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

  const onItemCategoryChanged = (event) => {
    setItemCategory(event.target.value);
  };

  const resetDropdown = () => {
    setItemCategory(""); // Reset to default
  };

  const [show, setShow] = useState(true);
  
  const onitemNameChanged = e => (setItemName(e.target.value));

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
  // resetDropdown('')
  setItemName('')
  // setItemCategory('')
  setItemModel('')
  setItemQuantity(1)
  setItemCondition('')
  setItemSize('')
  setItemMinPrice('')
  setItemNotes('')
  setItemOwner('')
  setItemStockPrice('') 
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
  
  return (
    <div>
        <div className="modal-dialog"  style={{ width: '75vw'}}>
    <div className="modal-content">
      <div className="modal-header text-white shadow" style={{backgroundColor: "#1C4E80"}}>
        <h5 className="modal-title" id="staticBackdropLabel">Create Product
        </h5>
        <button type="button" className="btn-close bg-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
              {
          isLoading?
   <LinearProgress />
          :""  
    }
      <div className="modal-body" style={{height: '410px'}}>
        <h5 classNameName='border-bottom pb-1' style={{borderColor: '#488A99'}}>Item Details</h5>
      <form className="row g-3 h-100">
  <div className="col-6">
    <label for="itemName" className="form-label" >Item Name</label>
    <input type="text" className="form-control" id="itemName" placeholder='Makita Angle Grinder 9"' value={item_name} onChange={onitemNameChanged} />
  </div>
  <div className="col-12">
    <label for="model" className="form-label">Model</label>
    <input type="text" className="form-control" id="model" placeholder="GA9020" value={item_model} onChange={onitemModelChanged} />
  </div>
  <div className="col-6">
    <label for="quantity" className="form-label">Quantity</label>
    <input type="number" value={item_quantity} className="form-control" id="quantity" onChange={onitemQuantityChanged} placeholder='100' />
  </div>
  <div className="col-12">
    <label for="quality" className="form-label">Quality</label>
    <select id="qualities" className="form-select  h-50" onChange={onitemQualityChanged}>
      <option selected>Select</option>
      {
        qualities.map( (quality, index) => {
return  <option key={index} value={quality} >{quality}</option>
        })
      }
    
    </select>
  </div>
 
  <div className="col-12">
    <label for="conditions" className="form-label">Condition</label>
    <select id="conditions" className="form-select  h-50" onChange={onitemConditionChanged}>
      <option selected>Select</option>
      {
        conditions.map( (condition, index) => {
return  <option key={index} value={condition} >{condition}</option>
        })
      }
    
    </select>
  </div>
  <div className="col-12">
    <label for="stockPrice" className="form-label">Purchase Price (including shipping and taxes)</label>
    <input type="text" className="form-control" id="stockPrice" placeholder="400000" value={item_stock_price} onChange={onItemStockPriceChanged} />
  </div>
  <div className="col-12">
    <label for="itemSize" className="form-label">Item Size</label>
    <input type="text" className="form-control" id="itemSize" placeholder="9inch" value={item_size} onChange={onitemSizeChanged} />
  </div>
  <div className="col-md-6">
    <label for="desc" className="form-label">Simple note</label>
    <input type="text-field" className="form-control" id="desc" placeholder='10 more pieces arriving next month' onChange={onitemNotesChanged} value={item_notes} />
  </div>
  <div className="col-md-4">
    <label for="category" className="form-label">Category</label>
    <select
        id="category"
        className="form-select h-50"
        value={item_category}
        onChange={onItemCategoryChanged}
      >
        <option value="" disabled>
          Select
        </option>
        {categories.map((category, index) => (
          <option key={index} value={category.categoryId}>
            {category.categoryName}
          </option>
        ))}
      </select>
  </div>
  <div className="col-md-2">
    <label for="lastPrice" className="form-label">Least selling price</label>
    <input type="text" className="form-control" id="lastPrice" value={item_min_price} onChange={onitemLeastPriceChanged} />
  </div>

</form>
      </div>
      <div className="modal-footer mt-4">

        {
          canAdd?
          <button type="button" className="btn btn-secondary" onClick={(e) => {
          e.preventDefault();
          handleAddItem();
        }}>Add</button>:
        <button type="button" className="btn btn-secondary" disabled>Add</button>
        }

      </div>
    </div>
  </div>

    </div>
  );
}

export default AddItem;
