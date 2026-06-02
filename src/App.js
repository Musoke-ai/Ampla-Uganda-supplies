import "./App.css";
import { Routes, Route } from "react-router-dom";

// Layout Components
import Layout from "../src/app/Components/pages/publicPages/Layout";
import ProtectedLayout from "./app/Components/pages/ProtectedLayout";
import UserPageLayout from "./app/Components/pages/User/rolePages/UsePageLayout";

// Page Components
import Dashboard from "./app/Components/production/DashBoard";
import InventoryPage from "./app/Components/pages/InventorySample";
import ReportPage from "./app/Components/pages/ReportsSample";
import ItemsExerpt from "./app/features/items/ItemsExerpt";
import SalesPage from "./app/Components/pages/Sales";
import HistoryPage from "./app/Components/pages/History";
import CustomerPage from "./app/Components/CustomerPage";
import PosPage from "./app/Components/pages/GeminiPos";
import Login from "../src/app/Components/pages/publicPages/Login";
import ForgetPassword from "./app/Components/pages/publicPages/ForgetPassword";
import Production from "./../src/app/Components/Production";
import SplashScreen from "./app/Components/pages/SplashScreen";
import InvoiceForm from "./app/documents/InvoiceForm";
import Documents from "./app/Components/pages/Documents";
import BranchesPage from "./app/Components/pages/BranchesPage";
import UserLanding from "./app/Components/pages/User/UserLanding";
import Settings from "./app/Components/Settings";
import AssistantWorkspace from "./app/Components/pages/AssistantWorkspace";
import HelpGuide from "./app/Components/pages/HelpGuide";
import ImportsPage from "./app/Components/pages/ImportsPage";
import StaffManagementPage from "./app/Components/pages/StaffManagementPage";

// Auth and Utility Components
import RequireAuth from "./app/auth/RequireAuth";
import PersistLogin from "./app/auth/PersistLogin";
import MissingRoute from "./app/Components/MissingRoute";
import AccessDenied from "./app/Components/pages/User/AccessDenied";

const ALL_APP_ROLES = [
  "superadmin",
  "developer",
  "admin",
  "dashboard",
  "rawmaterials",
  "expenses",
  "orders",
  "employees",
  "batches",
  "categories",
  "products",
  "stock",
  "customers",
  "sales",
  "creditsales",
  "reports",
  "salesdesk",
  "history",
  "settings",
  "productionmanager",
  "productionmanger",
  "inventorymanager",
  "accountant",
];

const ROLE_ACCESS = {
  dashboard: ["admin", "dashboard"],
  production: [
    "admin",
    "rawmaterials",
    "expenses",
    "orders",
    "employees",
    "productionmanager",
    "productionmanger",
  ],
  inventory: ["admin", "products", "inventorymanager", "productionmanger"],
  stock: ["admin", "stock", "inventorymanager", "productionmanager", "productionmanger"],
  customers: ["admin", "customers", "accountant"],
  sales: ["admin", "sales", "accountant"],
  reports: ["admin", "reports", "accountant"],
  pos: ["admin", "salesdesk", "accountant"],
  history: ["admin", "history", "accountant"],
  settings: ALL_APP_ROLES,
  staff: ["superadmin", "developer", "admin"],
  assistant: ALL_APP_ROLES,
  help: ALL_APP_ROLES,
  imports: [
    "superadmin",
    "developer",
    "admin",
    "products",
    "stock",
    "inventorymanager",
    "productionmanager",
    "productionmanger",
    "customers",
    "accountant",
  ],
};

function App() {
  return (
    <Routes>
      {/*
      =================================================================
      | Public Routes                                                 |
      | These routes are accessible to everyone.                      |
      =================================================================
      */}
      <Route element={<Layout />}>
        <Route path="/" element={<Login />} />
        <Route path="/magic-login" element={<ForgetPassword />} />
        <Route path="/help" element={<HelpGuide publicPage />} />
      </Route>

      {/*
      =================================================================
      | User-Specific Public Routes (No Main Layout)                  |
      =================================================================
      */}
      <Route path="/userpage" element={<UserLanding />} />
      <Route path="/userpagelayout" element={<UserPageLayout />}>
        {/* Nested routes for the user page layout can go here */}
      </Route>

      {/*
      =================================================================
      | Protected Routes                                              |
      | These routes require authentication and authorization.        |
      =================================================================
      */}
      <Route element={<PersistLogin />}>
        {/* SplashScreen can be used to show a loading state while checking auth */}
        <Route path="/prefetch" element={<SplashScreen />} />

        {/* All routes within ProtectedLayout require a user to be logged in */}
        <Route path="/home" element={<ProtectedLayout />}>

          {/* Each feature route is wrapped in `RequireAuth` to check for specific user roles.
              This is a standard and secure pattern in React Router v6 for role-based access control. */}

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.dashboard} />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.production} />}>
            <Route path="production" element={<Production />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.inventory} />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.stock} />}>
            <Route path="stock" element={<ItemsExerpt />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.imports} />}>
            <Route path="imports" element={<ImportsPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.customers} />}>
            <Route path="customers" element={<CustomerPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.sales} />}>
            <Route path="sales" element={<SalesPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="debts" element={<CustomerPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.reports} />}>
            <Route path="reports" element={<ReportPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.pos} />}>
            <Route path="pos" element={<PosPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.history} />}>
            <Route path="history" element={<HistoryPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.settings} />}>
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.staff} />}>
            <Route path="staff" element={<StaffManagementPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.assistant} />}>
            <Route path="assistant" element={<AssistantWorkspace />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={ROLE_ACCESS.help} />}>
            <Route path="help" element={<HelpGuide />} />
          </Route>

          {/* Routes accessible only to 'admin' */}
          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="branches" element={<BranchesPage />} />
            <Route path="documents" element={<Documents />} />
            <Route path="invoiceform" element={<InvoiceForm />} />
          </Route>

        </Route>
      </Route>

      {/*
      =================================================================
      | Special & Fallback Routes                                     |
      =================================================================
      */}
      <Route path="/accessDenied" element={<AccessDenied />} />
      {/* This catch-all route handles any undefined paths */}
      <Route path="*" element={<MissingRoute />} />
    </Routes>
  );
}

export default App;
