
// src/components/SplashScreen.js

import { useEffect, useState } from 'react';
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

    // **NEW**: State to track the prefetching process
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [prefetchError, setPrefetchError] = useState(null);

    // This query handles the initial authentication check
    const {
        isLoading: isProfileLoading,
        isSuccess: isProfileSuccess,
        isError: isProfileError,
        error: profileError
    } = useGetProfileQuery();

    const token = useSelector(selectCurrentToken);
    const roles = useSelector(selectRoles);

    // This single useEffect now handles both prefetching and navigation sequentially.
    useEffect(() => {
        const handleDataAndNavigate = async () => {
            // We only proceed if the initial profile fetch was successful.
            if (isProfileSuccess && token && roles) {
                setIsPrefetching(true); // Start prefetching state
                setPrefetchError(null); // Reset any previous errors

                try {
                    console.log("Starting to prefetch all application data...");

                    // **MODIFICATION**: We now collect all prefetch dispatches into an array of promises.
                    // The `dispatch` of a thunk returns a promise we can await.
                    const prefetchPromises = [
                        dispatch(extendedApiSlice.util.prefetch('getStock', undefined, { force: true })),
                        dispatch(extendedCatApiSlice.util.prefetch('getCategories', undefined, { force: true })),
                        dispatch(extendedDebtApiSlice.util.prefetch('getDebts', undefined, { force: true })),
                        dispatch(extendedHistoryApiSlice.util.prefetch('getHistory', undefined, { force: true })),
                        dispatch(extendedSalesApiSlice.util.prefetch('getSales', undefined, { force: true })),
                        dispatch(extendedStatsApiSlice.util.prefetch('getStatistics', undefined, { force: true })),
                        dispatch(extendedStokApiSlice.util.prefetch('getStok', undefined, { force: true })),
                        dispatch(extendedUserApiSlice.util.prefetch('getProfile', undefined, { force: true })),
                        dispatch(extendedCustomersApiSlice.util.prefetch('getCustomers', undefined, { force: true })),
                        dispatch(extendedRawMaterialsApiSlice.util.prefetch('getRawMaterials', undefined, { force: true })),
                        dispatch(extendedEmployeesApiSlice.util.prefetch('getEmployees', undefined, { force: true })),
                        dispatch(extendedExpensesApiSlice.util.prefetch('getExpenses', undefined, { force: true })),
                        dispatch(extendedEmployeeDailyListApiSlice.util.prefetch('getEmployeeDailyList', undefined, { force: true })),
                        dispatch(extendedOrderApiSlice.util.prefetch('getOrders', undefined, { force: true })),
                        dispatch(extendedRawMaterialsIntakeApiSlice.util.prefetch('getRawMaterialsList', undefined, { force: true })),
                        dispatch(extendedAccountsApiSlice.util.prefetch('getAccounts', undefined, { force: true })),
                        dispatch(extendedNotificationsApiSlice.util.prefetch('getNotifications', undefined, { force: true })),
                    ];
                    
                    // **MODIFICATION**: `Promise.all` waits for every prefetch to complete.
                    await Promise.all(prefetchPromises);
                    console.log("All data prefetched successfully.");

                    // **MODIFICATION**: Navigation logic now runs AFTER all promises have resolved.
                    console.log("Auth and prefetch successful. Roles from selector:", roles);
                    for (const mapping of roleToPathMap) {
                        if (roles.includes(mapping.role)) {
                            console.log(`Match found! Role: '${mapping.role}', navigating to: '${mapping.path}'`);
                            navigate(mapping.path);
                            return; // Exit after finding the first matching role
                        }
                    }

                    if (roles.includes('admin')) {
                        console.log("User is admin, navigating to default dashboard.");
                        navigate('/home/dashboard');
                    } else {
                        console.error("Navigation failed: No matching role found for this user.");
                        setPrefetchError("You don't have a default page assigned to your role.");
                    }

                } catch (error) {
                    console.error("A critical error occurred during data prefetching:", error);
                    setPrefetchError("Failed to load required application data. Please try logging in again.");
                } finally {
                    setIsPrefetching(false); // End prefetching state regardless of outcome
                }
            }
        };

        handleDataAndNavigate();

    }, [isProfileSuccess, token, roles, navigate, dispatch]);


    // --- Render Logic ---

    // Primary loading for initial credential check
    if (isProfileLoading) {
        return (
            <div className='splashScreen'>
                <ReactLoading type="spokes" color="gray" height={'40px'} width={'40px'} />
                <br />
                <span>Verifying credentials...</span>
            </div>
        );
    }

    // Handle authentication error
    if (isProfileError) {
        return (
            <div className='splashScreen'>
                <h2>Authentication Error</h2>
                <p>{profileError?.data?.message || 'Failed to authenticate. Please try logging in again.'}</p>
            </div>
        );
    }

    // Handle data pre-fetching error
    if (prefetchError) {
        return (
            <div className='splashScreen'>
                <h2>Application Error</h2>
                <p>{prefetchError}</p>
            </div>
        );
    }
    
    // Show a loading screen while prefetching is in progress or about to navigate
    return (
        <div className='splashScreen'>
            <ReactLoading type="spokes" color="gray" height={'40px'} width={'40px'} />
            <br />
            <span>{isPrefetching ? 'Preparing your data...' : 'Redirecting...'}</span>
        </div>
    );
};

