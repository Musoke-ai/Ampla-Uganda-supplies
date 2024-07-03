import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const ITEMS_URL = "https://www.fgm-tools.com/stock/fetchProducts";

const initialState = {
    items: [],
    status:'idle',
    error: null
}

export const fetchItems = createAsyncThunk('items/fetchItems', async () => {
    try{
        const response = await axios.get(ITEMS_URL)
        return [...response.products];
    }catch (err) {
        return err.message;
    }
})

const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
     
    },
    extraReducers (builder) {
        builder
        .addCase(fetchItems.pending, (state, action) => {
            state.status = 'loading'
        })
        .addCase(fetchItems.fulfilled, (state, action) => {
            state.status = 'succeeded'
            const loadedItems = action.payload;
            state.items = state.items.concat(loadedItems)
        })
        .addCase(fetchItems.rejected, (state, action) => {
              state.status = 'failed'
              state.error = action.error.message
        })
    }
})

export const selectAllItems = (state) => state.items.items; 
export const getItemsStatus = (state) => state.items.status; 
export const getItemsError = (state) => state.items.error; 

export const { itemAdded } = itemsSlice.actions;

export default itemsSlice.reducer