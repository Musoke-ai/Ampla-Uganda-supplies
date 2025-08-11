import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

// Icon imports
import DashboardIcon from "@mui/icons-material/Dashboard";
import Factory from "@mui/icons-material/Factory";
import PointOfSale from "@mui/icons-material/PointOfSale";
import Inventory from "@mui/icons-material/Inventory";
import People from "@mui/icons-material/People";
import Scale from "@mui/icons-material/Scale";
import History from "@mui/icons-material/History";
import Settings from "@mui/icons-material/Settings";
import { BarChart, Clipboard2Data } from "react-bootstrap-icons";
import { Menu as MenuIcon, Close } from "@mui/icons-material";

// A mock RoleWrapper for demonstration purposes.
const RoleWrapper = ({ children, required }) => {
  const currentUserRole = 'admin'; // Replace with your actual auth logic
  if (required.includes(currentUserRole)) {
    return <>{children}</>;
  }
  return null;
};

// CSS is embedded directly and uses unique class names to avoid conflicts.
const sidebarStyles = `
  .hamburger-menu_standalone {
    display: none; /* Hidden by default */
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 1100; /* Must be on top of everything */
    background: #1e293b;
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .side_bar_embedded {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    padding-top: 20px;
    background-color: #1e293b;
    color: #e2e8f0;
    z-index: 1000;
    transition: transform 0.3s ease-in-out;
    width: 190px;
  }

  .side_bar_embedded.mobile {
    transform: translateX(-100%);
  }

  .side_bar_embedded.mobile.mobile-open {
    transform: translateX(0);
  }

  .sidebar-overlay_embedded {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .toggle-btn-mobile_embedded {
    background: none; border: none; color: white; cursor: pointer;
    align-self: flex-end; padding: 15px;
  }
  .toggle-btn-mobile_embedded svg { font-size: 2rem; }
  .toggle-btn-desktop_embedded { display: none; }

  .menu_embedded {
    list-style: none; padding: 0; margin: 0;
    flex-grow: 1; overflow-y: auto;
  }
  
  .menu-group-title_embedded {
    padding: 15px 25px 5px 25px;
    font-size: 0.8rem;
    font-weight: bold;
    color: #94a3b8; /* Lighter grey for titles */
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  /* Hide title for collapsed desktop view */
  .side_bar_embedded.collapsed .menu-group-title_embedded {
    display: none;
  }

  .menu-item_embedded { padding: 0; }

  .nav-link_embedded {
    display: flex; align-items: center; padding: 12px 25px;
    color: #e2e8f0; text-decoration: none;
    transition: background-color 0.2s ease, color 0.2s ease;
    border-left: 4px solid transparent;
  }

  .nav-link_embedded:hover { background-color: #334155; color: #ffffff; }

  .nav-link_embedded.active {
    background-color: #1b5e20 ; color: #ffffff; font-weight: 600;
    border-left: 4px solid #a5b4fc;
  }

  .nav-link_embedded .icon_embedded {
    margin-right: 20px; font-size: 1.5rem; display: flex; align-items: center;
  }

  .nav-link_embedded .text_embedded { font-size: 1rem; }

  @media (min-width: 768px) {
    .hamburger-menu_standalone { display: none; } /* Hide hamburger on desktop */

    .side_bar_embedded {
      position: relative; transform: none !important;
      transition: width 0.3s ease-in-out;
    }

    .side_bar_embedded.expanded { width: 190px; }
    .side_bar_embedded.collapsed { width: 90px; }
    .side_bar_embedded.collapsed .text_embedded { display: none; }
    .side_bar_embedded.collapsed .nav-link_embedded { justify-content: center; padding: 15px 10px; }
    .side_bar_embedded.collapsed .icon_embedded { margin-right: 0; }

    .toggle-btn-mobile_embedded, .sidebar-overlay_embedded { display: none; }

    .toggle-btn-desktop_embedded {
      display: block; position: absolute; top: 20px; right: -15px;
      width: 30px; height: 30px; border-radius: 50%; background-color: #4f46e5;
      color: white; border: none; cursor: pointer; z-index: 10;
      display: flex; align-items: center; justify-content: center;
    }
  }
`;

const SideBarSample = () => {
  // All state is now managed internally
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Grouped menu items
  const menuGroups = [
    {
      groupName: "Main",
      items: [
        { name: "Dashboard", icon: <DashboardIcon />, location: "dashboard", roles: ['admin'] },
        { name: "Production", icon: <Factory />, location: "production", roles: ['admin', 'productionmanager'] },
      ]
    },
    {
      groupName: "Management",
      items: [
        { name: "Products", icon: <Inventory />, location: "inventory", roles: ['admin', 'inventorymanager', 'productionmanger'] },
        { name: "Stock", icon: <Clipboard2Data />, location: "Stock", roles: ['admin', 'inventorymanager', 'productionmanager'] },
        { name: "Customers", icon: <People />, location: "customers", roles: ['admin', 'accountant'] },
      ]
    },
    {
      groupName: "Accountability",
      items: [
        { name: "Sales Desk", icon: <PointOfSale />, location: "pos", roles: ['admin', 'accountant'] },
        { name: "Sales", icon: <Scale />, location: "sales", roles: ['admin', 'accountant'] },
        { name: "Reports", icon: <BarChart />, location: "reports", roles: ['admin', 'accountant'] },
        { name: "History", icon: <History />, location: "history", roles: ['admin', 'accountant'] },
      ]
    },
    {
      groupName: "", // An empty group for items at the end
      items: [
        { name: "Settings", icon: <Settings />, location: "settings", roles: ['admin', 'accountant'] },
      ]
    }
  ];

  const toggleMobileNav = () => setIsMobileNavOpen(prev => !prev);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isMobileNavOpen) {
        setIsMobileNavOpen(false); // Close mobile nav if resizing to desktop
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileNavOpen]);

  const handleLinkClick = () => {
    if (isMobile) {
      toggleMobileNav();
    }
  };

  const sidebarClasses = `side_bar_embedded 
    ${isMobile ? 'mobile' : ''} 
    ${isMobileNavOpen ? 'mobile-open' : ''} 
    ${!isMobile && isExpanded ? 'expanded' : 'collapsed'}`;

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* Hamburger menu is now part of this component */}
      {isMobile && !isMobileNavOpen && (
        <button className="hamburger-menu_standalone" onClick={toggleMobileNav}>
          <MenuIcon />
        </button>
      )}

      {isMobile && isMobileNavOpen && <div className="sidebar-overlay_embedded" onClick={toggleMobileNav}></div>}

      <div className={sidebarClasses}>
        {!isMobile ? (
          <button className="toggle-btn-desktop_embedded" onClick={() => setIsExpanded(prev => !prev)}>
            {isExpanded ? "<<" : ">>"}
          </button>
        ) : (
          <button className="toggle-btn-mobile_embedded" onClick={toggleMobileNav}>
            <Close />
          </button>
        )}
        
        <ul className="menu_embedded">
          {menuGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {group.groupName && (
                <li className="menu-group-title_embedded">{group.groupName}</li>
              )}
              {group.items.map((item) => (
                <RoleWrapper key={item.name} required={item.roles}>
                  <li className="menu-item_embedded" onClick={handleLinkClick}>
                    <NavLink to={item.location} className="nav-link_embedded">
                      <span className="icon_embedded">{item.icon}</span>
                      {(isExpanded || isMobile) && <span className="text_embedded">{item.name}</span>}
                    </NavLink>
                  </li>
                </RoleWrapper>
              ))}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </>
  );
};

export default SideBarSample;