export default SplashScreen;

// // src/components/SplashScreen.js

// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import ReactLoading from 'react-loading';

// // --- Auth Imports ---
// // We now import selectRoles as the source of truth for user permissions.
//  import { selectCurrentToken, selectRoles } from "../../auth/authSlice";
// import { useGetProfileQuery } from "../../auth/authApiSlice";

// // --- Import ALL your extended API slices for prefetching ---
// import { extendedApiSlice } from "../../features/stock/stockSlice";
// import { extendedCatApiSlice } from "../../features/api/categorySlice";
// import { extendedDebtApiSlice } from "../../features/api/debtSlice";
// import { extendedHistoryApiSlice } from "../../features/api/historySlice";
// import { extendedSalesApiSlice } from "../../features/api/salesSlice";
// import { extendedStatsApiSlice } from "../../features/api/statisticsSlice";
// import { extendedStokApiSlice } from "../../features/api/stockSlice";
// import { extendedUserApiSlice } from "../../features/api/userSlice";
// import { extendedCustomersApiSlice } from "../../features/api/customers";
// import { extendedRawMaterialsApiSlice } from "../../features/api/rawmaterialsSlice";
// import { extendedEmployeesApiSlice } from "../../features/api/employeesSlice";
// import { extendedExpensesApiSlice } from "../../features/api/ExpensesSlice";
// import { extendedEmployeeDailyListApiSlice } from "../../features/api/dailyEmployeesList";
// import { extendedOrderApiSlice } from "../../features/api/orderSlice";
// import { extendedRawMaterialsIntakeApiSlice } from "../../features/api/rawmaterialsIntakeSlice";
// import { extendedAccountsApiSlice } from "../../features/api/AccountsSlice";
// import { extendedNotificationsApiSlice } from "../../features/api/notificationsSlice";


// // Define a prioritized mapping of roles to their corresponding paths.
// const roleToPathMap = [
//   { role: 'dashboard', path: '/home/dashboard' },
//   { role: 'salesdesk', path: '/home/pos' },
//   { role: 'production', path: '/home/production' },
//   { role: 'products', path: '/home/inventory' },
//   { role: 'customers', path: '/home/customers' },
//   { role: 'stock', path: '/home/stock' },
//   { role: 'sales', path: '/home/sales' },
//   { role: 'reports', path: '/home/reports' },
//   { role: 'settings', path: '/home/settings' },
// ];


// const SplashScreen = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const {
//     isLoading,
//     isSuccess,
//     isError,
//     error
//   } = useGetProfileQuery();

//   const token = useSelector(selectCurrentToken);
//   // **MODIFICATION**: Get roles directly from the specified selector.
//   const roles = useSelector(selectRoles);

