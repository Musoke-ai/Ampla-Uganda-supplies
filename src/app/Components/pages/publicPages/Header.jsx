import React from 'react';
import { Link,  useLocation } from "react-router-dom";
import logo from '../../../../logos/pslogo.png'

const Header = () => {
  const location = useLocation();
  return (
    <div>
       <nav className="navbar navbar-expand-lg text-white shadow-sm" style={{backgroundColor: '#1C4E80'}}>
  <div className="container-fluid position-relative p-0">
 
    <div className="navbar-brand fs-4 text-white bg-danger position-absolute start-0 header" href="#" style={{height:'60px',width:'220px'}} >
    <Link className='nav-link w-100 h-100' to='/'></Link>
        </div>
        
    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse justify-content-end" id="navbarText">
        <ul className="navbar-nav float-end mb-2 mb-lg-0 text-white">
        <li  className={location.pathname === '/'? "border-bottom shadow-sm border-primary nav-item" : "nav-item"}>
          <Link className="nav-link text-white" to="/" > <span >Home</span> </Link>  
        </li>
           <li  className={location.pathname === '/help'? "border-bottom shadow-sm border-primary nav-item" : "nav-item"}>
          <Link className="nav-link text-white" to="/help" > <span >Help</span> </Link>  
        </li>
        <li  className={location.pathname === '/contact'? "border-bottom shadow-sm border-primary nav-item" : "nav-item"}>
          <Link className="nav-link text-white" to="/contact" > <span > Contact</span> </Link>  
        </li>
        <li  className={location.pathname === '/login'? "border-bottom shadow-sm border-primary nav-item" : "nav-item"}>
          <Link className="nav-link text-white" to="/login" > <span > Login</span> </Link>  
        </li>

        <li className="nav-item">
<a className='nav-link disabled text-white' href="#">V1.1<small><sup className='text-success fw-bold'>Whats's new?</sup></small>

</a>
        </li>

      </ul>
    </div>
  </div>
</nav>
    </div>
  );
}

export default Header;
