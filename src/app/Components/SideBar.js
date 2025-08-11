import React, { useState } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EnhancedEncryptionIcon from "@mui/icons-material/EnhancedEncryption";
import SourceIcon from "@mui/icons-material/Source";
import InsightsIcon from "@mui/icons-material/Insights";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HelpIcon from "@mui/icons-material/Help";
import { Link, useLocation } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import { Avatar, Divider, Menu, MenuList } from "@mui/material";
import { Add, Approval, Campaign, EditNote, History, HotTub, Inventory, InventorySharp, KeyboardArrowRight, ListRounded, MenuOpen, PointOfSale, Receipt, Report, RequestQuote, Scale, ShoppingCart } from "@mui/icons-material";
import { ChevronDown, ChevronUp, List, MenuButton, MenuButtonFill, Pencil, Person, PersonFill, ReceiptCutoff } from "react-bootstrap-icons";
import logo1 from '../../logos/psfavinobg.png';
import Button from '@mui/material/Button';
// import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Background } from "victory";

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

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };


  const location = useLocation();
  return (

    <div style={styles.sidenav}>
      <div className="logo" style={{marginBottom:"1rem"}}>
        <div>
          <List size={25} />
        </div>
        <div>
          <img src={logo1} width={50} height={50} className='shadow-sm mt-2 mb-2 rounded' />
        </div>
      </div>

      {/* <div style={{ marginTop: "0.1rem" }}>
        <Button sx={{ backgroundColor: "lightBlue", color: "gray", width: "100%", borderRadius: "1rem", display: "flex", gap: "0.3rem", alignItems: "center", justifyContent: "center" }}> <ReceiptCutoff size={30} style={{ marginRight: "0.3rem" }} /> Quick Sell</Button></div> */}
<div style={styles.linkList}>
      <ul style={styles.navList}>
        <li style={styles.navItem}>
        <Link to="dashboard" className="Link nav-link"><a href="#" style={styles.navLink}> <DashboardIcon color="error" className="icons" /> Dashboard</a></Link>
        </li>
       
        <li style={styles.navItem}>
        <Link to="inventory" className="Link nav-link"> <a href="#" style={styles.navLink}>  <Inventory /> Production</a></Link>
        </li>
        <li style={styles.navItem}>
        <Link to="inventory" className="Link nav-link"> <a href="#" style={styles.navLink}>  <Inventory /> Inventory</a></Link>
        </li>

        <li style={styles.navItem}>
        <Link to="pos" className="Link nav-link"> <a href="#" style={styles.navLink}>  <PointOfSale /> Sales Desk</a></Link>
        </li>
        <li style={styles.navItem}>
        <Link to="sales" className="Link nav-link"> <a href="#" style={styles.navLink}>  <Scale /> Sales</a></Link>
        </li>
        <li style={styles.navItem}>
        <Link to="customers" className="Link nav-link"> <a href="#" style={styles.navLink}>  <PersonFill size={25} /> Customers</a></Link>
        </li>
        <li style={styles.navItem}>
        <Link to="reports" className="Link nav-link"> <a href="#" style={styles.navLink}>  <Report /> Reports</a></Link>
        </li>
        <li style={styles.navItem}>
        <Link to="documents" className="Link nav-link"> <a href="#" style={styles.navLink}>  <RequestQuote />  Documents</a></Link>
        </li>
        <li style={styles.navItem}>
          {/* <a href="#" style={styles.navLink}>  <Approval />Debts</a> */}
          <Link to="debts" className="Link nav-link"> <a href="#" style={styles.navLink}>  <Approval /> Debts</a></Link>
        </li>
        <li style={styles.navItem}>
        <Link to="history" className="Link nav-link"> <a href="#" style={styles.navLink}>  <History /> History</a></Link>
        </li>
      </ul>
      </div>

      <button class="cta-button" style={{marginTop:"2rem"}}>
      <Link to="packages" target="_blank" className="Link nav-link"> Upgrade Your Package</Link>
   
</button>

    </div>

    // <div className="sideBarCont">
    //   <div className="logo">
    //     <div>
    //       <List size={25} />
    //     </div>
    //     <div>
    //       <img src={logo1} width={50} height={50} className='shadow-sm mt-2 mb-2 rounded' />
    //     </div>
    //   </div>

    //   <div className="sideBar mt-1 pt-3 shadow-sm" style={{ position: 'relative' }}>
    //     <div style={{ marginTop: "0.1rem" }}>
    //       <Button sx={{ backgroundColor: "lightBlue", color: "gray", width: "100%", borderRadius: "1rem", display: "flex", gap: "0.3rem", alignItems: "center", justifyContent: "center" }}> <ReceiptCutoff size={30} style={{ marginRight: "0.3rem" }} /> Quick Sell</Button></div>

    //     <ul className="pt-1">

    //       <Link to="dashboard" className="Link nav-link">
    //         <li className="active">
    //           <span>
    //             <DashboardIcon className="icons" />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag">Dashboard</span> : ""
    //           }

    //         </li>
    //       </Link>

    //       <Link to="inventory" className="Link nav-link" >
    //         <li className={location.pathname === '/inventory' ? "active" : ""}>
    //           <span>
    //             <Inventory />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag ">  Inventory </span> : ""
    //           }

    //         </li>
    //       </Link>

    //       <Link to="stock" className="Link nav-link" >
    //         <li className={location.pathname === '/stock' ? "active" : ""}>
    //           <span>
    //             <InventorySharp />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag"> Stock </span> : ""
    //           }
    //         </li>
    //       </Link>

    //       <Link to="sales" className="Link nav-link" >
    //         <li className={location.pathname === '/sales' ? "active" : ""}>
    //           <span>
    //             <Scale />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag"> Sales </span> : ""
    //           }

    //         </li>
    //       </Link>

    //       <Link to="debts" className="Link nav-link">
    //         <li className={location.pathname === '/debts' ? "active" : ""}>
    //           <span>
    //             <Approval />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag">  Debts </span> : ""
    //           }

    //         </li>
    //       </Link>

    //       <Link to="history" className="Link nav-link">
    //         <li className={location.pathname === '/history' ? "active" : ""}>
    //           <span>
    //             <History />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag"> History </span> : ""
    //           }

    //         </li>
    //       </Link>

    //       <Link to="customers" className="Link nav-link">
    //         <li className={location.pathname === 'customers' ? "active" : ""}>
    //           <span>
    //             <Person size={25} />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag"> Customer </span> : ""
    //           }

    //         </li>
    //       </Link>

    //       <Link to="invoice" className="Link nav-link">
    //         <li className={location.pathname === 'invoice' ? "active" : ""}>
    //           <span>
    //             <RequestQuote />
    //           </span>
    //           {
    //             resizeMenu ? <span className="tag"> Documents </span> : ""
    //           }

    //         </li>
    //       </Link>

    //     </ul>

    //   </div>
    // </div>
  );
};

const styles = {
  linkList: {
width:'100%',
 height:'60vh',
 overflowY: 'auto'
  },
  sidenav: {
    height: '100vh',
    width: '200px',
    // backgroundColor: '#2c3e50',
    backgroundColor: 'white',
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    // overflowY: "auto",
    // color: '#ecf0f1',
    color: "gray"
  },
  navList: {
    marginTop: '1rem',
    marginBottom: '1rem',
    listStyle: 'none',
    padding: 0,
    margin: 0,
   

  },
  navItem: {
    marginBottom: '10px',
  },
  navLink: {
    textDecoration: 'none',
    // color: '#ecf0f1',
    color: "gray",
    display: 'block',
    padding: '10px',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  dropdownToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  dropdown: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    marginTop: '10px',
    // backgroundColor: '#34495e',
    backgroundColor: 'whitesmoke',
    borderRadius: '5px',
  },
  dropdownItem: {
    padding: '1px',
    transition: 'background-color 0.3s',
  },
};

export default SideBar;
