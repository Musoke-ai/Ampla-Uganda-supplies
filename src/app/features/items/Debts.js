import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {VictoryChart, VictoryBar, VictoryStack, VictoryAxis, VictoryLabel } from 'victory'
import { itemAdded } from "./itemsSlice";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import { Box, Container, DialogContent, LinearProgress, TableHead } from "@mui/material";
import ReactLoading from 'react-loading';
import { DataGrid } from "@mui/x-data-grid";
import { useSelector } from "react-redux";
import { format, formatDistance, parse, parseISO } from "date-fns";
import {
  useGetDebtsQuery,
  selectDebt,
  useAddDebtMutation,
  usePayDebtMutation,
} from "../api/debtSlice";
// import { TabContext, TabList, TabPanel } from "@mui/lab";
import  ProgressBar  from "react-bootstrap/ProgressBar";
import Popover from '@mui/material/Popover';
import { Tabs, Tab } from "react-bootstrap";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { selectStockById, selectStock } from "../stock/stockSlice";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import Alerts from "../../Components/actions/Alerts";

const Debts = () => {
  //fetch Debts on loading if not cached
  const { data1, isLoading, isSuccess, isError, error } = useGetDebtsQuery();
  const [
    addDebt,
    {
      data: debtData,
      isLoading: isAddDebtLoading,
      isSuccess: isAddDebtSuccess,
      isError: isAddDebtError,
      error: addDebtError,
    },
  ] = useAddDebtMutation();
  const [
    payDebt,
    {
      isLoading: ispayDebtLoading,
      isSuccess: ispayDebtSuccess,
      isError: ispayDebtError,
      error: payDebtError,
    },
  ] = usePayDebtMutation();

  const dispatch = useDispatch();
  const [navigate, setNavigate] = useState(0);
  const debts = useSelector(selectDebt);
  const inventory = useSelector(selectStock);
  const [selectedItem, setSelectedItem] = useState(null);
  const [indebtItemId, setIndebtItemId] = useState(null);
  const [indebtOwner, setIndebtOwner] = useState(1);
  const [quantityDebted, setQuantityDebted] = useState(1);
  const [atPrice, setAtPrice] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [custName, setCustName] = useState("");
  const [custContact, setCustContact] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custLocation, setCustLocation] = useState("");
  const [payItem, setPayItem] = useState([]);
  const [remBal, setRemBal]  = useState("");
  const [open, setOpen] = useState(false);

  const getSelectedItem = (itemId) => {
    const item = inventory.filter((item) => {
    return  item.itemId === itemId
    })
    setSelectedItem(item[0]);
      }

  const handleOpen = () => {

    setOpen(true);
  }
  const clear = ()=>{
    setRemBal("");
    setPayItem([]);
  }
  const handleClose = () => {
    setOpen(false,clear());
  
  };

  const [amountPaid, setAmountPaid] = useState("");

  useEffect( () => {
    const total = Number(quantityDebted) * Number(atPrice);
    setTotalAmount(total);
  },[atPrice,quantityDebted]);

useEffect( () => {
  if(selectedItem !== null){
    setIndebtItemId(selectedItem.itemId)
    setAtPrice(selectedItem.itemLeastPrice);
  }
},[selectedItem]);

useEffect(() => {
  if(selectedItem !== null){
  if(quantityDebted !== ""){
    if(Number(quantityDebted) > Number(selectedItem.itemQuantity)){
      window.alert("Not enough items in stock! Item quantity available: "+selectedItem.itemQuantity);
      setQuantityDebted(selectedItem.itemQuantity)
    }else if(Number(quantityDebted <= 0)){
      window.alert("Invalid item quantity, enter a value between 1 and "+selectedItem.itemQuantity);
      setQuantityDebted(1)
    }
    else{
      // setQuantityDebted(e.target.value)
    }
  
  }
}
},[quantityDebted]);

  const onQuantityDebtedChange = (e) => {
    setQuantityDebted(e.target.value)
  };
  const onAtPriceChange = (e) => setAtPrice(e.target.value);
  const onInitialDepositChange = (e) => setInitialDeposit(e.target.value);
  const onTotalAmountChange = (e) => setTotalAmount(e.target.value);
  const onEndDateChange = (e) => setEndDate(e.target.value);
  const onCustNameChange = (e) => setCustName(e.target.value);
  const onCustContactChange = (e) => setCustContact(e.target.value);
  const onCustEmailChange = (e) => setCustEmail(e.target.value);
  const onCustLocationChange = (e) => setCustLocation(e.target.value);

  const onAmountPaidChange = (e) => setAmountPaid(e.target.value);
  const canPay = (amountPaid >= 1000?true:false) && (Number(amountPaid) <= Number(remBal)) 

