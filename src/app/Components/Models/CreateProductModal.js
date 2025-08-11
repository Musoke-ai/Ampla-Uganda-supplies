import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import { useAddStockMutation } from '../../features/stock/stockSlice';
import { useSelector } from 'react-redux';
import { useState,useRef, useEffect } from 'react';
import { useGetCategoriesQuery } from '../../features/api/categorySlice';
import { selectCategories } from '../../features/api/categorySlice';
import Alerts from '../actions/Alerts';
import { LinearProgress } from '@mui/material';

function CreateProductModal({show, setShow}) {
  const handleClose = () => setShow(false);

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
  const [item_category, setItemCategory] = useState('Cake Boards');
  const [item_model, setItemModel] = useState('');
  const [item_quality, setItemQaulity] = useState('New');
  const [item_quantity, setItemQuantity] = useState('');
  const [item_condition, setItemCondition] = useState('Good');
  const [item_size, setItemSize] = useState('');
  const [item_retail_price, setRetailPrice] = useState('');
  const [item_notes, setItemNotes] = useState('For Bakery');
  const [item_owner, setItemOwner] = useState(1);
  const [item_wholesale_price, setWholesalePrice] = useState(0);
  let category = '';
  
  const onitemNameChanged = e => (setItemName(e.target.value));
  const onitemCategoryChanged = (e) => {
    category = e.target.value;
    setItemCategory(category);
    // window.alert("category: "+item_category+"Evalue: "+e.target.value);
  };
  const onitemModelChanged = e => (setItemModel(e.target.value));
  // const onitemQualityChanged = e => {setItemQaulity(e.target.value);};
  const onitemQuantityChanged = e => {setItemQuantity(e.target.value);}
  // const onitemConditionChanged = e => {setItemCondition(e.target.value);}
  const onitemSizeChanged = e => (setItemSize(e.target.value));
  const onRetailPriceChanged = e => (setRetailPrice(e.target.value));
  // const onitemNotesChanged = e => (setItemNotes(e.target.value));
  const onWholesalePriceChanged = e => (setWholesalePrice(e.target.value));

  useEffect(() => {
    if(item_quantity !== ""){
      if(Number(item_quantity) <= 0){
        setItemQuantity(1);
      }
    }
  }, [item_quantity]);
  
  const canAdd = [item_name, item_category, item_model, item_quantity, item_retail_price, item_wholesale_price].every(Boolean) && !isLoading;
  
const resetFields = () => {
  setItemName(' ')
  // setItemCategory(' ')
  // category = ' ';
  setItemModel(' ')
  // setItemQaulity(' ')
  setItemQuantity(1)
  // setItemCondition(' ')
  setItemSize(' ')
  setRetailPrice(' ')
  setWholesalePrice(' ')
  // setItemNotes(' ')
  setItemOwner('')
  // setItemStockPrice(' ') 
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
        item_min_price: item_retail_price,
        item_notes,
        item_owner,
        item_stock_price: item_wholesale_price
      }).unwrap()
    resetFields();
    } catch (err) {
  
    }
   }
  }

  return (
    <div>
      <Modal show={show} onHide={handleClose} style={{overflowY:"hidden",width:"100vw"}}>
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>
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
        <Modal.Body style={{height:"70vh",overflowY:"auto"}}>
        <h5 classNameName='border-bottom pb-1' style={{borderColor: '#488A99'}}>Enter Product Details</h5>
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
  {/* <div className="col-12">
    <label for="quality" className="form-label">Quality</label>
    <select id="qualities" className="form-select  h-50" onChange={onitemQualityChanged}>
      <option selected>Select</option>
      {
        qualities.map( (quality, index) => {
return  <option key={index} value={quality} >{quality}</option>
        })
      }
    
    </select>
  </div> */}
 
  {/* <div className="col-12">
    <label for="conditions" className="form-label">Condition</label>
    <select id="conditions" className="form-select  h-50" onChange={onitemConditionChanged}>
      <option selected>Select</option>
      {
        conditions.map( (condition, index) => {
return  <option key={index} value={condition} >{condition}</option>
        })
      }
    
    </select>
  </div> */}
  <div className="col-12">
    <label for="wholesalePrice" className="form-label">Wholesale Price </label>
    <input type="text" className="form-control" id="wholesalePrice" placeholder="400000" value={item_wholesale_price} onChange={onWholesalePriceChanged} />
  </div>

  <div className="col-12">
    <label for="itemSize" className="form-label">Item Size</label>
    <input type="text" className="form-control" id="itemSize" placeholder="9inch" value={item_size} onChange={onitemSizeChanged} />
  </div>
     {/*
  <div className="col-md-6">
    <label for="desc" className="form-label">Simple note</label>
    <input type="text-field" className="form-control" id="desc" placeholder='10 more pieces arriving next month' onChange={onitemNotesChanged} value={item_notes} />
  </div>
  <div className="col-md-6">
    <label for="category" className="form-label">Category</label>
    <select id="category" className="form-select  h-50" onChange={onitemCategoryChanged}>
      <option selected>Select</option>
      {
        categories.map( (category, index) => {
return  <option key={index} value={category?.categoryId}>{category?.categoryName}</option>
        })
      }
    
    </select>
  </div> */}

  <div className="col-md-12 mb-4" style={{marginBottom:"1rem"}} >
    <label for="lastPrice" className="form-label">Retail Price</label>
    <input type="text" className="form-control" id="lastPrice" value={item_retail_price} onChange={onRetailPriceChanged} />
  </div>

</form>
        </Modal.Body>
        <Modal.Footer style={{marginTop:"1rem"}}>
        {
          canAdd?
          <button type="button" className="btn btn-secondary" onClick={(e) => {
          e.preventDefault();
          handleAddItem();
        }}>Add</button>:
        <button type="button" className="btn btn-secondary" disabled>Add Product</button>
        }
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CreateProductModal;