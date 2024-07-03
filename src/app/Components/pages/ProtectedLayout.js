import { useState } from "react";
import { Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";

import SideBar from "../SideBar";
import NavBar from "../NavBar";
import QuickSales from "../Models/quickSales";

import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../auth/authSlice";

const ProtectedLayout = () => {
  const accessToken = useSelector(selectCurrentToken)
  const location = useLocation();

  const [resizeMenu,setResizeMenu] = useState(true);

  const handleMenu = () => {
  setResizeMenu(prev => !prev);
  }
  

  return (
    accessToken?
  <main className="main">
    <SideBar  
    handleMenu={handleMenu}
    resizeMenu={resizeMenu}
    />
    <div className='mainContent' >
    <NavBar />
    <div className='landingArea'>
        <Outlet />
{/* Quick Sale Model */}
  <div
      class="modal fade"
      id="quickSale"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="staticBackdropLabel"
      aria-hidden="true"
    >
      <QuickSales />
    </div>
    {/* style={{backgroundColor: '#DADADA'}} */}
        <div className="captions mt-2 shadow" >
      <div className="itemActions">
        <button
          type="button"
          className="btn btn-primary bg-primary"
          style={{border:'0px'}}
          data-bs-toggle="modal"
          data-bs-target="#quickSale"
        >
          Quick Sell
        </button>
      </div>
    </div>

    </div>

    </div>

  </main>: <Navigate to='/login' state={{from: location}} replace />
  );
};

export default ProtectedLayout;