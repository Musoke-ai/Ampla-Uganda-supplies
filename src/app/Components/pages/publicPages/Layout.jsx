import React, { useEffect } from "react";
import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Landing from "./Landing";
import Contact from "./Contact";
import Privancy from "./Privancy";
import TC from "./TC";
import Login from "./Login";

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
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default Layout;
