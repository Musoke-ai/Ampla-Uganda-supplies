import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: 'auth',
    initialState: {
         token: null,
         profile: null,
         users: null,
         roles: [],
         permissions: [],
         userId: ""
    },
    reducers: {
        setCredentials: (state, action) => {
            const { accessToken } = action.payload
            state.token = accessToken
        },
        setUserId: (state, action) => {
            const { user_id } = action.payload
            // console.log("SetRoles: "+roles);
            state.userId = user_id
        },
        setRoles: (state, action) => {
            const { roles } = action.payload
            // console.log("SetRoles: "+roles);
            state.roles = roles
        },
        setPermissions: (state, action) => {
            const { permissions } = action.payload
            // console.log("SetRoles: "+roles);
            state.permissions = permissions
        },
 
        setProfile: (state, action) =>{
            const { data } = action.payload
          
            state.profile = data;
        },
        logOut: (state, action) => {
            state.token = null;
            state.profile = null;
            state.roles = null;
        },
    }
})
export const { setCredentials, logOut, setProfile, setRoles, setPermissions, setUserId } = authSlice.actions

export default authSlice.reducer

export const selectCurrentToken = (state) => state.auth.token
export const selectProfile = (state) => state.auth.profile
export const selectUsers = (state) => state.auth.users
export const selectRoles = (state) => state.auth.roles
export const selectPermissions = (state) => state.auth.permissions
export const selectUserId = (state) => state.auth.userId