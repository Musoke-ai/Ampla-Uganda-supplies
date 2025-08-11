
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { selectStockById, useDeleteStockMutation,useUpdateStockMutation } from '../../features/stock/stockSlice';
import { useSelector } from 'react-redux';
import Alerts from '../actions/Alerts';
import { selectCategories } from '../../features/api/categorySlice';
import { PencilFill } from 'react-bootstrap-icons';
import { LinearProgress } from '@mui/material';
import CategoryExcerpty from '../excerpts/CategoryExcerpty'
import { Alert } from 'react-bootstrap';
import PermissionWrapper from '../../auth/PermissionWrapper';


function ProductDetails({itemId, _setShowProductDetails,_showProductDetails}) {
  const handleClose = () => _setShowProductDetails(false);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  // const [tittle, setTitle] = useState('');
  // const [action, setAction] = useState('');


  const categories = useSelector(selectCategories);
  const [updateItem, {
     data,
     error,
     isError,
     isLoading,
     isSuccess }] = useUpdateStockMutation();
  const [deleteStock, { 
    data: deleteData,
    isLoading: isDeleteLoading,
    isSuccess: isDeleteDone,
    isError: isErrorOnDelete,
    error: deleteError

   }] = useDeleteStockMutation();
  const [isEditable, setIsEditable] = useState(false);
  const item = useSelector((state) => selectStockById(state, Number(itemId)))
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showDeleteDoneAlert, setShowDeleteDoneAlert] = useState(false);
  // let item_id = Number(itemId)
  const [showAlert, setShowAlert] = useState(false);

  const title = isSuccess?'Process completed succefully':"";

  const [item_name, setItemName] = useState(item?item.itemName:"");
  const [item_category, setItemCategory] = useState(item?item.itemCategoryId:"");
  const [item_model, setItemModel] = useState(item?item.itemModel:"");
  const [item_quality, setItemQaulity] = useState(item?item.itemQuality:"");
  const [item_quantity, setItemQuantity] = useState(item?item.itemQuantity:"");
  const [item_condition, setItemCondition] = useState(item?item.itemCondition:"");
  const [item_size, setItemSize] = useState(item?item.itemSize:"");
  const [item_stock_price, setItemStockPrice] = useState(item?item.itemStockPrice:"");
  const [item_min_price, setItemMinPrice] = useState(item?item.itemLeastPrice:"");
  const [item_notes, setItemNotes] = useState(item?item.itemNotes:"");
  const [item_owner, setItemOwner] = useState(1);

  const [invalidQuantity, setInvalidQuantity] = useState(false);

useEffect(() => {
setItemCategory(item?.itemCategoryId)
}, []);

  const fillEditableFields = () => {
    setItemName(item?item.itemName:"");
    setItemCategory(item?item.itemCategory:"");
    setItemModel(item?item.itemModel:"");
    setItemQaulity(item?item.itemQuality:"");
    setItemQuantity(item?item.itemQuantity:"");
    setItemCondition(item?item.itemCondition:"");
    setItemSize(item?item.itemSize:"");
    setItemStockPrice(item?item.itemStockPrice:"");
    setItemMinPrice(item?item.itemLeastPrice:"");
    setItemNotes(item?item.itemNotes:"");
  }

  let category ='';
  
  const onitemNameChanged = e => (setItemName(e.target.value));
  const onitemCategoryChanged = (e) => {
    category = Number(e.target.value);
    // console.log("cat: "+category)
    setItemCategory(category)
  };

  const onitemModelChanged = e => (setItemModel(e.target.value));
  const onitemQualityChanged = e => (setItemQaulity(e.target.value));
  const onitemQuantityChanged = e => (setItemQuantity(e.target.value));
  const onitemConditionChanged = e => (setItemCondition(e.target.value));
  const onitemSizeChanged = e => (setItemSize(e.target.value));
  const onItemStockPriceChanged = e => (setItemStockPrice(e.target.value));
  const onitemLeastPriceChanged = e => (setItemMinPrice(e.target.value));
  const onitemNotesChanged = e => (setItemNotes(e.target.value));

  const [deleteSession, setDeleteSession] = useState(false);

 //Solves Err: Objects are not valid as a React child (found: object with keys {item_category}).
useEffect(()=>{
  console.log('ItemCat: '+item?.itemCategoryId);
  setItemCategory(item?.itemCategoryId);
},[isEditable])

