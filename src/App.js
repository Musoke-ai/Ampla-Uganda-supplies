import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import DashBoard from "./app/Components/pages/DashBoard";
import Inventory from "./app/Components/pages/Inventory";
import Reports from "./app/Components/pages/Reports";
import ItemsExerpt from "./app/features/items/ItemsExerpt";
import Sales from "./app/features/items/Sales";
import Debts from "./app/features/items/Debts";
import History from "./app/features/items/History";
import { useEffect } from "react";

import Layout from "../src/app/Components/pages/publicPages/Layout";
import Landing from "../src/app/Components/pages/publicPages/Landing";
import Login from "../src/app/Components/pages/publicPages/Login";
import Contact from "../src/app/Components/pages/publicPages/Contact";
import Privancy from "../src/app/Components/pages/publicPages/Privancy";
import TC from "../src/app/Components/pages/publicPages/TC";
import SignUp from "../src/app/Components/pages/publicPages/SignUp";

import ProtectedLayout from "./app/Components/pages/ProtectedLayout";
import SplashScreen from "./app/Components/pages/SplashScreen";
import Help from "./app/Components/pages/publicPages/Help";
import Invoice from "./app/documents/Invoice";
import InvoiceForm from "./app/documents/InvoiceForm";

function App() {

  return (
    <Routes>
      {/* public routes */}
      {/* New tab routes */}
      <Route path="/privacy" element={<Privancy />} />
      <Route path="/tc" element={<TC />} />
      <Route path="/help" element={<Help />} />
      {/* New tab routes */}

      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* protected routes */}
      <Route exact path="/splashscreen" element={<SplashScreen />} />
      <Route  element={<ProtectedLayout />}>
        <Route exact path="/dashboard" element={<DashBoard />}></Route>
        <Route exact path="/inventory" element={<Inventory />}></Route>
        <Route exact path="/stock" element={<ItemsExerpt />}></Route>
        <Route exact path="/sales" element={<Sales />}></Route>
        <Route exact path="/debts" element={<Debts />}></Route>
        <Route exact path="/reports" element={<Reports />}></Route>
        <Route exact path="/history" element={<History />}></Route>
        <Route exact path="/invoice" element={<Invoice />}></Route>
        <Route exact path="/invoiceform" element={<InvoiceForm />}></Route>
      </Route>
    </Routes>
  );
}

export default App;

// {
  
//       isLoading ?
//       <div className='splashScreen'>
     
//         <ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''  />
//        <br/>
//         <span>Loading...</span>
//         </div>
//    : ""
//    }


