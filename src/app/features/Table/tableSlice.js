import { createSlice } from "@reduxjs/toolkit";
import Fuse from "fuse.js";

const options = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    keys: ["itemName", "itemModel"],
  }

const initialState = {
    data: {},
};

const tableSlice = createSlice({
    name:'tableData',
    initialState,
    reducers:{
        setTableData: (state, action)=>{
        state.data=action.payload;

        },
        searchTable: (state, action) =>{
            const fuse = new Fuse(state.Data, options);
            const searchTerm = action.payload;
            if(searchTerm.length > 0){
                const results = fuse.search(searchTerm);
                const items = results.map((result) => result.item);
                
                if(items.length > 0){
                    window.alert(state.data[0])
                state.data = items;
                // return {
                //     ...state,
                //     data: items
                // }
                }
            }
            else{
            //    state.data = state.Data;
            }
        }
    }
})

export const getTableData = (state) => state.tableData.data;
// export const getTableColumns = (state) => state.tableData.columns;
export const { searchTable, setTableData } =  tableSlice.actions;

export default tableSlice.reducer;