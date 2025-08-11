import React, { useState } from "react";
import { People, BoxSeam, Cash, ClipboardCheck, PeopleFill, List, Lock } from "react-bootstrap-icons";
import { Nav, Tab, Container, Row, Col } from "react-bootstrap";
import Summary from './production/Summary';
import AdminAccountManager from "./production/AdminAccountManager";
import OrderManagement from './production/OrderManagement';
import FactoryExpenses from "./production/Expenses";
import EmployeeManagement from "./production/EmployeeManagement";
import ProductionProcess from "./production/ProductionRoutine";
import RawMaterialsTable from "./production/RawmaterialsManagement";
import ProductionFlow from "./production/ProductionFlow";
import RoleWrapper from "../auth/RoleWrapper";
import { Inventory } from "@mui/icons-material";
import { FaDollarSign } from "react-icons/fa";
import { useSelector  } from "react-redux";
import { selectRoles } from "../auth/authSlice";

import { useSettings } from "./Settings";
import { useSearchParams } from 'react-router-dom';

const tabs = [
  // { key: "ProductionSummary", label: "Production Summary", content: <Summary /> },
  { key: "Employees", label: "Employees/Workers", content: <EmployeeManagement />, roles: ['admin', 'employees'], icon: <PeopleFill size={30} /> },
  { key: "RawMaterials", label: "Raw Materials", content: <RawMaterialsTable />, roles: ['admin', 'rawmaterials'], icon: <Inventory size={30} /> },
  { key: "Expenses", label: "Expenses", content: <FactoryExpenses />, roles: ['admin', 'expenses'], icon: <FaDollarSign size={30} /> },
  // { key: "ProductionRoutine", label: "Production Routine", content: <ProductionFlow /> },
  { key: "Orders", label: "Orders", content: <OrderManagement />, roles: ['admin', 'orders'], icon: <List size={30} /> },
  { key: "Accounts", label: "Accounts", content: <AdminAccountManager />, roles: ['admin'], icon: <Lock size={30} /> },
  
  // Easily add more tabs
];

const Production = () => {
  const [searchParams] = useSearchParams();
  console.log("searchParams: "+searchParams.get('tab'));
const matchedTab = tabs?.find(tab => tab?.key === searchParams.get('tab'));
console.log("Tab: "+matchedTab);
// Get the key from the found tab object. This will be `undefined` if no tab was found.
const tabKey = matchedTab?.key;
const { settings } = useSettings();
  const roles = useSelector(selectRoles);
const [activeTab, setActiveTab] = useState(tabKey || tabs?.[0]?.key);
  const [workers, setWorkers] = useState([]);
  const [newWorker, setNewWorker] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [task, setTask] = useState("");
  const [producedUnits, setProducedUnits] = useState("");
  const [payments, setPayments] = useState({});
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");

  const addWorker = () => {
    if (newWorker.trim()) {
      setWorkers([...workers, { name: newWorker, task: "", payment: 0 }]);
      setNewWorker("");
    }
  };

  const recordRawMaterial = () => {
    if (selectedMaterial && materialQuantity) {
      setRawMaterials([...rawMaterials, { material: selectedMaterial, quantity: materialQuantity }]);
      setSelectedMaterial("");
      setMaterialQuantity("");
    }
  };

  const assignTask = () => {
    setWorkers(
      workers.map((worker) =>
        worker.name === selectedWorker ? { ...worker, task } : worker
      )
    );
    setSelectedWorker("");
    setTask("");
  };

  const updatePayment = (workerName, amount) => {
    setPayments({ ...payments, [workerName]: amount });
  };

  return (
   <div>
   <Container className="mt-4">
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
       {/* Pills Navigation */}
<Nav
  variant="pills"
  className="mb-3 justify-content-center p-3 rounded shadow"
  style={{
    // background: 'linear-gradient(135deg, rgba(46,125,50,0.85), rgba(102,187,106,0.85))',
    // background: 'linear-gradient(135deg, #1E4620, #0A1D0C)',
    // background: 'linear-gradient(135deg, #2E7D32, #121E13)',
    background: `${settings.theme==='dark'?'linear-gradient(135deg, #2A3D2B, #1C271D)':'linear-gradient(135deg, rgba(46,125,50,0.85), rgba(102,187,106,0.85))'}`,
    // background: 'linear-gradient(135deg, #2A3D2B, #1C271D)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '16px',
    color: 'white'
  }}
>
  {tabs.map((tab) => (
    <RoleWrapper
      required={tab.roles}
      children={
        <Nav.Item key={tab.key}>
          <Nav.Link
  eventKey={tab.key}
  className={`fw-bold ${activeTab === tab.key ? 'active' : ''}`}
  style={{
    borderRadius: '30px',
    padding: '6px 16px',
    margin: '0 6px',
    backgroundColor: activeTab === tab.key
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(255,255,255,0.1)',
    color: activeTab === tab.key ? '#1b5e20' : 'white',
    fontWeight: activeTab === tab.key ? '700' : '500',
    transition: 'all 0.3s ease',
  }}
>
            <div className="d-flex justify-content-center align-items-center gap-2">
              <div>{tab.icon}</div>
              <div>{tab.label}</div>
            </div>
          </Nav.Link>
        </Nav.Item>
      }
    />
  ))}
</Nav>


        {/* Tab Content */}
        <Tab.Content>
          {tabs.map((tab) => (
            <Tab.Pane eventKey={tab.key} key={tab.key}>
              {/* <h4>{tab.label} Content</h4> */}
              <p>{tab.content}</p>
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </Container>
   </div>
  );
};

export default Production;
