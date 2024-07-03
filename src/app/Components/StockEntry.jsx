import { useEffect } from "react";
import { useState } from "react";
import { selectStock } from "../features/stock/stockSlice";
import { useSelector } from "react-redux";
import Fuse from "fuse.js";
import Dropdown from "react-bootstrap/Dropdown";
import Alerts from '../Components/actions/Alerts'
import { selectStockById } from "../features/stock/stockSlice";
import {
  useAddStokMutation,
  useGetStokQuery,
  selectStok,
} from "../features/api/stockSlice";
import { Backdrop, CircularProgress } from "@mui/material";

const StockEntry = () => {

  const {IsLoading:loading,isSuccess:success} = useGetStokQuery();

  const inventory = useSelector(selectStock);
  const [itemList, setItemList] = useState(inventory);
  const [item, setItem] = useState();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(true);

  const handleHide = () => {
    setOpen(false);
  }

  const [addStock, { isLoading, isSuccess, isError, error }] = useAddStokMutation();
  const stockItems = useSelector(selectStok);
  const [totalCost, setTotalCost] = useState(0);
  const [totalStock, setTotalStock] = useState(0);

  const [stockItemQuantity, setStockItemQuantity] = useState(1);
  const [stockItemPrice, setStockItemPrice] = useState(
    item ? item.itemStockPrice : 0
  );
  const [itemSellingPrice, setItemSellingPrice] = useState(
    item ? item.itemLeastPrice : 0
  );
  const [itemSupplier, setItemSupplier] = useState("");

  const onItemsupplierChange = (e) => setItemSupplier(e.target.value);
  const onItemSellingPriceChange = (e) => {
    setItemSellingPrice(e.target.value);
    if(stockItemPrice > itemSellingPrice && (stockItemPrice !== 0 || itemSellingPrice !== 0)){
        handleShow()
    }else{
        handleClose()
    }
  };
  const onItemStockPriceChange = (e) => {
    setStockItemPrice(e.target.value);
    // if(stockItemPrice > itemSellingPrice && (stockItemPrice !== 0 || itemSellingPrice !== 0)){
    //     handleShow()
    // }else{
    //     handleClose()
    // }
  };

  useEffect(()=>{
    if(Number(stockItemPrice) > Number(itemSellingPrice) && (Number(stockItemPrice) !== 0 || Number(itemSellingPrice) !== 0)){
      handleShow()
  }else{
      handleClose()
  }
  },[stockItemPrice,itemSellingPrice]);

  useEffect(() => {
    if(stockItemQuantity !== ""){
      if(Number(stockItemQuantity) <= 0)
      {
        setStockItemQuantity(1)
      }
    }

  }, [stockItemQuantity])

  const onItemQuantityChange = (e) => {
    setStockItemQuantity(e.target.value)
  };

  const handleShow = () => {
    setShow(true);
  };
  const handleClose = () => {
    setShow(false);
  };

if(isLoading){
//  setOpen(true)
}
if(isSuccess){
// setOpen(false)
}

  const options = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    keys: ["itemName", "itemModel"],
  };
  const fuse = new Fuse(inventory, options);

  const selectItem = (e) => {
    const itemId = e.target.value;
    const item = inventory.filter((item) => item.itemId === itemId)[0]
    setItem(item);
    setStockItemPrice(item?item.itemStockPrice:"");
    setItemSellingPrice(item?item.itemLeastPrice:"");
  };

  const calcStockTotals = () => {
    const totalCost = stockItems.reduce(
      (prevValue, currentItem) =>
        prevValue + currentItem.stockItemPrice * currentItem.stockItemQuantity,
      0
    );

    // setTotalStock(Number(totalQty));
    setTotalCost((prev) => prev+totalCost);
  };

  useEffect(() => {
    calcStockTotals();
  }, []);

  const searchItem = (e) => {
    let searchTerm = e.target.value;
    const results = fuse.search(searchTerm);
    const items = results.map((result) => result.item);
    if (items.length > 0) {
      setItemList(items);
    } else {
      setItemList(inventory);
    }
  };

  const handleAddStock = async () => {
    try {
      await addStock({
        stockItemQuantity,
        oldStock: item.itemQuantity,
        stockItem: item.itemId,
        stockItemPrice,
        itemSellingPrice,
        itemSupplier,
      }).unwrap();
      setStockItemQuantity(1)
      setStockItemPrice("")
      setItemSellingPrice("")
      setItemSupplier("")
      setItem("")

    } catch (err) {}
  };

  const StockExcerpty = ({ itemId }) => {
    const item = useSelector((state) => selectStockById(state, Number(itemId)));
    return <div className="fw-bolder">{item != undefined? item?.itemName:""}</div>;
  };

  return (
    <div className="w-100 h-100 stockEntry rounded shadow-sm mb-4">

      <div className="pt-3 ps-3 border-bottom rounded">
{isLoading?
<Backdrop
sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
open={true}
onClick={handleHide}
>
  <CircularProgress color="inherit" />
</Backdrop>:
""
}

        <Dropdown className="mb-5" style={{height: '30px'}} as='div'>
          <Dropdown.Toggle variant="transparent" as="div">
            <div className="input-group mb-3 pe-1">
              <input
                className="form-control py-2 rounded-pill ms-1 pe-3"
                type="search"
                onChange={searchItem}
                placeholder="Select / search items"
                id="search"
              />
              <span className="input-group-append d-none">
                <button
                  className="btn rounded-pill border-o ml-n5"
                  type="button"
                >
                  <i className="fa f-search"></i>
                </button>
              </span>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu
            className=" overflow-auto shadow-sm"
            style={{ height: "300px" }}
            data-mdb-perfect-scrollbar="true"
          >
            {itemList.map((item, index) => {
              return (
                <Dropdown.Item
                  as="option"
                  value={item.itemId}
                  key={index}
                  onClick={selectItem}
                >
                  {item?.itemName}&nbsp;-&nbsp;{item?.itemModel}{" "}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
        <div className="d-flex flex-column pe-3 pb-4 pt-2 mt-4" >
          <div className="form-floating mb-2 mt-2">
            <input
              type="text"
              className="form-control"
              value={item != undefined ? item?.itemName : ""}
              disabled
            />
            <label style={{ fontSize: "1rem" }}>Item name</label>
          </div>
          <div className="form-floating mb-2">
            <input
              type="number"
              className="form-control"
              onChange={onItemQuantityChange}
              value={stockItemQuantity}
            />
            <label style={{ fontSize: "1rem" }}>Item quantity</label>
          </div>
          <div className="form-floating mb-2 ">
            <input
              type="text"
              className="form-control"
              value={stockItemPrice}
              onChange={onItemStockPriceChange}
            />
            <label style={{ fontSize: "1rem" }}>Stock price</label>
          </div>
          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              value={itemSellingPrice}
              onChange={onItemSellingPriceChange}
            />
            <label style={{ fontSize: "1rem" }}>Selling price</label>
          </div>
          {/* {
            show? <div className="alert alert-danger">
                Your stock price is greater than the selling price!<br/>
                This will incur a loss in your business endure to change. 
            </div>:""
          } */}
          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              value={itemSupplier}
              onChange={onItemsupplierChange}
            />
            <label style={{ fontSize: "1rem" }}>Item supplier</label>
          </div>
          <div className="d-flex flex-row justify-content-end">
            {/* {item ? (
              <button
                type="button"
                className="btn btn-md bg-warning"
                onClick={() => {
                  handleAddStock();
                  handleShow();
                }}
              >
                Update Stock
              </button>
            ) : (
              <button type="button" className="btn btn-md bg-warning" disabled>
                 Update Stock
              </button>
            )} */}
          </div>
        </div>
      </div>
      <div className="shadow-sm p-3 bg-light rounded">
        <div className="d-flex justify-content-between align-items-center">

          {item ? (
              <button
                type="button"
                className="btn btn-sm btn-dark text-white"
                onClick={() => {
                  handleAddStock();
                  handleShow();
                }}
              >
                Update Stock
              </button>
            ) : (
              <button type="button" className="btn btn-sm btn-light text-dark" disabled>
                 Update Stock
              </button>
            )}
 <h5 className="text-primary">
            Entries<small className="text-white"></small>
          </h5>
          <span>
            <h6 className="text-danger">Total Stock Price:</h6>
            <span className="fw-bold">UGX{totalCost}</span>
          </span>
        </div>
        {
        isSuccess?
        <Alerts 
        message="Happy Sales!"
        variant="success"
        delay={5000}
        autoHide={true}
        heading='Stock Added succeffuly'
        />
        :""
      }
        <hr className="shadow bg-dander" />  
        <div className="stockEntries pb-3">
          <ol className="list-group list-group-numbered z-2">
            {
            stockItems?
            stockItems.map((item, index) => {
              return (
                <li
                  className="list-group-item d-flex justify-content-between align-items-start"
                  key={index}
                >
                  <div className="ms-2 me-auto">
                    <StockExcerpty itemId={item?.stockItem} />
                    <span className="fw-bold text-warning">
                      Stock Price:{" "}
                    </span>{" "}
                    {item?.stockItemPrice} <br />
                    <span className="fw-bold text-danger">
                      Item Supplier:{" "}
                    </span>{" "}
                    {item?.itemSupplier} <br />
                  </div>
                  <span className="badge bg-primary rounded-pill">
                    {" "}
                    {item?.stockItemQuantity} pieces
                  </span>
                </li>
              );
            }):""}
          </ol>
        </div>
      </div>
   
    </div>
  );
};

export default StockEntry;
