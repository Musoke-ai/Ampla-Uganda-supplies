import React from 'react';
import { useSelector } from 'react-redux';
import { selectStock } from '../../features/stock/stockSlice';
import { useEffect } from 'react';

const CountStock = () => {
  const items = useSelector(selectStock);

useEffect(()=> {
// window.alert("Hi");
},[]);

  return (
    <div>
       {/* Button trigger modal */}

 {/* Modal  */}
<div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable modal-md">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="staticBackdropLabel">Select Items</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">

        <div className='d-flex justify-content-cemter align-items-center'>
          <div className='d-flex flex-column gap-2 justify-content-center align-items-center'>
            <div className='d-flex gap-2 fw-bold fs-md'>
            <div><input type='checkbox' /></div>
              <div>Un mark All</div>
            </div>
            <div className='divider bg-dark w-100'></div>
        <ul className='list unstyled d-flex flex-column gap-2 justify-content-center'>
          {
            items.map((item, index) => {
             return <li id='index'>
              <div className='d-flex gap-2'>
                <div><input type='checkbox' /></div>
             <div className='d-flex'><div className='fw-bold'>{item.itemName}</div> <div className='text-muted'>({item.itemModel})</div></div> 
              </div>
              </li>
            })
          }
        </ul>
        </div>

        {/* <div>
        <h5>Select Items </h5>
        </div> */}

        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Print</button>
        <button type="button" class="btn btn-primary">Use Mobile</button>
      </div>
    </div>
  </div>
</div>
    </div>
  );
}

export default CountStock;
