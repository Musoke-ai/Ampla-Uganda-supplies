import React from 'react';
import { Link,  useLocation } from "react-router-dom";
import { useSettings } from '../../Settings';

const amplaLogo = `${process.env.PUBLIC_URL || ""}/logos/ampla_logo.png`;

const Header = () => {
  const { settings } = useSettings();
  const location = useLocation();
  const isDark = settings?.theme === "dark";
  const accent = settings?.navbarColor || "#2f8f57";
  return (
    <div>
       <nav
        className="navbar navbar-expand-lg text-white shadow-sm"
        style={{
          backgroundColor: accent,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)"}`,
        }}
       >
  <div className="container-fluid position-relative p-0">
 
    <Link
      className="navbar-brand d-flex align-items-center gap-2 text-white position-absolute start-0 header ps-3"
      to="/"
      style={{height:'60px',width:'220px'}}
    >
      <img
        src={amplaLogo}
        alt="Ampla Uganda"
        width={42}
        height={42}
        className="rounded shadow-sm"
        style={{ objectFit: "cover" }}
      />
      <span className="fw-bold">Ampla Uganda</span>
    </Link>
        
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
