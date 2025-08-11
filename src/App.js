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
import Production from "./../src/app/Components/Production";
import SplashScreen from "./app/Components/pages/SplashScreen";
import InvoiceForm from "./app/documents/InvoiceForm";
import Documents from "./app/Components/pages/Documents";
import PackagePage from "./app/Components/payments/Packages";
import UserLanding from "./app/Components/pages/User/UserLanding";
import Settings from "./app/Components/Settings";

// Auth and Utility Components
import RequireAuth from "./app/auth/RequireAuth";
import PersistLogin from "./app/auth/PersistLogin";
import MissingRoute from "./app/Components/MissingRoute";
import AccessDenied from "./app/Components/pages/User/AccessDenied";


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

          <Route element={<RequireAuth allowedRoles={['admin', 'dashboard']} />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'rawmaterials', 'expenses', 'orders', 'employees']} />}>
            <Route path="production" element={<Production />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'products']} />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'stock']} />}>
            <Route path="stock" element={<ItemsExerpt />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'customers']} />}>
            <Route path="customers" element={<CustomerPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'sales']} />}>
            <Route path="sales" element={<SalesPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="debts" element={<CustomerPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'reports']} />}>
            <Route path="reports" element={<ReportPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'salesdesk']} />}>
            <Route path="pos" element={<PosPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'history']} />}>
            <Route path="history" element={<HistoryPage />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin', 'settings']} />}>
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Routes accessible only to 'admin' */}
          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="documents" element={<Documents />} />
            <Route path="invoiceform" element={<InvoiceForm />} />
            <Route path="packages" element={<PackagePage />} />
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
