import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: 'auth',
    initialState: {
         token: null,
         profile: null,
    },
    reducers: {
        setCredentials: (state, action) => {
            const { accessToken } = action.payload
            state.token = accessToken
        },
        setProfile: (state, action) =>{
            const { data } = action.payload
          
            state.profile = data;
        },
        logOut: (state, action) => {
            state.token = null;
            state.profile = null;
        },
    }
})
export const { setCredentials, logOut, setProfile } = authSlice.actions

export default authSlice.reducer

export const selectCurrentToken = (state) => state.auth.token
export const selectProfile = (state) => state.auth.profile