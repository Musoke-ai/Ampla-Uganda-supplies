import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { tags as commonTags } from "../../features/api/commonTags";

import { useSettings } from "../Settings";
// import { PUSHER_SUBSCRIBE } from './app/pusherMiddleware'; // Note: Adjust this path if it's incorrect
import { PUSHER_SUBSCRIBE, PUSHER_UNSUBSCRIBE } from "../../features/api/pusherMiddleware";

import SidebarSample from "../sideBarSample";
import NavBar from "../NavBar";

// It's best practice to define constants like this outside the component
// so they are not recreated on every render.
const subscriptions = [
  { 
    channel: 'stock-channel', 
    tag: commonTags.inventory,
    events: ['stock-created', 'stock-updated', 'stock-deleted']
  },
  { 
    channel: 'customers-channel', 
     tag: commonTags.inventory,
    events: ['customer-created', 'customer-updated', 'customer-deleted']
  },
  { 
    channel: 'employees-channel', 
     tag: commonTags.inventory,
    events: ['employee-created', 'employee-updated', 'employee-deleted']
  },
  { 
    channel: 'employeeList-channel', 
     tag: commonTags.inventory,
    events: ['list-updated', 'list-cleared'] // Example events for a list
  },
  { 
    channel: 'orders-channel', 
     tag: commonTags.inventory,
    events: ['order-created', 'order-updated', 'order-cancelled']
  },
  { 
    channel: 'rawmaterials-channel', 
     tag: commonTags.inventory,
    events: ['rawmaterial-created', 'rawmaterial-updated', 'rawmaterial-deleted']
  },
  { 
    channel: 'rawmaterialsregister-channel', 
     tag: commonTags.inventory,
    events: ['intake-logged', 'intake-updated', 'intake-removed']
  },
  { 
    channel: 'expense-channel', 
     tag: commonTags.inventory,
    events: ['expense-created', 'expense-updated', 'expense-deleted']
  },
  { 
    channel: 'entries-channel', 
     tag: commonTags.inventory, 
    events: [
      'stock-added',
      'stock-created',
      'item-updated',
      'sale-created',
      'sale-deleted',
      'item-deleted'
    ] 
  },
];

const ProtectedLayout = () => {
  const dispatch = useDispatch();
  const { settings } = useSettings();
  const location = useLocation();
  const [resizeMenu, setResizeMenu] = useState(true);

  // This useEffect hook handles the Pusher subscriptions.
  // It runs only once when the ProtectedLayout component mounts,
  // because its dependency array `[dispatch]` is stable.
  useEffect(() => {
    // Subscribe to all required channels when the component mounts
    console.log('Subscribing to Pusher channels...');
    subscriptions.forEach(sub => {
      dispatch({ type: PUSHER_SUBSCRIBE, payload: sub });
    });

  }, [dispatch]); // Dependency array ensures this runs only once on mount/unmount

  const divStyle = {
    zIndex: 1,
    backgroundColor: settings.theme === 'dark' ? '#1A202C' : '#FFFFFF',
    color: settings.theme === 'dark' ? '#FFFFFF' : '#111111'
  };

  return (
    <main className="main">
      <SidebarSample />
      <div className='mainContent'>
        <NavBar />
        <div className='landingArea' style={divStyle}>
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default ProtectedLayout;
