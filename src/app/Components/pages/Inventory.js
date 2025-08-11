import React from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

import DisplayData from "../../features/Table/DisplayData";
import { selectStock, useGetStockQuery } from "../../features/stock/stockSlice";
import { setTableData } from "../../features/Table/tableSlice";

import AddItem from "../Models/addItem";
import EditViewItem from "../Models/EditViewItem";
import { useState, useEffect } from "react";
import Fuse from "fuse.js";
import SearchIcon  from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import InventoryTable from "../tables/InventoryTable";


const Inventory = () => {
  const { isLoading } = useGetStockQuery();

  const dispatch = useDispatch();
  const data = useSelector(selectStock);
  const [itemId, setItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  dispatch(setTableData(data));
  
const options = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.2,
  keys: ["itemName", "itemModel"],
}


  const fuse = new Fuse(data, options);

  if(searchTerm.length > 0){
      const results = fuse.search(searchTerm);
      const items = results.map((result) => result.item);
      
      if(items.length > 0){
        
        dispatch(setTableData(items));
   
      }
  }
  else{
    dispatch(setTableData(data))
  }

  const handleSearch = (event) => {
    const { value } = event.target;
     setSearchTerm(prev => prev = value);
    // dispatch(searchTable(searchTerm));
  };

  const handleSetItemId = (item_id) => {
    setItemId(item_id);
    }

  return (
    <div className="inventory">
{/* 
      <div className="custOperations bg-white w-100 p-4 mt-2 d-flex align-items-center" style={{height: '60px'}}>
        
          <div className="form-group has-search w-50 rounded border-0">
            <span className="fa fa-search border-0 form-control-feedback"><SearchIcon /></span>
            <input type="text" className="form-control form-control-input border" placeholder="Search"   onChange={handleSearch} />
          </div>

          <div style={{float: 'inline-end'}}>
          <button
          type="button"
          class="btn btn-sm  btn-warning "
          data-bs-toggle="modal"
          data-bs-target="#addItem"
        >
          <span> */}
            {/* <img src="./icons/inventory (1).png" width="25px" height="25px" /> */}
            {/* <AddIcon sx={{color:'white'}}/>
          </span>{" "}
          Add Item
        </button>
          </div>

      </div>  */}
      <div style={{
        width:"100%",
        height:"100%",
        padding:"1rem"
      }}>
      <InventoryTable />
      </div>


      {/* Add Item Model */}
      <div
        class="modal fade modal-lg modal-dialog-scrollable"
        id="addItem"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabindex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <AddItem />
      </div>

      <EditViewItem 
       itemId={itemId}
       />
    </div>
    // </div>
  );
};

export default Inventory;
