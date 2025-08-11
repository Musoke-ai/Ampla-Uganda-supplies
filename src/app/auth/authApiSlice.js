
import { apiSlice } from "../features/api/apiSlice";
import { logOut, setCredentials, setRoles, setProfile, setPermissions, setUserId } from "./authSlice";
import {tags as commonTags } from '../features/api/commonTags'

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        register: builder.mutation({
            query: credentials => ({
                url:'/register',
                method: 'POST',
                body: { ...credentials }
            }),
            providesTags: [commonTags.profile],
        }),
        login: builder.mutation({
            query: credentials => ({
                url:'/login',
                method: 'POST',
                body: { ...credentials }
            }),
            invalidatesTags: [commonTags.profile],
        }),
        getProfile: builder.query({
            query: () => '/profile',
              async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data }  =
                    await queryFulfilled
                    dispatch(setProfile({data}))
                } catch (err) {
                  
                }
            },
           providesTags: [commonTags.profile,commonTags.inventory],
        }),

        updateProfile: builder.mutation({
            query: credentials => ({
                url:'/updateprofile',
                method: 'POST',
                body: { ...credentials }
            }),
            invalidatesTags: [commonTags.profile],
        }),
        upLoadLogo: builder.mutation({
            query: logo => ({
                url:'/uploadlogo',
                method: 'POST',
                body: {...logo}
            }),
            invalidatesTags: [commonTags.profile],
        }),
        sendLogout: builder.mutation({
            query: () => ({
                url: '/logout',
                method: 'POST'
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled
                    dispatch(logOut())
                    dispatch(apiSlice.util.resetApiState())
                } catch (err) {
                 
                }
            },
            invalidatesTags: [commonTags.profile],
        }),
        refresh: builder.mutation({
            query: () => ({
                url: '/refreshtoken',
                method: 'GET'
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    const { accessToken, roles, permissions, user_id } = data?.data || {}
                    dispatch(setCredentials({ accessToken }))
                    dispatch(setUserId({ user_id }))
                    //make sure always the roles is an array
                    dispatch(setRoles({ roles: Array.isArray(roles) ? roles : [roles] }));
                    dispatch(setPermissions({ permissions: Array.isArray(permissions) ? permissions : [permissions] }));
                } catch (err) {
                    console.log(err)
                }
            },
            invalidatesTags: [commonTags.profile],
        }),

    }) 
})

export const {
    useRegisterMutation,
    useLoginMutation,
    useGetProfileQuery,
    useSendLogoutMutation,
    useUpdateProfileMutation,
    useUpLoadLogoMutation,
    useRefreshMutation,
} = authApiSlice