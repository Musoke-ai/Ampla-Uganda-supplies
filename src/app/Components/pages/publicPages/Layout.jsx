import React, { useEffect } from "react";
import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
} from "react-router-dom";

const Layout = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "auto" }}>
      <Outlet />
    </div>
  );
};

export default Layout;
