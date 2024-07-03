import React from 'react';
import { getTableData } from './tableSlice';
import { setData } from './tableSlice';
import { useDispatch, useSelector} from "react-redux";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import SalesExcerpt from '../../Components/excerpts/SalesExcerpt';
import CategoryExcerpty from '../../Components/excerpts/CategoryExcerpty';
import { PencilFill } from 'react-bootstrap-icons';

const DisplayData = ({
  setItemToView
})=>{

const rows = useSelector(getTableData);
const columns = [
  {field: 'itemName', headerName: 'Name',width: 200, headerClassName: 'gridColHeader' },
  {field: 'itemModel', headerName: 'Model', headerClassName: 'gridColHeader'},
  {field: 'Category', renderCell: (cellValues)=>{
    return(<CategoryExcerpty catId={cellValues.row.itemCategoryId} />)
  }, headerClassName: 'gridColHeader',width:200},
  {field: 'itemSize', headerName: 'Size', headerClassName: 'gridColHeader'},
  {field: 'itemLeastPrice', headerName: 'Unit Price',width: 150, headerClassName: 'gridColHeader'},
  {field: 'itemQuantity', headerName: 'Items On Hand', width: 200, headerClassName: 'gridColHeader'},
  {field: 'Total Sales', 
  renderCell: (cellValues) => {
    return(
      <SalesExcerpt itemId={cellValues.row.itemId} />
    )
  }
  , width: 150, headerClassName: 'gridColHeader'},
  {field: 'Credit Status',
  renderCell: (cellValues) => {
    return( <div className='d-flex'><SalesExcerpt itemId={cellValues.row.itemId} saleType="debt" />&nbsp;<span>items</span></div> )
  },
  width: 150, headerClassName: 'gridColHeader'},
  {field: 'Edit', 
renderCell: (cellValues) => {
  return (
    <button
    type='button'
    className='btn btn-transparent btn-sm'
    data-bs-toggle="offcanvas"
    data-bs-target="#viewItemDetails"
    aria-controls="offcanvasRight"
    // variant='contained'
    onClick={(e)=>{
      setItemToView(cellValues.row.itemId);
    }}
    >
<PencilFill className='text-dark'/>
    </button>
  );
}, headerClassName: 'gridColHeader',
sortable: false

},
  ]

return(
  <div className='container ps-2' style={{ height: 400, width: '100%' }}>
{rows?

  <DataGrid
  slotProps={{ toolbar: GridToolbar}}
  className='ms-2 shadow'
    rows={rows}
    rowSelection='single'
    columns={columns}
    getRowId={(row) => row.itemId}
    initialState={{
      pagination: {
        paginationModel: { page: 0, pageSize: 5 },
      },
    }}
    pageSizeOptions={[5, 10]}
  />
  :
  <div className="text-center text-muted d-flex flex-row justify-content-center align-items-center h-100" style={{width: '100%'}}><div>Inventory Empty</div></div>
}

</div>
);

}


export default DisplayData;
