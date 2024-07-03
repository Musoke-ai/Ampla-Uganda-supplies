import React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../DataTable';
import { Button } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import FeedIcon from '@mui/icons-material/Feed';
import Table from '../Table';

const Products = () => {

  const [value, setValue] = useState('1');
  const handleChange = (e, newValue) => {
    setValue(newValue);
  }

  return (
    <div className="customers">
      
      <div className='custNav'>
      
<Button> <span><PersonAddAlt1Icon /></span> Add Item</Button>
<Button><span><ReceiptLongIcon /></span>New Transaction</Button>
<Button><span><ImportContactsIcon /></span>Items Summary</Button>
      </div>

      <div className="custOperations" >

<div className='tOperations'>
  <form className='tform'>
  <input
  type='text'
  placeholder='Search Products'
  />
  <label>Filter</label>
  <select>
    <option>All</option>
    <option>Sales Orders</option>
    <option>Invoices</option>
    <option>Sales Receipt</option>
    <option>Received Payment</option>
    <option>Returns</option>
    <option>Credit Memos</option>
  </select>
  </form>
</div>

     

    </div>


    <div className='tContainer'>
<Table />
      </div>

      <div className='captions'></div>

    </div>
  );
}

export default Products;
