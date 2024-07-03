import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EnhancedEncryptionIcon from "@mui/icons-material/EnhancedEncryption";
import SourceIcon from "@mui/icons-material/Source";
import InsightsIcon from "@mui/icons-material/Insights";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HelpIcon from "@mui/icons-material/Help";
import { Link,  useLocation } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import { Avatar, Divider, Menu } from "@mui/material";
import { Approval, Campaign, EditNote, History, HotTub, Inventory, InventorySharp, KeyboardArrowRight, MenuOpen, Receipt, RequestQuote, Scale, ShoppingCart } from "@mui/icons-material";
import { MenuButton } from "react-bootstrap-icons";
import logo1 from '../../logos/psfavinobg.png';
import Button from '@mui/material/Button';
// import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const SideBar = ({
  handleMenu,
  resizeMenu
}) => {

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };


  const location = useLocation();
  return (
    <div className="sideBarCont">
<div className="logo">
<img src={logo1} width={50} height={50} className='shadow-sm mt-2 mb-2 rounded' />
</div>
      <div className="sideBar mt-1 pt-3 shadow-sm" style={{position: 'relative'}}>
        {/* <div style={{position: 'fixed', top: '60px', left: 5, zIndex: 100}}>
        <button className="btn btn-sm btn-outline-light text-secondary" onClick={handleMenu}><MenuOpen variant='primary' /></button> 
        </div> */}
        <ul className="pt-1">

        <Link to="/dashboard" className="Link nav-link">
          <li className={location.pathname === '/dashboard'? "active" : ""}> 
            <span>
              <DashboardIcon className="icons" />
            </span>
            {
      resizeMenu?<span className="tag">Dashboard</span>:""
            }
            
          </li>
          </Link>

          <Link to="/inventory" className="Link nav-link" >
          <li className={location.pathname === '/inventory'? "active" : ""}>
            <span>
              <Inventory />
            </span>
            {
              resizeMenu? <span className="tag ">  Inventory </span>:""
            }
       
          </li>
          </Link>

          <Link to="/stock"  className="Link nav-link" >
          <li className={location.pathname === '/stock'? "active" : ""}>
            <span>
              <InventorySharp />
            </span>
            {
              resizeMenu?  <span className="tag"> Stock </span> :""
            }
          </li>
          </Link>

          <Link to="/sales"  className="Link nav-link" >
          <li className={location.pathname === '/sales'? "active" : ""}>
            <span>
              <Scale />
            </span>
            {
              resizeMenu? <span className="tag"> Sales </span> :""
            }
         
          </li>
          </Link>

          <Link to="/debts"  className="Link nav-link">
          <li className={location.pathname === '/debts'? "active" : ""}>
            <span>
              <Approval />
            </span>
            {
              resizeMenu? <span className="tag">  Debts </span>:""
            }
         
          </li>
          </Link>

          {/* <Link to="/reports"  className="Link nav-link">
          <li className={location.pathname === '/reports'? "active" : ""}>
            <span>
              <AssessmentIcon />
            </span>
            {
              resizeMenu? <span className="tag"> Statistics </span> :""
            }
         
          </li>
          </Link> */}

          <Link to="/history"  className="Link nav-link">
          <li className={location.pathname === '/history'? "active" : ""}>
            <span>
              <History />
            </span>
            {
              resizeMenu?<span className="tag"> History </span> :""
            }
          
          </li>
          </Link>

          {/* <Link to="/history"  className="Link nav-link">
          <li className={location.pathname === '/history'? "active" : ""}>
            <span>
              <HotTub />
            </span>
            {
              resizeMenu?<span className="tag"> Performance Hub </span> :""
            }
          
          </li>
          </Link> */}

          <Link to="/invoice"    className="Link nav-link">
          <li className={location.pathname === '/invoice'? "active" : ""}>
            <span>
              <RequestQuote  />
            </span>
            {
              resizeMenu?<span className="tag"> Documents </span> :""
            }
          
          </li>
          </Link>

        </ul>
        {/* <Divider sx={{width:"100%",backgroundColor:"gray",height:"0.5px"}} /> */}
        {/* {
          resizeMenu? <h4 className="services">Services</h4>:""
        } */}
       
        <ul>
          {/* <li className="text-muted">
            <span>
              <RequestQuote />
            </span>
            {
              resizeMenu?<>Quotation </>:""
            }
       
          </li>
          <li className="text-muted">
            <span>
            <EditNote /> 
            </span>
            {
              resizeMenu?<>Invoice</>:""
            }
            
          </li> */}
         
        </ul>

        {/* <div className='settings' ><span><SettingsIcon /></span>Settings</div> */}
      </div>
    </div>
  );
};

export default SideBar;
