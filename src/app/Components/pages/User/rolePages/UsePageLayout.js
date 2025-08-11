import React from 'react';
import EmployeeManagement from '../../../production/EmployeeManagement';
import FactoryExpenses from '../../../production/Expenses';
import { Container, Card, Row, Col } from "react-bootstrap";
// import { useAuth } from "./authContext";
// import AccessDenied from "./AccessDenied";
// Import icons from react-icons
import { 
    FaUserShield, FaIndustry, FaBoxes, FaUserTag, FaMoneyBillWave, 
    FaUserCog, FaCheckCircle, FaHeadset, FaUsers 
  } from "react-icons/fa";
  import { Route, Routes, Outlet } from "react-router-dom";
  import { Link } from "react-router-dom";
  import UserNavbar from '../UserNavbar';

const UserPageLayout = () => {
 
  return (
    <div>
 <div>
  <UserNavbar />
 </div>
 <div>
  
 </div>
    </div>
  );
}

export default UserPageLayout;