const canAddDebt = ([
  indebtOwner,
  quantityDebted,
  atPrice,
  initialDeposit,
  totalAmount,
  endDate,
  custName,
  custLocation,
].every(Boolean) && !isLoading) || custContact ||  custEmail;

  const handleReset = () => {
    setIndebtItemId("");
    setQuantityDebted("");
    setAtPrice("");
    setInitialDeposit("");
    setTotalAmount("");
    setEndDate("");
    setCustName("");
    setCustContact("");
    setCustEmail("");
    setCustLocation("");
  };

  const handleNavigation = (tab) => {
    setNavigate(tab);
  };

  const handleAddDebt = async () => {
    try {
      await addDebt({
        indebtItemId,
        indebtOwner,
        quantityDebted,
        atPrice,
        initialDeposit,
        totalAmount,
        endDate,
        custName,
        custContact,
        custEmail,
        custLocation,
      }).unwrap();
      handleReset();
    } catch (error) {
    }
  };

  const handlePay = async (debtId) => {
    try {
      await payDebt({
        debtId,
        amountPaid,
      }).unwrap();
     setAmountPaid('');
     setAmountPaid('');
     window.alert("Payment successfully click anyware to hide the pay dialog form thanks");
    } catch (error) {
    }
  }

  const validatePay = (bal) => {
    if( amountPaid > bal){
      setAmountPaid(bal)
    }
  }

const Progress = ({progress}) => {
return (
  <div className="progress" style={{height: '15px', width: '100%'}}>
   <div className={ progress == 100 ? 'ps-1 pe-1 progress bg-success': "ps-1 pe-1 progress bg-warning"} style={{width: `${progress}%`}}>{Math.round(progress)}%</div>
  </div>
)

}

const ItemExerpty = ({itemId}) => {
  const item = useSelector((state) =>
  selectStockById(state, Number(itemId))
);
if(item !== undefined){

  return (<div>{item.itemName}</div>)
}

}

const PayButton = ({bal, item}) => {
  const _item = item;
  const _bal = bal;
 
  return <>
  {
    bal === 0?<Button 
    variant="success"
    className="btn btn-sm btn-success text-white ps-2 pe-2"
    disabled
    >
    Completed
    </Button>:
   <Button aria-describedby='payButton' variant="contained" onClick={() => {
    setRemBal(_bal);
    setPayItem(_item);
    handleOpen();
    }}>
  Pay now
 </Button>
  }
</>
};

const rows = debts;

