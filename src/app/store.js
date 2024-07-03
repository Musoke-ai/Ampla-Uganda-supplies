import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
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
    middleware: getDefaultMiddleware => 
                 getDefaultMiddleware().concat(apiSlice.middleware),
                 devTools: false
})

setupListeners(store.dispatch)