useEffect(() => {
  setInvalidQuantity(false);
if(item_quantity !== ""){
if(Number(item_quantity) <= 0){
  setItemQuantity(0);
}
}
}, [item_quantity])

  const canUpdate = [item_name, item_model, item_size, item_min_price].every(Boolean) && !isLoading;

  const handleUpdateItem = async () => {
    
    if (canUpdate){
     try {
  await updateItem({
         itemId,
         item_name,
         item_category,
         item_model,
         item_quality,
         item_quantity,
         item_condition,
         item_size,
         item_stock_price,
         item_min_price,
         item_notes,
         item_owner
       }).unwrap();
   
       setItemName(item.itemName)
       setItemCategory(item.itemCategoryId)
       setItemModel(item.itemModel)
       setItemQaulity(item.itemQuality)
       setItemQuantity(item.itemQuantity)
       setItemCondition(item.itemCondition)
       setItemSize(item.itemSize)
       setItemStockPrice(item.itemStockPrice)
       setItemMinPrice(item.itemLeastPrice)
       setItemNotes(item.itemNotes)
         setIsEditable(false)
         setShow(true);
   
     } catch (err) {
   
     } finally {
   
     }
    }
   }

  const handleEditClk = () => {
    setIsEditable(true);
  }

  const handleDelete = async (itemId) => {
     try {
       const data = await deleteStock({
        itemId
       }).unwrap();
       itemId = null;
       setShowDeleteAlert(false);
       setShowDeleteDoneAlert(true);
     } catch (err) {
     }
 
   }

   //Error origin too many renders
  //  if(isSuccess){
  //   setIsEditable(false);
  //  }

  return (
    <>
    {
        !item? <Offcanvas show={_showProductDetails} onHide={handleClose} placement={'end'}>
        <Offcanvas.Header closeButton>
        <h5 class="text-danger" id="offcanvasRightLabel">Item Missing or Removed! {itemId}</h5> 
        </Offcanvas.Header>
        <Offcanvas.Body>
        {
      isDeleteDone?<Alerts heading="Deleting done!"
       message={deleteData['Messages']}
        variant='success'
         autoHide={true}
         delay={7000} 
         _show={showDeleteDoneAlert}
         _setShow={setShowDeleteDoneAlert}
      />
      :""
     }
  {
      isErrorOnDelete?<Alerts heading="Deleting failed!" 
      message={deleteData['Messages']}
       variant='success' autoHide={true}
        delay={7000} 
        _show={showErrorAlert}
        _setShow={setShowErrorAlert}
        />
      :""
     }
        </Offcanvas.Body>
      </Offcanvas>
      :
      <Offcanvas show={_showProductDetails} onHide={()=>{handleClose();setIsEditable(false)}} placement={'end'}  >
      <Offcanvas.Header closeButton>
      <h5>Details for: 
      <span class="fw-bold ms-1">{item.itemName}</span></h5>
      
      {
      !isEditable? <span>
        <PermissionWrapper required={['edit']} children={
        <button type='button' aria-label='editButton' className='btn btn-md btn-white btn-outline-info' onClick={() => {handleEditClk();fillEditableFields();}} ><PencilFill /></button>
      }/>
        </span>
          :
   ""
   }
      </Offcanvas.Header>
      {
         isDeleteLoading?
          
<LinearProgress  />
          :""  
    }
     {
          isLoading?
  //Update request processing...
  <LinearProgress  />
          :  ""
    }
      <Offcanvas.Body>

      <form>

 {isEditable? <fieldset> 
   <div class="mb-3">
   <label for="name" class="form-label">Name</label>
   <input type="text" id="name" class="form-control" placeholder="Name" value={item_name} onChange={onitemNameChanged} />
 </div>
 <div class="mb-3">
   <label for="model" class="form-label">Model</label>
   <input type="text" id="model" class="form-control" placeholder="Model" value={item_model} onChange={onitemModelChanged} />
 </div>
 <div class="mb-3">
   <label for="quality" class="form-label">Quality</label>
   <input type="text" id="quality" class="form-control" placeholder="Quality" value={item_quality} onChange={onitemQualityChanged} />
 </div>
 <div class="mb-3">
   <label for="quantity" class="form-label">Quantity</label>
   <input type="number" id="quantity" class="form-control" placeholder="Quantity" value={item_quantity} onChange={onitemQuantityChanged} />
   {
     invalidQuantity? <p className='bg-warning'>
     Invalid Quantity entered! 
   </p>:""
   }
  
 </div>
 <div class="mb-3">
   <label for="condition" class="form-label">Condition</label>
   <input type="text" id="condition" class="form-control" placeholder="Condition" value={item_condition} onChange={onitemConditionChanged} />
 </div>
 <div class="mb-3">
   <label for="stockPrice" class="form-label">Stock Price</label>
   <input type="text" id="stockPrice" class="form-control" placeholder="Stock price" value={item_stock_price} onChange={onItemStockPriceChanged} />
 </div>
 <div class="mb-3">
   <label for="sellingPrice" class="form-label">Selling Price</label>
   <input type="text" id="sellingPrice" class="form-control" placeholder="Selling price" value={item_min_price} onChange={onitemLeastPriceChanged} />
 </div>
 <div class="mb-3">
   <label for="size" class="form-label">Size</label>
   <input type="text" id="size" class="form-control" placeholder="Size" value={item_size} onChange={onitemSizeChanged} />
 </div>
 <div class="mb-3">
   <label for="description" class="form-label">Description</label>
   <textarea class="form-control" id="desc" rows="3" onChange={onitemNotesChanged} value={item_notes} ></textarea>
 </div>
 <div class="mb-3">
   <label for="category" class="form-label">Category</label>
   <select id="category" class="form-select h-25"   onClick={onitemCategoryChanged}>
     <option selected>{
  categories.map((cat)=>{
   if(cat.categoryId === item.itemCategoryId){
     // setItemCategory(cat.categoryId);
     return cat.categoryName;
   }
  })
   } </ option>
     {
       categories.map((category, index) => {
         return <option
          key={index}
          value={category.categoryId}
        >{category.categoryName}</option>
       })
     }
   </select>
 </div>
</fieldset> : 

<fieldset disabled> 
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Model</label>
   <input type="text" id="disabledTextInput" class="form-control" placeholder="Disabled input" value={item?.itemModel} />
 </div>
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Quality</label>
   <input type="text" id="disabledTextInput" class="form-control" placeholder="Disabled input" 
   value={item?.itemQuality}
    />
 </div>
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Quantity</label>
   <input type="text" id="disabledTextInput" class="form-control" placeholder="Disabled input" value={item?.itemQuantity} />
 </div>
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Condition</label>
   <input type="text" id="disabledTextInput" class="form-control" placeholder="Disabled input" 
   value={item?.itemCondition} 
   />
 </div>
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Selling Price</label>
   <input type="text" id="disabledTextInput" class="form-control" placeholder="Disabled input" value={item?.itemLeastPrice} />
 </div>
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Size</label>
   <input type="text" id="disabledTextInput" class="form-control" placeholder="Disabled input" value={item?.itemSize} />
 </div>
 <div class="mb-3">
   <label for="disabledTextInput" class="form-label">Description</label>
   <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" >{item?.itemNotes}</textarea>
 </div>
 <div class="mb-3">
   <label for="disabledSelect" class="form-label">Category</label>
   <input id="disabledCategory" class="form-select h-25" value={
     // item.itemCategoryId
  categories.map((cat)=>{
   if(cat.categoryId === item.itemCategoryId){
     return cat.categoryName;
   }
  })
   } />
 </div>
</fieldset>

}
<hr />
<div class="d-flex flex-row justify-content-between align-items-center" >
 {isEditable? <button type="button" class="btn btn-primary" onClick={()=>{handleUpdateItem()}}>Save Changes</button>:
""
 }

 {isEditable? <div>{!isDeleteLoading?
 <PermissionWrapper required={['delete']} children={
  <button type="button" class="btn btn-danger" 
 onClick={() => {setDeleteSession(true);
  setShow(true)}}
 >Delete 
 </button>
 } />
  :""}</div> 
 : ""}
 </div>

</form>

      </Offcanvas.Body>
      <Alert show={show} variant={deleteSession?'danger':'success'}>
        <Alert.Heading>{title}</Alert.Heading>
        <p>
        {deleteSession?<div><h6>You are about to delete an item from the inventory</h6>
          Click Ok to delete or Close to abort the action! 
          </div>
          :<div> {
            data?.Message
            }</div> 
        }
        </p>
        <hr />
        <div className="d-flex justify-content-end gap-3">
          <div>
          <Button 
          onClick={() => {
            setShow(false);
            setDeleteSession(false);
            }} variant="outline-success">
            Close
          </Button>
          </div>
          {deleteSession?<div>
          <Button
           onClick={() => {
            setShow(false);
            handleDelete(Number(itemId));
            setDeleteSession(false);
           }} 
           variant="outline-danger">
            Delete
          </Button>
          </div>:""}
        </div>
      </Alert>
      {/* {isSuccess?
  <Alerts 
  heading="Process done!" 
  message={data.message} 
  variant='success' 
  autoHide={true} 
  delay={7000} 
  _setShow = {setShowDeleteDoneAlert}
  _show ={showDeleteDoneAlert}
  />
   :"" } */}

{/* {isError?
  <Alerts heading={"Process status: "+error.status} message={error.error+': or Check your Network'} variant='danger' autoHide={true} delay={7000}
  _setShow = {setShowErrorAlert}
  _show ={showErrorAlert}
  />
   :"" } */}

   {
    // <Alerts
    //  heading="You are about to delete an item from the inventory"
    //  message="Click Ok to delete or Close to abort the action!"   
    //  variant='warning'
    //  action={handleDelete}
    //  payload={Number(itemId)}
    //  autoHide="true"
    //  delay={1000}
    // //  _setShow = {setShowDeleteAlert}
    //  _setShow = {false}
    //  _show ={false}
    //  />
   }
    </Offcanvas>
    }
     
    </>
  );
}

export default ProductDetails;