//   // This useEffect runs ONCE to pre-fetch all necessary data into the cache.
//   useEffect(() => {
//     const prefetchAllData = () => {
//       console.log("Starting to prefetch all application data...");
//       dispatch(extendedApiSlice.util.prefetch('getStock', undefined, { force: true }));
//       dispatch(extendedCatApiSlice.util.prefetch('getCategories', undefined, { force: true }));
//       dispatch(extendedDebtApiSlice.util.prefetch('getDebts', undefined, { force: true }));
//       dispatch(extendedHistoryApiSlice.util.prefetch('getHistory', undefined, { force: true }));
//       dispatch(extendedSalesApiSlice.util.prefetch('getSales', undefined, { force: true }));
//       dispatch(extendedStatsApiSlice.util.prefetch('getStatistics', undefined, { force: true }));
//       dispatch(extendedStokApiSlice.util.prefetch('getStok', undefined, { force: true }));
//       dispatch(extendedUserApiSlice.util.prefetch('getProfile', undefined, { force: true }));
//       dispatch(extendedCustomersApiSlice.util.prefetch('getCustomers', undefined, { force: true }));
//       dispatch(extendedRawMaterialsApiSlice.util.prefetch('getRawMaterials', undefined, { force: true }));
//       dispatch(extendedEmployeesApiSlice.util.prefetch('getEmployees', undefined, { force: true }));
//       dispatch(extendedExpensesApiSlice.util.prefetch('getExpenses', undefined, { force: true }));
//       dispatch(extendedEmployeeDailyListApiSlice.util.prefetch('getEmployeeDailyList', undefined, { force: true }));
//       dispatch(extendedOrderApiSlice.util.prefetch('getOrders', undefined, { force: true }));
//       dispatch(extendedRawMaterialsIntakeApiSlice.util.prefetch('getRawMaterialsList', undefined, { force: true }));
//       dispatch(extendedAccountsApiSlice.util.prefetch('getAccounts', undefined, { force: true }));
//       dispatch(extendedNotificationsApiSlice.util.prefetch('getNotifications', undefined, { force: true }));
//       console.log("Prefetching dispatched for all endpoints.");
//     };
    
//     prefetchAllData();

//   }, [dispatch]);

//   // This useEffect handles navigation. It now depends on `roles` from the selector.
//   useEffect(() => {
//     // We check `isSuccess` to ensure authentication was confirmed before navigating.
//     if (isSuccess && token && roles) {
//       console.log("Auth successful. Roles from selector:", roles);

//       for (const mapping of roleToPathMap) {
//         if (roles.includes(mapping.role)) {
//           console.log(`Match found! Role: '${mapping.role}', navigating to: '${mapping.path}'`);
//           navigate(mapping.path);
//           return; 
//         }
//       }

//       if (roles.includes('admin')) {
//         console.log("User is admin, navigating to default dashboard.");
//         navigate('/home/dashboard');
//       } else {
//         console.error("Navigation failed: No matching role found for this user.");
//       }
//     }
//   }, [isSuccess, roles, token, navigate]); // **MODIFICATION**: `roles` is now in the dependency array.

  
//   if (isLoading) {
//     return (
//       <div className='splashScreen'>
//         <ReactLoading type="spokes" color="gray" height={'40px'} width={'40px'} />
//         <br />
//         <span>Verifying credentials...</span> <br />
//         <div>Preparing your data, please wait.</div>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className='splashScreen'>
//         <h2>An Error Occurred</h2>
//         <p>{error?.data?.message || 'Failed to authenticate. Please try logging in again.'}</p>
//       </div>
//     );
//   }

//   // A generic redirecting screen while the navigation effect runs.
//   return (
//     <div className='splashScreen'>
//       <ReactLoading type="spokes" color="gray" height={'40px'} width={'40px'} />
//       <br />
//       <span>Redirecting...</span>
//     </div>
//   );
// };

// export default SplashScreen;  

