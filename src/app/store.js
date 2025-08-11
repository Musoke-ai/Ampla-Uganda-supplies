// store.js

import { configureStore } from "@reduxjs/toolkit";
// Make sure to import your pusherMiddleware
import { pusherMiddleware } from "./features/api/pusherMiddleware";
import itemsReducer from './features/items/itemsSlice';
import tableDataReducer from './features/Table/tableSlice';
import { apiSlice } from "./features/api/apiSlice";
import authReducer from "./auth/authSlice";
import { setupListeners } from "@reduxjs/toolkit/dist/query";

export const store = configureStore({
    reducer: {
        items: itemsReducer,
        tableData: tableDataReducer,
        auth: authReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    // --- THIS IS THE CORRECTED LINE ---
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(apiSlice.middleware, pusherMiddleware), // <-- Add it here
    
    // Note: devTools should be at the top level, not inside middleware
    devTools: false 
})

setupListeners(store.dispatch)