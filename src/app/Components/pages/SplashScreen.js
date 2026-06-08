// src/components/SplashScreen.js

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ReactLoading from 'react-loading';

// --- Auth Imports ---
import { selectCurrentToken, selectRoles } from "../../auth/authSlice";
import { useGetProfileQuery } from "../../auth/authApiSlice";

// --- Import ALL your extended API slices for prefetching ---
import { extendedApiSlice } from "../../features/stock/stockSlice";
import { extendedCatApiSlice } from "../../features/api/categorySlice";
import { extendedDebtApiSlice } from "../../features/api/debtSlice";
import { extendedHistoryApiSlice } from "../../features/api/historySlice";
import { extendedSalesApiSlice } from "../../features/api/salesSlice";
import { extendedStatsApiSlice } from "../../features/api/statisticsSlice";
import { extendedStokApiSlice } from "../../features/api/stockSlice";
import { extendedUserApiSlice } from "../../features/api/userSlice";
import { extendedCustomersApiSlice } from "../../features/api/customers";
import { extendedRawMaterialsApiSlice } from "../../features/api/rawmaterialsSlice";
import { extendedEmployeesApiSlice } from "../../features/api/employeesSlice";
import { extendedExpensesApiSlice } from "../../features/api/ExpensesSlice";
import { extendedEmployeeDailyListApiSlice } from "../../features/api/dailyEmployeesList";
import { extendedOrderApiSlice } from "../../features/api/orderSlice";
import { extendedRawMaterialsIntakeApiSlice } from "../../features/api/rawmaterialsIntakeSlice";
import { extendedAccountsApiSlice } from "../../features/api/AccountsSlice";
import { extendedNotificationsApiSlice } from "../../features/api/notificationsSlice";

// Define a prioritized mapping of roles to their corresponding paths.
const roleToPathMap = [
  { role: 'dashboard', path: '/home/dashboard' },
  { role: 'salesdesk', path: '/home/pos' },
  { role: 'production', path: '/home/production' },
  { role: 'products', path: '/home/inventory' },
  { role: 'customers', path: '/home/customers' },
  { role: 'stock', path: '/home/stock' },
  { role: 'sales', path: '/home/sales' },
  { role: 'reports', path: '/home/reports' },
  { role: 'settings', path: '/home/settings' },
];

const SplashScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    isLoading,
    isSuccess,
    isError,
    error
  } = useGetProfileQuery();

  const token = useSelector(selectCurrentToken);
  const roles = useSelector(selectRoles);

  useEffect(() => {
    const prefetchAllData = () => {
      console.log("Starting to prefetch all application data...");
      dispatch(extendedApiSlice.util.prefetch('getStock', undefined, { force: true }));
      dispatch(extendedCatApiSlice.util.prefetch('getCategories', undefined, { force: true }));
      dispatch(extendedDebtApiSlice.util.prefetch('getDebts', undefined, { force: true }));
      dispatch(extendedHistoryApiSlice.util.prefetch('getHistory', undefined, { force: true }));
      dispatch(extendedSalesApiSlice.util.prefetch('getSales', undefined, { force: true }));
      dispatch(extendedStatsApiSlice.util.prefetch('getStatistics', undefined, { force: true }));
      dispatch(extendedStokApiSlice.util.prefetch('getStok', undefined, { force: true }));
      dispatch(extendedUserApiSlice.util.prefetch('getProfile', undefined, { force: true }));
      dispatch(extendedCustomersApiSlice.util.prefetch('getCustomers', undefined, { force: true }));
      dispatch(extendedRawMaterialsApiSlice.util.prefetch('getRawMaterials', undefined, { force: true }));
      dispatch(extendedEmployeesApiSlice.util.prefetch('getEmployees', undefined, { force: true }));
      dispatch(extendedExpensesApiSlice.util.prefetch('getExpenses', undefined, { force: true }));
      dispatch(extendedEmployeeDailyListApiSlice.util.prefetch('getEmployeeDailyList', undefined, { force: true }));
      dispatch(extendedOrderApiSlice.util.prefetch('getOrders', undefined, { force: true }));
      dispatch(extendedRawMaterialsIntakeApiSlice.util.prefetch('getRawMaterialsList', undefined, { force: true }));
      dispatch(extendedAccountsApiSlice.util.prefetch('getAccounts', undefined, { force: true }));
      dispatch(extendedNotificationsApiSlice.util.prefetch('getNotifications', undefined, { force: true }));
      console.log("Prefetching dispatched for all endpoints.");
    };
    prefetchAllData();
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && token && roles) {
      console.log("Auth successful. Roles from selector:", roles);
      for (const mapping of roleToPathMap) {
        if (roles.includes(mapping.role)) {
          console.log(`Match found! Role: '${mapping.role}', navigating to: '${mapping.path}'`);
          navigate(mapping.path);
          return;
        }
      }
      if (roles.includes('admin')) {
        console.log("User is admin, navigating to default dashboard.");
        navigate('/home/dashboard');
      } else {
        console.error("Navigation failed: No matching role found for this user.");
      }
    }
  }, [isSuccess, roles, token, navigate]);

  if (isLoading) {
    return (
      <div className='splashScreen'>
        <ReactLoading type="spokes" color="gray" height={'40px'} width={'40px'} />
        <br />
        <span>Verifying credentials...</span> <br />
        <div>Preparing your data, please wait.</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='splashScreen'>
        <h2>An Error Occurred</h2>
        <p>{error?.data?.message || 'Failed to authenticate. Please try logging in again.'}</p>
      </div>
    );
  }

  return (
    <div className='splashScreen'>
      <ReactLoading type="spokes" color="gray" height={'40px'} width={'40px'} />
      <br />
      <span>Redirecting...</span>
    </div>
  );
};

export default SplashScreen;