const columns = [
  {field: 'Entry Date',  renderCell: (cellValues) => {
    return (
format((new Date(cellValues.row.indebtDateCreated)), 'EEE-dd-yyyy')
    );
  }, width: 150, headerClassName: 'gridColHeader' },
  {field: 'item',
  renderCell: (cellValues) => {
    return (
      <ItemExerpty itemId={cellValues.row.indebtItemId} />
    )
  }
  , width: 150, headerClassName: 'gridColHeader' },
  {field:  'Progress', renderCell: (cellValues) => {
    const progress = (Number(cellValues.row.initialDeposit) / Number(cellValues.row.totalAmount))*100
    return (
<Progress progress={progress} />
    );
  },headerClassName: 'gridColHeader'
  },
  {field:  'Pay', renderCell: (cellValues) => {
    const bal = (Number(cellValues.row.totalAmount) - Number(cellValues.row.initialDeposit));
    return (
<PayButton bal = {bal} item={cellValues.row} />
    );
  },
  sortable: false,
  headerClassName: 'gridColHeader'
  },
  {field: 'Days OverDue',
  valueGetter: (params) => {
    const today = format((new Date()),'yyyy.mm.dd');
    const entryDate = format(new Date(params.row.indebtDateCreated),'yyyy.mm.dd');
    const daysPassed = differenceInCalendarDays(
      new Date(),
      new Date(params.row.indebtDateCreated)
    )
    // const entryDate = parse(new Date(split[0]), 'yyyy.mm.dd');
    return daysPassed + ' days';
  }
  , width: 150, headerClassName: 'gridColHeader' },
  {field: 'balance', 
  valueGetter: (params) => {
    return (Number(params.row.totalAmount) - Number(params.row.initialDeposit))
  }
  , width: 150, headerClassName: 'gridColHeader' },
  {field: 'custName', headerName: 'Customer', width: 150, headerClassName: 'gridColHeader' },
  {field: 'custContact', headerName: 'Contact', headerClassName: 'gridColHeader'},
  {field: 'custEmail', headerName: 'Email',width: 250, headerClassName: 'gridColHeader'},
  {field: 'quantityDebted', headerName: 'Quantity', width: 150, headerClassName: 'gridColHeader' },
  {field: 'atPrice', headerName: 'Unit Price', width: 150, headerClassName: 'gridColHeader' },
  {field: 'totalAmount', headerName: 'Total Cost', width: 150, headerClassName: 'gridColHeader' },
  {field: 'Due Date', renderCell: (cellValues) => {
    return (
format((new Date(cellValues.row.endDate)), 'EEE-MMM-yyyy')
    );
  }, width: 150, headerClassName: 'gridColHeader' },
  {field: 'initialDeposit', headerName: 'Initial Deposit', width: 150, headerClassName: 'gridColHeader' },
  ]

  return (
    <div className=" bg-white position-relative debtCont" style={{overflowY: 'hidden'}}>
    <Dialog onClose={handleClose} open={open}>
    <DialogContent style={{width: '400px'}}>
      <h5 className="d-flex flex-row shadow text-white p-2 rounded" style={{backgroundColor: "#1C4E80"}}><span>Pay For: </span> <pan>{<ItemExerpty itemId={payItem.indebtItemId} />}</pan></h5>
 {ispayDebtLoading?<LinearProgress />:""}
 <p>
   <strong>Bal: </strong>{remBal}
 </p>
 <p>
   <input type="text" className="form-control border shadow-sm"  placeholder="Enter Amount"
    value = {amountPaid}
    onChange={(e)=>{
      onAmountPaidChange(e);
      // validatePay(bal);
    }} 
    />
  </p>
  <hr />
  <div className="d-flex align-items-end justify-content-end">
    { 
    canPay?
    <button className="btn btn-primary btn-sm" onClick={()=>{handlePay(payItem.indebtId)}}>Pay</button>:
    <button className="btn btn-primary btn-sm" disabled>Pay</button>
    }
  </div>
  </DialogContent>
    </Dialog>

    {
      isAddDebtSuccess? <Alerts
      message={debtData.message}
      heading={debtData.status}
      autoHide={true}
      delay={4000}
      variant='success'
      />:""
    }

{
  isAddDebtLoading?
      <div className="loaderScreen">
        <div className="position-relative w-100 h-100">
          <div className="LoadingCont">
        <ReactLoading
type="spinningBubbles"
color='royalblue'
width={100}
height={40}
/>
</div>
        </div>

      </div>: ""
      }

      {isLoading ? (
        <div className="alert alert-warning">Data loading...</div>
      ) : (
        ""
      )}
<div>
<Tabs justify className="mb-3 ms-4 position-fixed top-5 w-75 z-2 bg-white">
  <Tab eventKey="view" title={<strong className="">View / Manage Debts</strong>}>
  <Container className="mt-5">
            <div style={{ height: 450, width: '77vw', marginTop: 10}} className="pt-4">
          <DataGrid 
          rows={rows}
          columns={columns}
          getRowId={(row) => row.indebtId}
          />
            </div>
    </Container>
  </Tab>
  <Tab eventKey="newdebt" style={{overflow: 'hidden'}} title={<strong className="">New debt</strong>}>
  <Container className="mt-5" style={{height: '75vh', overflow: 'auto'}}>

  <form className="bg-white p-4 border border-top-0 ms-2 me-2">
          <div className="form-row d-flex flex-row ">
            <div className="form-group required col-md-6 border-0 me-1">
              <label for="inputEmail4" className="control-label">Product</label>
              <select
                type=""
                className="form-control form-select border shadow-sm mt-2 h-50"
                onChange={(e)=>{
                  getSelectedItem(e.target.value);   
                }}
              >
                <option>Select Item </option>
                {
                  inventory.map((item, index) => {
                    return <option key={index} value={item.itemId} >{item.itemName}</option>
                  })
                }
              </select>
            </div>
            <div className="form-group required col-md-6 border-0">
              <label for="inputPassword4" className="control-label">Quantity</label>
              <input
                type="number"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={quantityDebted}
                onChange={onQuantityDebtedChange}
              />
            </div>
          </div>
          <div className="form-row d-flex flex-row">
            <div className="form-group required col-md-6 border-0 me-1">
              <label for="inputEmail4" className="control-label">Unit Cost</label>
              <input
                type="text"
                className="form-control border shadow-sm mt-2"
                id="inputEmail4"
                placeholder="Unit cost"
                value={atPrice}
                onChange={onAtPriceChange}
              />
            </div>
            <div className="form-group col-md-6 border-0">
              <label for="inputPassword4">Total Amount</label>
              <input
              disabled
                type="text"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                placeholder="Total amount"
                value={totalAmount}
                onChange={onTotalAmountChange}
              />
            </div>
          </div>
          <div className="form-group required border-0">
            <label for="inputAddress" className="control-label">Initial Deposit</label>
            <input
              type="text"
              className="form-control border shadow-sm mt-2"
              id="inputAddress"
              placeholder="Initial Deposit"
              value={initialDeposit}
              onChange={onInitialDepositChange}
            />
          </div>
          <div className="form-row d-flex flex-row">
            <div className="form-group required col-md-6 border-0 me-1">
              <label for="inputEmail4" className="control-label">End Date</label>
              <input
                type="date"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={endDate}
                onChange={onEndDateChange}
              />
            </div>
            {/* <div className="form-group required col-md-6 border-0">
              <label for="inputPassword4" className="control-label">Next Deposit On</label>
              <input
                type="date"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={nextDepositOn}
                onChange={onNextDepositOnChange}
              />
            </div> */}
          </div>

          <div className="d-flex flex-row justify-content-center mt-2 mb-2">
            <hr className="bg-light col-4" />
            <strong className="fs-6">Customer Details</strong>
            <hr className="bg-light col-4" />
          </div>

          <div className="form-row d-flex flex-row">
            <div className="form-group required col-md-6 border-0 me-1">
              <label for="inputEmail4" className="control-label">Customer Name</label>
              <input
                type="text"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={custName}
                onChange={onCustNameChange}
              />
            </div>
            <div className="form-group required col-md-6 border-0">
              <label for="inputPassword4" className="control-label">Customer Contact</label>
              <input
                type="text"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={custContact}
                onChange={onCustContactChange}
              />
            </div>
          </div>

          <div className="form-row d-flex flex-row">
            <div className="form-group col-md-6 border-0 me-1">
              <label for="inputEmail4">Customer Email</label>
              <input
                type="email"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={custEmail}
                onChange={onCustEmailChange}
              />
            </div>
            <div className="form-group col-md-6 border-0">
              <label for="inputPassword4">Customer Location</label>
              <input
                type="text"
                className="form-control border shadow-sm mt-2"
                id="inputPassword4"
                value={custLocation}
                onChange={onCustLocationChange}
              />
            </div>
          </div>

          <div className="form-group border-0">
            <div class="form-check d-flex justify-content-center">
              <input
                className="form-check-input shadow-sm mt-2"
                type="checkbox"
                id="gridCheck"
              />
              <label clasName="form-check-label mt-2 ms-1" for="gridCheck">
                Create Alert / Notification
              </label>
            </div>
          </div>
          <div className="d-flex justify-content-between">
            {
              canAddDebt?
              <button 
              type="button"
              className="btn btn-primary"
              onClick={
                (e) => {
                  e.preventDefault()
                  handleAddDebt()
                }
                }
            >
         Save debt 
            </button>:
             <button 
             disabled
             type="button"
             className="btn btn-primary"
           >
          Save debt
           </button>
            }
            <button
              type="button"
              className="btn btn-danger"
              onClick={
                (e) => {
                  e.preventDefault()
                  handleReset()
                }
              }
            >
              Clear Form
            </button>
          </div>
        </form>

  </Container>
  </Tab>
  <Tab eventKey="alerts" title={<strong>Alerts & Notifications</strong>}>
   <Container className="mt-5">

          <div className="card w-100 h-100 shadow-sm">
            <div className="card-header d-flex justify-content-between">
              <Form>
                <Form.Check type="switch" label="Alerts" />
              </Form>
              <Form>
                <Form.Check type="switch" label="SMS Notifications" />
              </Form>
            </div>
            <div className="card-body" style={{height: "55vh", overflow: 'auto'}}>
             <div className="row">
              <div className="col-6 h-100 border-end shadow-sm">

             
              </div>
              <div className="col-6 h-100">

              </div>
             </div>
            </div>
            <div className="card-footer d-flex justify-content-between">
              <button className="btn btn-sm btn-primary">Create Alert</button>
              <button className="btn btn-sm btn-primary">create SMS notification</button>
            </div>
          </div>

   </Container>
  </Tab>
</Tabs>
</div>
    </div>
  );
};

export default Debts;
